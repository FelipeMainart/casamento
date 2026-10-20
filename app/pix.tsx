'use client';

import { useRef, useState } from 'react';

const PIX_KEY = '38997432361';

export default function Pix() {
  const [status, setStatus] = useState('');
  const keyField = useRef<HTMLInputElement>(null);

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setStatus('Chave Pix copiada!');
    } catch {
      keyField.current?.focus();
      keyField.current?.select();
      setStatus('Selecione e copie a chave acima.');
    }
  }

  return (
    <section className="pix-section" id="pix" aria-labelledby="pix-title">
      <div className="pix-heading">
        <p className="eyebrow">UM CARINHO, DE QUALQUER TAMANHO</p>
        <h2 id="pix-title">Um presente em Pix.<br /><em>Do seu jeito.</em></h2>
        <p>Se preferir, você também pode nos presentear com um Pix de qualquer valor. Cada gesto de carinho faz parte do começo da nossa história.</p>
        <span className="pix-any-value">Você escolhe o valor ♡</span>
      </div>
      <div className="pix-card">
        <span className="pix-card-label">PARA O NOSSO NOVO COMEÇO</span>
        <p className="pix-recipient">Felipe Mainart de Oliveira Silva</p>
        <label htmlFor="pix-key">CHAVE PIX</label>
        <input ref={keyField} id="pix-key" value={PIX_KEY} readOnly onClick={event => event.currentTarget.select()} />
        <button className="button primary pix-copy" type="button" onClick={copyKey}>
          Copiar chave Pix
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" /></svg>
        </button>
        <p className="pix-status" role="status" aria-live="polite">{status}</p>
        <p className="pix-footnote">No aplicativo do seu banco, cole a chave, escolha o valor e confira o nome do destinatário antes de confirmar.</p>
      </div>
    </section>
  );
}
