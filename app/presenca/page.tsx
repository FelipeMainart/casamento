'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RsvpRecord, rsvpRequest } from '../../lib/rsvps';

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

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const full = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${full}`;
}

export default function PresencaPage() {
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'confirmed' | 'all' | 'declined'>('confirmed');
  const [query, setQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await rsvpRequest({ method: 'GET' });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { rsvps: RsvpRecord[] };
      setRsvps(data.rsvps || []);
    } catch {
      setError('Não foi possível carregar a lista de presença no momento. Tente atualizar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  async function handleDelete(item: RsvpRecord) {
    const confirmed = window.confirm(
      `Deseja remover o registro de "${item.guest_name}" da lista?`
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      const res = await rsvpRequest({
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
      if (res.ok) {
        setRsvps(prev => prev.filter(r => r.id !== item.id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  const stats = useMemo(() => {
    const confirmedRecords = rsvps.filter(r => r.attending);
    const declinedRecords = rsvps.filter(r => !r.attending);
    const totalAdults = confirmedRecords.reduce((acc, r) => acc + (r.adults_count || 1), 0);
    const totalChildren = confirmedRecords.reduce((acc, r) => acc + (r.children_count || 0), 0);
    return {
      confirmedGroups: confirmedRecords.length,
      declinedGroups: declinedRecords.length,
      totalPeople: totalAdults + totalChildren,
      totalAdults,
      totalChildren,
    };
  }, [rsvps]);

  const filtered = useMemo(() => {
    const normalizedQuery = query
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return rsvps.filter(item => {
      if (filter === 'confirmed' && !item.attending) return false;
      if (filter === 'declined' && item.attending) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        item.guest_name,
        item.phone,
        item.message,
        ...(item.companions || []).map(c => c.name),
      ]
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [rsvps, filter, query]);

  const formattedTextReport = useMemo(() => {
    const confirmed = rsvps.filter(r => r.attending);
    const declined = rsvps.filter(r => !r.attending);

    const lines: string[] = [
      '==================================================',
      '   LISTA DE PRESENÇA — FELIPE & INGRID (30.01.2027)',
      '==================================================',
      `Total de Pessoas Confirmadas: ${stats.totalPeople} (${stats.totalAdults} adultos, ${stats.totalChildren} crianças)`,
      `Famílias / Confirmações: ${stats.confirmedGroups}`,
      `Não poderão comparecer: ${stats.declinedGroups}`,
      '--------------------------------------------------',
      '',
      'CONFIRMADOS:',
    ];

    if (confirmed.length === 0) {
      lines.push('(Nenhuma confirmação registrada até o momento)');
    } else {
      let personCounter = 1;
      confirmed.forEach((item, idx) => {
        const groupTotal = (item.adults_count || 1) + (item.children_count || 0);
        lines.push(
          `${idx + 1}. ${item.guest_name} — Tel: ${item.phone} [${groupTotal} ${groupTotal === 1 ? 'pessoa' : 'pessoas'}]`
        );
        lines.push(`   • ${personCounter++}. ${item.guest_name} (Titular - Adulto)`);
        for (const comp of item.companions || []) {
          lines.push(
            `   • ${personCounter++}. ${comp.name} (${comp.type === 'child' ? 'Criança' : 'Adulto'})`
          );
        }
        if (item.message) {
          lines.push(`   Mensagem: "${item.message}"`);
        }
        lines.push('');
      });
    }

    if (declined.length > 0) {
      lines.push('--------------------------------------------------');
      lines.push('NÃO PODERÃO COMPARECER:');
      declined.forEach((item, idx) => {
        lines.push(
          `${idx + 1}. ${item.guest_name} — Tel: ${item.phone}${item.message ? ` | Msg: "${item.message}"` : ''}`
        );
      });
      lines.push('');
    }

    lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    return lines.join('\r\n');
  }, [rsvps, stats]);

  async function copyTextReport() {
    try {
      await navigator.clipboard.writeText(formattedTextReport);
      setCopyFeedback('Lista copiada em texto para a área de transferência!');
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
    link.download = 'lista-presenca-felipe-e-ingrid.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadCsvReport() {
    const header = [
      'Status',
      'Titular',
      'Telefone',
      'Total Pessoas',
      'Adultos',
      'Criancas',
      'Acompanhantes',
      'Mensagem',
      'Data Confirmacao',
    ];
    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = rsvps.map(r => {
      const companionsText = (r.companions || [])
        .map(c => `${c.name} (${c.type === 'child' ? 'Criança' : 'Adulto'})`)
        .join('; ');
      const total = r.attending ? (r.adults_count || 1) + (r.children_count || 0) : 0;
      return [
        r.attending ? 'Confirmado' : 'Não comparecerá',
        r.guest_name,
        r.phone,
        total,
        r.attending ? r.adults_count : 0,
        r.attending ? r.children_count : 0,
        companionsText,
        r.message || '',
        formatDateTime(r.created_at),
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lista-presenca-felipe-e-ingrid.csv';
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
        <span className="header-date">LISTA DE PRESENÇA</span>
        <a className="subpage-back-link" href="/">
          ← Voltar ao site
        </a>
      </header>

      <main className="guestlist-main">
        <div className="guestlist-intro">
          <div>
            <p className="eyebrow">
              <span className="little-star" aria-hidden="true">✳</span> GESTÃO DE CONVIDADOS
            </p>
            <h1>
              Lista de <em>Presença.</em>
            </h1>
            <p className="guestlist-subtitle">
              Acompanhe em tempo real todos os convidados e familiares confirmados para o grande dia.
            </p>
          </div>
          <button
            type="button"
            className="guestlist-refresh-btn"
            onClick={loadList}
            disabled={loading}
          >
            {loading ? 'Atualizando…' : '↻ Atualizar lista'}
          </button>
        </div>

        {/* Cards de Contagem */}
        <section className="guestlist-stats" aria-label="Resumo das confirmações">
          <div className="stat-card highlight">
            <span className="stat-label">TOTAL DE PESSOAS CONFIRMADAS</span>
            <strong className="stat-value">{stats.totalPeople}</strong>
            <span className="stat-detail">
              {stats.confirmedGroups}{' '}
              {stats.confirmedGroups === 1 ? 'confirmação recebida' : 'confirmações recebidas'}
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">ADULTOS CONFIRMADOS</span>
            <strong className="stat-value">{stats.totalAdults}</strong>
            <span className="stat-detail">Titulares + acompanhantes adultos</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">CRIANÇAS CONFIRMADAS</span>
            <strong className="stat-value">{stats.totalChildren}</strong>
            <span className="stat-detail">Acompanhantes crianças</span>
          </div>

          <div className="stat-card muted">
            <span className="stat-label">NÃO PODERÃO COMPARECER</span>
            <strong className="stat-value">{stats.declinedGroups}</strong>
            <span className="stat-detail">Ausências justificadas</span>
          </div>
        </section>

        {/* Barra de Exportação em Texto */}
        <section className="guestlist-export-box" aria-label="Exportar lista de presença">
          <div className="export-box-info">
            <h2>Exportar lista em texto</h2>
            <p>
              Copie a relação completa pronta para enviar no WhatsApp, cerimonial ou buffet, ou baixe em arquivo.
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
                aria-label="Texto formatado da lista de presença"
              />
            </div>
          )}
        </section>

        {/* Filtros e Busca */}
        <section className="guestlist-controls">
          <label className="search-field guestlist-search">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="6.5" />
              <path d="m15 15 6 6" />
            </svg>
            <span className="sr-only">Buscar convidado ou acompanhante</span>
            <input
              type="search"
              placeholder="Buscar por nome do convidado, acompanhante ou telefone..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </label>

          <div className="category-filters" role="group" aria-label="Filtrar status de presença">
            <button
              type="button"
              aria-pressed={filter === 'confirmed'}
              onClick={() => setFilter('confirmed')}
            >
              Confirmados ({stats.confirmedGroups})
            </button>
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              Todos ({rsvps.length})
            </button>
            <button
              type="button"
              aria-pressed={filter === 'declined'}
              onClick={() => setFilter('declined')}
            >
              Não poderão ir ({stats.declinedGroups})
            </button>
          </div>
        </section>

        {error && (
          <div className="catalogue-error" role="alert">
            {error}
            <button type="button" onClick={loadList}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* Lista de Confirmações */}
        {loading ? (
          <div className="guestlist-empty">
            <p>Carregando confirmações de presença…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="guestlist-empty">
            <h3>Nenhum registro encontrado</h3>
            <p>
              {rsvps.length === 0
                ? 'As confirmações enviadas pelos convidados aparecerão automaticamente aqui.'
                : 'Nenhum convidado corresponde ao filtro ou busca atual.'}
            </p>
          </div>
        ) : (
          <div className="guestlist-cards">
            {filtered.map(item => {
              const totalGroup = item.attending
                ? (item.adults_count || 1) + (item.children_count || 0)
                : 0;
              const wa = whatsappUrl(item.phone);

              return (
                <article
                  key={item.id}
                  className={'guest-card' + (!item.attending ? ' is-declined' : '')}
                >
                  <div className="guest-card-top">
                    <div>
                      <span
                        className={
                          'guest-status-badge ' + (item.attending ? 'confirmed' : 'declined')
                        }
                      >
                        {item.attending ? '✓ Presença Confirmada' : '✕ Não poderá comparecer'}
                      </span>
                      <h3 className="guest-name">{item.guest_name}</h3>
                    </div>

                    {item.attending && (
                      <div className="guest-count-pill">
                        <strong>{totalGroup}</strong>{' '}
                        <span>{totalGroup === 1 ? 'pessoa' : 'pessoas'}</span>
                      </div>
                    )}
                  </div>

                  <div className="guest-meta">
                    <span>
                      <strong>WhatsApp:</strong>{' '}
                      {wa ? (
                        <a href={wa} target="_blank" rel="noopener noreferrer">
                          {item.phone} ↗
                        </a>
                      ) : (
                        item.phone
                      )}
                    </span>
                    <span>
                      <strong>Enviado em:</strong> {formatDateTime(item.created_at)}
                    </span>
                  </div>

                  {item.attending && (
                    <div className="guest-party-box">
                      <span className="party-box-title">
                        INTEGRANTES DESTA CONFIRMAÇÃO ({item.adults_count}{' '}
                        {item.adults_count === 1 ? 'adulto' : 'adultos'}
                        {item.children_count > 0
                          ? ` e ${item.children_count} ${
                              item.children_count === 1 ? 'criança' : 'crianças'
                            }`
                          : ''}
                        )
                      </span>
                      <ul className="party-members-list">
                        <li>
                          <span>{item.guest_name}</span>
                          <em className="member-tag">Titular • Adulto</em>
                        </li>
                        {(item.companions || []).map((comp, idx) => (
                          <li key={idx}>
                            <span>{comp.name}</span>
                            <em
                              className={
                                'member-tag ' + (comp.type === 'child' ? 'child' : '')
                              }
                            >
                              {comp.type === 'child' ? 'Criança' : 'Adulto'}
                            </em>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.message && (
                    <blockquote className="guest-message">
                      “{item.message}”
                    </blockquote>
                  )}

                  <div className="guest-card-footer">
                    <button
                      type="button"
                      className="guest-delete-btn"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item)}
                    >
                      {deletingId === item.id ? 'Removendo…' : 'Remover registro'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
