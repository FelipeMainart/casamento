import type { Metadata } from 'next';
import Catalogue from '../catalogue';
import Pix from '../pix';
import Delivery from '../delivery';
import MobileNav from '../mobile-nav';
import { giftsPageAfterCatalogue } from '../page-markup';

export const metadata: Metadata = {
  title: 'Sugestões de Presentes | Casamento Felipe & Ingrid (16.01.2027)',
  description:
    'Se desejar nos presentear em nosso casamento, preparamos algumas sugestões com carinho para essa nova etapa.',
};

export default function PresentesPage() {
  return (
    <div className="gifts-dedicated-page">
      <a className="skip" href="#presentes">
        Ir para a lista de presentes
      </a>

      <header className="subpage-header">
        <a className="brand" href="/" aria-label="Felipe e Ingrid, voltar ao convite">
          F<span>&</span>I
        </a>
        <span className="header-date">16 . 01 . 2027</span>
        <a className="subpage-back-link" href="/">
          ← Voltar ao convite
        </a>
      </header>

      <Catalogue />
      <Pix />
      <Delivery />

      <div dangerouslySetInnerHTML={{ __html: giftsPageAfterCatalogue }} />
      <MobileNav variant="gifts" />
    </div>
  );
}
