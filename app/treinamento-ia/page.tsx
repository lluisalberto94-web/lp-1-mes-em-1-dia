import { AITrainingEditor } from '@/components/AITrainingEditor';
import { prisma } from '@/lib/db';
import { promptScopeLabels } from '@/lib/training';

export const dynamic = 'force-dynamic';

export default async function AITrainingPage(){
  const rows=await prisma.trainingPrompt.findMany({include:{revisions:{orderBy:{version:'desc'},take:5}}});
  const order=['INSTAGRAM','TIKTOK','YOUTUBE','SHORTS','MULTIPLATAFORMA'];
  const prompts=rows.sort((a,b)=>order.indexOf(a.scope)-order.indexOf(b.scope)).map(p=>({
    id:p.id,scope:p.scope,label:promptScopeLabels[p.scope],prompt:p.prompt,version:p.version,usageCount:p.usageCount,updatedAt:p.updatedAt.toISOString(),
    revisions:p.revisions.map(r=>({id:r.id,version:r.version,prompt:r.prompt,createdAt:r.createdAt.toISOString()}))
  }));
  return <div className="content"><div className="page-head"><div><div className="eyebrow">Treinamento IA</div><h1>Ensine a IA a pensar por canal.</h1><p>Defina o cérebro estratégico de cada plataforma. O Gerador usa automaticamente o treinamento ativo conforme a plataforma selecionada.</p></div></div><AITrainingEditor prompts={prompts}/></div>;
}
