'use client';

import { useEffect, useState } from 'react';

interface MobileNavProps {
  variant: 'home' | 'gifts';
}

export default function MobileNav({ variant }: MobileNavProps) {
  const sectionIds =
    variant === 'home'
      ? ['inicio', 'nosso-dia', 'presenca']
      : ['presentes', 'pix', 'como-funciona'];

  const [activeId, setActiveId] = useState<string>(sectionIds[0]);

  useEffect(() => {
    let ticking = false;

    function updateActiveOnScroll() {
      const triggerLine = window.innerHeight * 0.38;
      let current = sectionIds[0];

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerLine) {
          current = id;
        }
      }

      setActiveId(current);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateActiveOnScroll);
        ticking = true;
      }
    }

    updateActiveOnScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  if (variant === 'home') {
    return (
      <nav className="mobile-nav" aria-label="Navegação principal">
        <a
          href="#inicio"
          className={activeId === 'inicio' ? 'active' : ''}
          aria-current={activeId === 'inicio' ? 'location' : undefined}
          onClick={() => setActiveId('inicio')}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m4 10 8-7 8 7v10h-6v-6h-4v6H4Z" />
          </svg>
          Início
        </a>
        <a
          href="#nosso-dia"
          className={activeId === 'nosso-dia' ? 'active' : ''}
          aria-current={activeId === 'nosso-dia' ? 'location' : undefined}
          onClick={() => setActiveId('nosso-dia')}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
            <path d="M16 3v4M8 3v4M3.5 10h17" />
          </svg>
          Data
        </a>
        <a
          href="#presenca"
          className={activeId === 'presenca' ? 'active' : ''}
          aria-current={activeId === 'presenca' ? 'location' : undefined}
          onClick={() => setActiveId('presenca')}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12.2 2.3 2.3 4.8-4.8" />
          </svg>
          Confirmar
        </a>
        <a href="/presentes">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 10h16v11H4ZM3 6h18v4H3ZM12 6v15M12 6C4 6 5 0 8 2l4 4ZM12 6c8 0 7-6 4-4l-4 4Z" />
          </svg>
          Presentes
        </a>
      </nav>
    );
  }

  return (
    <nav className="mobile-nav" aria-label="Navegação da lista de presentes">
      <a href="/">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
        </svg>
        Convite
      </a>
      <a
        href="#presentes"
        className={activeId === 'presentes' ? 'active' : ''}
        aria-current={activeId === 'presentes' ? 'location' : undefined}
        onClick={() => setActiveId('presentes')}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10h16v11H4ZM3 6h18v4H3ZM12 6v15M12 6C4 6 5 0 8 2l4 4ZM12 6c8 0 7-6 4-4l-4 4Z" />
        </svg>
        Presentes
      </a>
      <a
        href="#pix"
        className={activeId === 'pix' ? 'active' : ''}
        aria-current={activeId === 'pix' ? 'location' : undefined}
        onClick={() => setActiveId('pix')}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6.3 6.3 9.2 9.2a2 2 0 0 0 2.8 0l2.9-2.9M17.7 17.7l-2.9-2.9a2 2 0 0 0-2.8 0l-2.9 2.9M13.4 2.8l7.8 7.8a2 2 0 0 1 0 2.8l-7.8 7.8a2 2 0 0 1-2.8 0l-7.8-7.8a2 2 0 0 1 0-2.8l7.8-7.8a2 2 0 0 1 2.8 0Z" />
        </svg>
        Pix
      </a>
      <a
        href="#como-funciona"
        className={activeId === 'como-funciona' ? 'active' : ''}
        aria-current={activeId === 'como-funciona' ? 'location' : undefined}
        onClick={() => setActiveId('como-funciona')}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.6 9.4a2.5 2.5 0 1 1 3.7 2.2c-.8.5-1.3 1-1.3 1.9v.3M12 17h.01" />
        </svg>
        Dúvidas
      </a>
    </nav>
  );
}
