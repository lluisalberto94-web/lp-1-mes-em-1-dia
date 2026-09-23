import { IdeaGenerator } from '@/components/IdeaGenerator';
import { getAuthorScope } from '@/lib/author-context-server';
import { authorScopeLabel, scopeToAuthor } from '@/lib/author-context';

export default async function IdeaGeneratorPage(){
  const scope=await getAuthorScope();
  const activeAuthor=scopeToAuthor(scope);

  return <div className="content">
    <div className="page-head">
      <div>
        <div className="eyebrow">Gerador de Ideias · {authorScopeLabel[scope]}</div>
        <h1>Decida o que vale virar conteúdo.</h1>
        <p>Escolha pilar, objetivo e plataforma. A IA usa o treinamento de ideação ativo para sugerir temas antes de escrever qualquer roteiro.</p>
      </div>
      <a className="button secondary" href="/treinamento-ia">Editar treinamento IA</a>
    </div>
    <IdeaGenerator initialAuthor={activeAuthor||'LAURO'} lockAuthor={Boolean(activeAuthor)}/>
  </div>;
}
