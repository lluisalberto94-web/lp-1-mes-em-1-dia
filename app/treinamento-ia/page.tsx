import { AITrainingEditor } from '@/components/AITrainingEditor';
import { prisma } from '@/lib/db';
import { promptScopeLabels, trainingKindLabels } from '@/lib/training';

export const dynamic='force-dynamic';

export default async function AITrainingPage(){
  const rows=await prisma.trainingPrompt.findMany({include:{revisions:{orderBy:{version:'desc'},take:5}}});
  const scopeOrder=['INSTAGRAM','TIKTOK','YOUTUBE','SHORTS','MULTIPLATAFORMA'];
  const kindOrder=['IDEIA','ROTEIRO'];

  const prompts=rows.sort((a,b)=>{
    const kindDiff=kindOrder.indexOf(a.kind)-kindOrder.indexOf(b.kind);
    return kindDiff||scopeOrder.indexOf(a.scope)-scopeOrder.indexOf(b.scope);
  }).map(p=>({
    id:p.id,
    kind:p.kind,
    kindLabel:trainingKindLabels[p.kind],
    scope:p.scope,
    label:promptScopeLabels[p.scope],
    prompt:p.prompt,
    version:p.version,
    usageCount:p.usageCount,
    updatedAt:p.updatedAt.toISOString(),
    revisions:p.revisions.map(r=>({id:r.id,version:r.version,prompt:r.prompt,createdAt:r.createdAt.toISOString()}))
  }));

  return <div className="content">
    <div className="page-head">
      <div>
        <div className="eyebrow">Treinamento IA</div>
        <h1>Controle o cérebro de cada gerador.</h1>
        <p>Separe as regras que descobrem boas ideias das regras que transformam uma ideia escolhida em roteiro.</p>
      </div>
    </div>
    <AITrainingEditor prompts={prompts}/>
  </div>;
}
