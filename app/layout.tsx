import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Felipe & Ingrid | 30.01.2027',description:'Nossa lista de presentes. Escolha com carinho e reserve um pedacinho do nosso novo lar.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>;}
