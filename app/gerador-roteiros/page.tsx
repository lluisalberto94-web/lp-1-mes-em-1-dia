import { Generator } from '@/components/Generator';
import { getAuthorScope } from '@/lib/author-context-server';
import { authorScopeLabel, scopeToAuthor } from '@/lib/author-context';

export default async function ScriptGeneratorPage({searchParams}:{searchParams:Promise<{idea?:string,ideaId?:string,platform?:string,author?:string}>}){
  const params=await searchParams;
  const scope=await getAuthorScope();
  const activeAuthor=scopeToAuthor(scope);
  const queryAuthor=['LAURO','RENATA','CASAL'].includes(params.author||'')?params.author:'';
  const initialAuthor=activeAuthor||queryAuthor||'LAURO';

  return <div className="content">
    <div className="page-head">
      <div>
        <div className="eyebrow">Gerador de Roteiros · {authorScopeLabel[scope]}</div>
        <h1>Transforme uma boa ideia em execução.</h1>
        <p>Escolha a plataforma e o sistema aplica o treinamento de roteiro daquele canal à ideia selecionada.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className="button secondary" href="/gerador-ideias">Gerar novas ideias</a>
        <a className="button secondary" href="/treinamento-ia">Editar treinamento IA</a>
      </div>
    </div>
    <Generator initialIdea={params.idea||''} ideaId={params.ideaId} initialPlatform={params.platform||'MULTIPLATAFORMA'} initialAuthor={initialAuthor} lockAuthor={Boolean(activeAuthor)}/>
  </div>;
}
