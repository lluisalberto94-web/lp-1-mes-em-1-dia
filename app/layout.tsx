import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import { getAuthorScope } from '@/lib/author-context-server';

export const metadata: Metadata = { title:'Freire Educação', description:'Gerador de conteúdo para redes sociais' };

export default async function RootLayout({children}:{children:React.ReactNode}){
  const authorScope=await getAuthorScope();
  return <html lang="pt-BR"><body><div className="shell"><Sidebar authorScope={authorScope}/><main className="main">{children}</main></div></body></html>;
}
