import { heroMarkup, letterMarkup, afterCatalogue } from './page-markup';
import Countdown from './countdown';
import InvitationRsvp from './invitation-rsvp';
import MobileNav from './mobile-nav';

export default function Home() {
  return (
    <>
      <a className="skip" href="#presenca">
        Ir para confirmação de presença
      </a>
      <div dangerouslySetInnerHTML={{ __html: heroMarkup }} />
      <Countdown />
      <div dangerouslySetInnerHTML={{ __html: letterMarkup }} />
      <InvitationRsvp />
      <div dangerouslySetInnerHTML={{ __html: afterCatalogue }} />
      <MobileNav variant="home" />
    </>
  );
}
