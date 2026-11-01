'use client';

import { useState } from 'react';
import { Companion, rsvpRequest } from '../lib/rsvps';

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function InvitationRsvp() {
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [attending, setAttending] = useState<boolean>(true);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<{
    guestName: string;
    attending: boolean;
    companions: Companion[];
  } | null>(null);

  function addCompanion() {
    if (companions.length >= 15) return;
    setCompanions(prev => [...prev, { name: '', type: 'adult' }]);
  }

  function updateCompanion(index: number, patch: Partial<Companion>) {
    setCompanions(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  }

  function removeCompanion(index: number) {
    setCompanions(prev => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    const trimmedName = guestName.trim();
    if (trimmedName.length < 2) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Informe um telefone ou WhatsApp válido com DDD.');
      return;
    }

    const validCompanions: Companion[] = [];
    if (attending) {
      for (const comp of companions) {
        const cName = comp.name.trim();
        if (!cName) continue;
        if (cName.length < 2) {
          setError('Informe o nome completo de cada acompanhante adicionado.');
          return;
        }
        validCompanions.push({ name: cName, type: comp.type });
      }
    }

    setBusy(true);
    try {
      const response = await rsvpRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: trimmedName,
          phone: phone.trim(),
          attending,
          companions: validCompanions,
          message: message.trim(),
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível registrar sua confirmação.');
      }

      setSubmitted({
        guestName: trimmedName,
        attending,
        companions: validCompanions,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível enviar no momento. Tente novamente em instantes.'
      );
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setGuestName('');
    setPhone('');
    setAttending(true);
    setCompanions([]);
    setMessage('');
    setError('');
    setSubmitted(null);
  }

  return (
    <section className="rsvp-section" id="presenca" aria-labelledby="rsvp-title">
      <div className="rsvp-single-container">
        <div className="rsvp-form-wrapper">
          <p className="eyebrow">
            <span className="little-star" aria-hidden="true">✳</span> CONFIRMAÇÃO DE PRESENÇA
          </p>
          <h2 id="rsvp-title">
            Celebrar com você.<br />
            <em>Confirme sua presença.</em>
          </h2>
          <p className="rsvp-intro">
            Sua presença tornará o nosso dia ainda mais especial. Preencha os dados abaixo para confirmarmos você e sua família com todo carinho.
          </p>

          {submitted ? (
            <div className="rsvp-success" role="status" aria-live="polite">
              <div className="rsvp-success-icon" aria-hidden="true">♡</div>
              <h3>
                {submitted.attending
                  ? 'Presença confirmada com carinho!'
                  : 'Obrigado por nos avisar!'}
              </h3>
              <p>
                {submitted.attending
                  ? `Que alegria ter você conosco, ${submitted.guestName}! Estamos contando os dias para celebrar esse momento juntos.`
                  : `Recebemos sua resposta, ${submitted.guestName}. Sentiremos sua falta, mas sabemos que seu carinho estará conosco.`}
              </p>

              {submitted.attending && (
                <>
                  <div className="rsvp-summary-box">
                    <span className="summary-label">RESUMO DA SUA CONFIRMAÇÃO</span>
                    <ul>
                      <li>
                        <strong>{submitted.guestName}</strong> <span>(Titular)</span>
                      </li>
                      {submitted.companions.map((c, idx) => (
                        <li key={idx}>
                          <strong>{c.name}</strong>{' '}
                          <span>({c.type === 'child' ? 'Criança' : 'Adulto'})</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rsvp-gift-invitation">
                    <p>
                      Ter você conosco já é o nosso maior presente. Caso também deseje nos presentear neste momento especial, preparamos algumas sugestões com carinho:
                    </p>
                    <a className="button primary" href="/presentes">
                      Conhecer lista de presentes (opcional) <span aria-hidden="true">♡ ↗</span>
                    </a>
                  </div>
                </>
              )}

              <div className="rsvp-success-actions">
                <button type="button" className="text-button" onClick={resetForm}>
                  Enviar outra confirmação
                </button>
              </div>
            </div>
          ) : (
            <form className="rsvp-form" onSubmit={handleSubmit}>
              <div className="rsvp-field">
                <label htmlFor="rsvp-name">SEU NOME COMPLETO *</label>
                <input
                  id="rsvp-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Como consta no convite ou seu nome completo"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                />
              </div>

              <div className="rsvp-field">
                <label htmlFor="rsvp-phone">SEU WHATSAPP / TELEFONE *</label>
                <input
                  id="rsvp-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                />
              </div>

              <fieldset className="rsvp-attendance-fieldset">
                <legend>VOCÊ PODERÁ COMPARECER? *</legend>
                <div className="rsvp-attendance-options">
                  <button
                    type="button"
                    className={'attendance-option' + (attending ? ' active' : '')}
                    aria-pressed={attending}
                    onClick={() => setAttending(true)}
                  >
                    <span className="option-dot" aria-hidden="true" />
                    <div>
                      <strong>Sim, estarei presente! ♡</strong>
                      <span>Mal posso esperar por esse dia</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={'attendance-option' + (!attending ? ' active' : '')}
                    aria-pressed={!attending}
                    onClick={() => setAttending(false)}
                  >
                    <span className="option-dot" aria-hidden="true" />
                    <div>
                      <strong>Infelizmente não poderei ir</strong>
                      <span>Mandarei meu carinho de longe</span>
                    </div>
                  </button>
                </div>
              </fieldset>

              {attending && (
                <div className="rsvp-companions-block">
                  <div className="companions-header">
                    <div>
                      <span className="companions-title">ACOMPANHANTES (FAMÍLIA / CÔNJUGE / CRIANÇAS)</span>
                      <p className="companions-subtitle">
                        Vai com mais alguém da sua família? Adicione o nome de cada pessoa abaixo.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="add-companion-btn"
                      onClick={addCompanion}
                    >
                      + Adicionar acompanhante
                    </button>
                  </div>

                  {companions.length > 0 && (
                    <div className="companions-list">
                      {companions.map((comp, idx) => (
                        <div className="companion-row" key={idx}>
                          <input
                            type="text"
                            placeholder={`Nome do acompanhante ${idx + 1}`}
                            value={comp.name}
                            maxLength={80}
                            required
                            onChange={e => updateCompanion(idx, { name: e.target.value })}
                            aria-label={`Nome do acompanhante ${idx + 1}`}
                          />
                          <select
                            value={comp.type}
                            onChange={e =>
                              updateCompanion(idx, {
                                type: e.target.value === 'child' ? 'child' : 'adult',
                              })
                            }
                            aria-label={`Faixa etária do acompanhante ${idx + 1}`}
                          >
                            <option value="adult">Adulto</option>
                            <option value="child">Criança</option>
                          </select>
                          <button
                            type="button"
                            className="remove-companion-btn"
                            onClick={() => removeCompanion(idx)}
                            aria-label={`Remover acompanhante ${idx + 1}`}
                            title="Remover acompanhante"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="rsvp-field">
                <label htmlFor="rsvp-message">MENSAGEM AOS NOIVOS (OPCIONAL)</label>
                <textarea
                  id="rsvp-message"
                  rows={3}
                  maxLength={500}
                  placeholder="Deixe uma mensagem de carinho ou observação importante..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              {error && (
                <p className="rsvp-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="button primary rsvp-submit" disabled={busy}>
                <span>
                  {busy
                    ? 'Confirmando seus dados…'
                    : attending
                      ? 'Confirmar minha presença ♡'
                      : 'Enviar minha resposta'}
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
