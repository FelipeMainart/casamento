import { beforeCatalogue, afterCatalogue } from './page-markup';
import Catalogue from './catalogue';
import Delivery from './delivery';
import Pix from './pix';
import Script from 'next/script';
export default function Home(){return <><a className="skip" href="#presentes">Ir para a lista de presentes</a><div dangerouslySetInnerHTML={{__html:beforeCatalogue}}/><Catalogue/><Pix/><Delivery/><div dangerouslySetInnerHTML={{__html:afterCatalogue}}/><div id="notice" role="status"/><Script src="/app.js" strategy="afterInteractive"/></>;}
