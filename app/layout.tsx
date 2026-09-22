import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
export const metadata: Metadata = { title:'Freire Educação', description:'Gerador de conteúdo para redes sociais' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><div className="shell"><Sidebar/><main className="main">{children}</main></div></body></html>}
