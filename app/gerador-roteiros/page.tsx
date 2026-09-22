import { Generator } from '@/components/Generator';

export default async function ScriptGeneratorPage({searchParams}:{searchParams:Promise<{idea?:string,ideaId?:string,platform?:string}>}){
  const params=await searchParams;
  return <div className="content">
    <div className="page-head">
      <div>
        <div className="eyebrow">Gerador de Roteiros</div>
        <h1>Transforme uma boa ideia em execução.</h1>
        <p>Escolha a plataforma e o sistema aplica o treinamento de roteiro daquele canal à ideia selecionada.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className="button secondary" href="/gerador-ideias">Gerar novas ideias</a>
        <a className="button secondary" href="/treinamento-ia">Editar treinamento IA</a>
      </div>
    </div>
    <Generator initialIdea={params.idea||''} ideaId={params.ideaId} initialPlatform={params.platform||'MULTIPLATAFORMA'}/>
  </div>;
}
