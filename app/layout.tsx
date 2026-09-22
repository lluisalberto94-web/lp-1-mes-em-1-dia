import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
export const metadata: Metadata = { title:'Freire Content OS', description:'Sistema editorial da Freire Educação' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><div className="shell"><Sidebar/><main className="main"><header className="topbar"><div><div className="eyebrow">Freire Educação</div><strong>Conteúdo com estrutura</strong></div><span className="small muted">Lauro · Renata · Casal</span></header>{children}</main></div></body></html>}
