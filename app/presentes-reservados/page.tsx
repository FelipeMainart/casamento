'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import products from '../../lib/products.json';
import { GiftReservationRecord, rsvpRequest } from '../../lib/rsvps';

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PresentesReservadosPage() {
  const [reservations, setReservations] = useState<GiftReservationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'reserved' | 'all' | 'available'>('reserved');
  const [query, setQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await rsvpRequest({ method: 'GET' });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as {
        giftReservations?: GiftReservationRecord[];
      };
      setReservations(data.giftReservations || []);
    } catch {
      setError('Não foi possível carregar os presentes reservados no momento. Tente atualizar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const reservationMap = useMemo(() => {
    const map = new Map<string, GiftReservationRecord>();
    for (const r of reservations) {
      map.set(r.product_id, r);
    }
    return map;
  }, [reservations]);

  const enrichedProducts = useMemo(() => {
    return products.map(p => ({
      ...p,
      reservation: reservationMap.get(p.id) || null,
    }));
  }, [reservationMap]);

  const stats = useMemo(() => {
    const reservedItems = enrichedProducts.filter(p => p.reservation !== null);
    const availableItems = enrichedProducts.filter(p => p.reservation === null);
    const totalReservedValue = reservedItems.reduce((sum, p) => sum + (p.price || 0), 0);
    const percent = Math.round((reservedItems.length / products.length) * 100);
    return {
      reservedCount: reservedItems.length,
      availableCount: availableItems.length,
      totalCount: products.length,
      totalReservedValue,
      percent,
    };
  }, [enrichedProducts]);

  const filtered = useMemo(() => {
    const normalizedQuery = query
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const list = enrichedProducts.filter(item => {
      if (filter === 'reserved' && !item.reservation) return false;
      if (filter === 'available' && item.reservation) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        item.name,
        item.category,
        item.reservation?.guest_name || '',
      ]
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    if (filter === 'reserved') {
      return [...list].sort((a, b) => {
        const tA = a.reservation ? new Date(a.reservation.created_at).getTime() : 0;
        const tB = b.reservation ? new Date(b.reservation.created_at).getTime() : 0;
        return tB - tA;
      });
    }

    return list;
  }, [enrichedProducts, filter, query]);

  async function handleRelease(productId: string, productName: string, guestName: string) {
    const confirmed = window.confirm(
      `Deseja liberar o presente "${productName}" (reservado por ${guestName}) para que volte a ficar disponível na lista?`
    );
    if (!confirmed) return;

    setReleasingId(productId);
    try {
      const res = await rsvpRequest({
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setReservations(prev => prev.filter(r => r.product_id !== productId));
      }
    } finally {
      setReleasingId(null);
    }
  }

  const formattedTextReport = useMemo(() => {
    const reserved = enrichedProducts.filter(p => p.reservation !== null);
    const available = enrichedProducts.filter(p => p.reservation === null);

    const lines: string[] = [
      '==================================================',
      '   PRESENTES RESERVADOS — FELIPE & INGRID',
      '==================================================',
      `Reservados: ${stats.reservedCount} de ${stats.totalCount} (${stats.percent}%)`,
      `Ainda disponíveis: ${stats.availableCount}`,
      `Valor estimado reservado: ${money(stats.totalReservedValue)}`,
      '--------------------------------------------------',
      '',
      'QUEM VAI DAR O QUÊ (RESERVADOS):',
    ];

    if (reserved.length === 0) {
      lines.push('(Nenhum presente foi reservado até o momento)');
    } else {
      reserved.forEach((item, idx) => {
        const priceStr = item.price !== null ? money(item.price) : 'Consultar na loja';
        lines.push(
          `${idx + 1}. ${item.name} (${item.category} — ${priceStr})`
        );
        lines.push(
          `   • Reservado por: ${item.reservation?.guest_name} em ${formatDateTime(item.reservation?.created_at || '')}`
        );
        lines.push('');
      });
    }

    if (available.length > 0) {
      lines.push('--------------------------------------------------');
      lines.push(`AINDA DISPONÍVEIS (${available.length}):`);
      available.forEach((item, idx) => {
        const priceStr = item.price !== null ? money(item.price) : 'Consultar na loja';
        lines.push(`${idx + 1}. ${item.name} (${item.category} — ${priceStr})`);
      });
      lines.push('');
    }

    lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    return lines.join('\r\n');
  }, [enrichedProducts, stats]);

  async function copyTextReport() {
    try {
      await navigator.clipboard.writeText(formattedTextReport);
      setCopyFeedback('Lista de presentes copiada em texto!');
      setTimeout(() => setCopyFeedback(''), 4000);
    } catch {
      setShowTextPreview(true);
      setCopyFeedback('Selecione e copie o texto no quadro abaixo.');
    }
  }

  function downloadTxtReport() {
    const blob = new Blob([formattedTextReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'presentes-reservados-felipe-e-ingrid.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadCsvReport() {
    const header = [
      'Status',
      'ID',
      'Presente',
      'Categoria',
      'Valor Referencia',
      'Reservado Por',
      'Data da Reserva',
      'Link da Loja',
    ];
    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = enrichedProducts.map(item => [
      item.reservation ? 'Reservado' : 'Disponível',
      item.id,
      item.name,
      item.category,
      item.price !== null ? money(item.price) : 'Consultar na loja',
      item.reservation?.guest_name || '—',
      item.reservation ? formatDateTime(item.reservation.created_at) : '—',
      item.url,
    ].map(escapeCsv).join(','));

    const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'presentes-reservados-felipe-e-ingrid.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="guestlist-page">
      <header className="guestlist-header subpage-header">
        <a className="brand" href="/" aria-label="Voltar ao início">
          F<span>&</span>I
        </a>
        <span className="header-date">PAINEL DOS NOIVOS</span>
        <a className="subpage-back-link" href="/">
          ← Voltar ao site
        </a>
      </header>

      <main className="guestlist-main">
        {/* Abas de alternância entre Lista de Presença e Presentes Reservados */}
        <nav className="couple-panel-tabs" aria-label="Painéis do casal">
          <a href="/presenca" className="panel-tab">
            ✓ Lista de Presença (Confirmados)
          </a>
          <a href="/presentes-reservados" className="panel-tab active" aria-current="page">
            🎁 Presentes (Quem vai dar o quê)
          </a>
        </nav>

        <div className="guestlist-intro">
          <div>
            <p className="eyebrow">
              <span className="little-star" aria-hidden="true">✳</span> ACOMPANHAMENTO DE PRESENTES
            </p>
            <h1>
              Quem vai dar <em>o quê.</em>
            </h1>
            <p className="guestlist-subtitle">
              Veja quais convidados já reservaram cada presente da lista e quais itens continuam disponíveis.
            </p>
          </div>
          <button
            type="button"
            className="guestlist-refresh-btn"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? 'Atualizando…' : '↻ Atualizar lista'}
          </button>
        </div>

        {/* Cards de Resumo */}
        <section className="guestlist-stats" aria-label="Resumo dos presentes">
          <div className="stat-card highlight">
            <span className="stat-label">PRESENTES RESERVADOS</span>
            <strong className="stat-value">{stats.reservedCount}</strong>
            <span className="stat-detail">
              de {stats.totalCount} itens da lista ({stats.percent}%)
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">AINDA DISPONÍVEIS</span>
            <strong className="stat-value">{stats.availableCount}</strong>
            <span className="stat-detail">Livres para escolha no site</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">VALOR ESTIMADO RESERVADO</span>
            <strong className="stat-value stat-value-money">{money(stats.totalReservedValue)}</strong>
            <span className="stat-detail">Soma dos valores de referência</span>
          </div>

          <div className="stat-card muted">
            <span className="stat-label">TOTAL CADASTRADO</span>
            <strong className="stat-value">{stats.totalCount}</strong>
            <span className="stat-detail">Sugestões para o novo lar</span>
          </div>
        </section>

        {/* Exportação em Texto */}
        <section className="guestlist-export-box" aria-label="Exportar presentes reservados">
          <div className="export-box-info">
            <h2>Exportar relação de presentes em texto</h2>
            <p>
              Copie a lista completa mostrando quem escolheu cada presente e quais ainda estão disponíveis.
            </p>
          </div>
          <div className="export-box-actions">
            <button type="button" className="button primary" onClick={copyTextReport}>
              Copiar lista em texto
              <span aria-hidden="true">📋</span>
            </button>
            <button type="button" className="export-secondary-btn" onClick={downloadTxtReport}>
              Baixar .TXT ↓
            </button>
            <button type="button" className="export-secondary-btn" onClick={downloadCsvReport}>
              Baixar Excel (.CSV) ↓
            </button>
            <button
              type="button"
              className="export-secondary-btn"
              onClick={() => setShowTextPreview(prev => !prev)}
            >
              {showTextPreview ? 'Ocultar texto' : 'Ver texto na tela'}
            </button>
          </div>
          {copyFeedback && (
            <p className="export-feedback" role="status">
              {copyFeedback}
            </p>
          )}
          {showTextPreview && (
            <div className="export-text-preview">
              <textarea
                readOnly
                value={formattedTextReport}
                rows={14}
                onClick={e => e.currentTarget.select()}
                aria-label="Texto formatado dos presentes reservados"
              />
            </div>
          )}
        </section>

        {/* Busca e Filtros */}
        <section className="guestlist-controls">
          <label className="search-field guestlist-search">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="6.5" />
              <path d="m15 15 6 6" />
            </svg>
            <span className="sr-only">Buscar presente ou convidado</span>
            <input
              type="search"
              placeholder="Buscar por nome do convidado, nome do presente ou categoria..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </label>

          <div className="category-filters" role="group" aria-label="Filtrar presentes">
            <button
              type="button"
              aria-pressed={filter === 'reserved'}
              onClick={() => setFilter('reserved')}
            >
              Reservados ({stats.reservedCount})
            </button>
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              Todos da lista ({stats.totalCount})
            </button>
            <button
              type="button"
              aria-pressed={filter === 'available'}
              onClick={() => setFilter('available')}
            >
              Ainda disponíveis ({stats.availableCount})
            </button>
          </div>
        </section>

        {error && (
          <div className="catalogue-error" role="alert">
            {error}
            <button type="button" onClick={loadData}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* Lista de Cards de Presentes */}
        {loading ? (
          <div className="guestlist-empty">
            <p>Carregando reservas de presentes…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="guestlist-empty">
            <h3>
              {filter === 'reserved' && stats.reservedCount === 0
                ? 'Nenhum presente reservado ainda'
                : 'Nenhum item encontrado'}
            </h3>
            <p>
              {filter === 'reserved' && stats.reservedCount === 0
                ? 'Assim que um convidado reservar um presente no site, o nome dele aparecerá aqui.'
                : 'Experimente alterar o filtro acima ou limpar a busca.'}
            </p>
            {filter === 'reserved' && stats.reservedCount === 0 && (
              <button
                type="button"
                className="guestlist-refresh-btn"
                style={{ marginTop: '16px' }}
                onClick={() => setFilter('all')}
              >
                Ver todos os {stats.totalCount} presentes da lista
              </button>
            )}
          </div>
        ) : (
          <div className="guestlist-cards">
            {filtered.map(item => {
              const res = item.reservation;
              return (
                <article
                  key={item.id}
                  className={'guest-card gift-admin-card' + (!res ? ' is-available' : '')}
                >
                  <div className="gift-admin-header">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="gift-admin-thumb"
                        width="72"
                        height="72"
                        loading="lazy"
                      />
                    ) : (
                      <div className="gift-admin-thumb placeholder">🎁</div>
                    )}
                    <div className="gift-admin-title-wrap">
                      <span
                        className={
                          'guest-status-badge ' + (res ? 'confirmed' : 'available-badge')
                        }
                      >
                        {res ? '✓ Reservado' : 'Livre • Disponível'}
                      </span>
                      <span className="gift-admin-category">{item.category}</span>
                      <h3 className="guest-name">{item.name}</h3>
                    </div>
                  </div>

                  {res ? (
                    <div className="guest-party-box gift-giver-box">
                      <span className="party-box-title">QUEM VAI PRESENTEAR</span>
                      <div className="gift-giver-name">{res.guest_name}</div>
                      <span className="gift-giver-date">
                        Reservado em {formatDateTime(res.created_at)}
                      </span>
                    </div>
                  ) : (
                    <div className="guest-party-box gift-free-box">
                      <span>Ainda não foi reservado por nenhum convidado.</span>
                    </div>
                  )}

                  <div className="guest-meta">
                    <span>
                      <strong>Valor de ref.:</strong>{' '}
                      {item.price !== null ? money(item.price) : 'Consultar na loja'}
                    </span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      Ver anúncio na {item.store} ↗
                    </a>
                  </div>

                  {res && (
                    <div className="guest-card-footer">
                      <button
                        type="button"
                        className="guest-delete-btn"
                        disabled={releasingId === item.id}
                        onClick={() => handleRelease(item.id, item.name, res.guest_name)}
                      >
                        {releasingId === item.id ? 'Liberando…' : 'Liberar presente'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
