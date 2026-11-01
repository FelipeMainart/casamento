import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Convite de Casamento | Felipe & Ingrid — 30.01.2027',description:'Com muito carinho, convidamos você para celebrar o nosso casamento em 30 de janeiro de 2027. Confirme sua presença!',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>;}
