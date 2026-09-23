import { createContent } from '@/app/actions';
import { ContentForm } from '@/components/ContentForm';
import { prisma } from '@/lib/db';
import { getAuthorScope } from '@/lib/author-context-server';
import { authorScopeLabel, scopeToAuthor } from '@/lib/author-context';

export const dynamic='force-dynamic';

export default async function NewContent(){
  const scope=await getAuthorScope();
  const activeAuthor=scopeToAuthor(scope);
  const parents=await prisma.content.findMany({
    where:activeAuthor?{author:activeAuthor}:undefined,
    orderBy:{createdAt:'desc'},
    take:50
  });

  return <div className="content">
    <div className="page-head">
      <div>
        <div className="eyebrow">Novo ativo · {authorScopeLabel[scope]}</div>
        <h1>Criar conteúdo</h1>
        <p>Cadastre uma gravação e deixe as publicações vinculadas a ela.</p>
      </div>
    </div>
    <form action={createContent} className="panel">
      <ContentForm parents={parents} initialAuthor={activeAuthor||'LAURO'} lockAuthor={Boolean(activeAuthor)}/>
      <div className="mt-6"><button className="button">Criar conteúdo</button></div>
    </form>
  </div>;
}
