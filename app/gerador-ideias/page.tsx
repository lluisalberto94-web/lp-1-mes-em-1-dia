import { IdeaGenerator } from '@/components/IdeaGenerator';

export default function IdeaGeneratorPage(){
  return <div className="content">
    <div className="page-head">
      <div>
        <div className="eyebrow">Gerador de Ideias</div>
        <h1>Decida o que vale virar conteúdo.</h1>
        <p>Escolha autor, pilar, objetivo e plataforma. A IA usa o treinamento de ideação ativo para sugerir temas antes de escrever qualquer roteiro.</p>
      </div>
      <a className="button secondary" href="/treinamento-ia">Editar treinamento IA</a>
    </div>
    <IdeaGenerator/>
  </div>;
}
