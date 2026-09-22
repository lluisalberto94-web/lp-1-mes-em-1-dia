import { createContent } from '@/app/actions';
import { ContentForm } from '@/components/ContentForm';
import { prisma } from '@/lib/db';
export const dynamic='force-dynamic';
export default async function NewContent(){const parents=await prisma.content.findMany({orderBy:{createdAt:'desc'},take:50});return <div className="content"><div className="page-head"><div><div className="eyebrow">Novo ativo</div><h1>Criar conteúdo</h1><p>Cadastre uma gravação e deixe as publicações vinculadas a ela.</p></div></div><form action={createContent} className="panel"><ContentForm parents={parents}/><div className="mt-6"><button className="button">Criar conteúdo</button></div></form></div>}
