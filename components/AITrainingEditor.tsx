'use client';
import { useMemo, useState } from 'react';
import { restoreTrainingPromptRevision, updateTrainingPrompt } from '@/app/actions';

type Revision = { id:string; version:number; prompt:string; createdAt:string };
type PromptItem = { id:string; scope:string; label:string; prompt:string; version:number; usageCount:number; updatedAt:string; revisions:Revision[] };

export function AITrainingEditor({prompts}:{prompts:PromptItem[]}){
  const [active,setActive]=useState(prompts[0]?.scope || 'INSTAGRAM');
  const current=useMemo(()=>prompts.find(p=>p.scope===active) || prompts[0],[active,prompts]);
  if(!current)return <div className="empty">Os prompts iniciais ainda não foram carregados.</div>;
  return <div className="grid gap-4">
    <div className="flex flex-wrap gap-2">{prompts.map(p=><button key={p.scope} onClick={()=>setActive(p.scope)} className={active===p.scope?'button':'button ghost'}>{p.label}</button>)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.45fr_.55fr]">
      <section className="panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="eyebrow">Prompt {current.label}</div><h2 className="!mb-1">Treinamento ativo · v{current.version}</h2><p className="small muted">Usado em {current.usageCount} gerações. Salvar uma alteração cria uma nova versão.</p></div>
          <a href="/gerador" className="button secondary">Testar no Gerador</a>
        </div>
        <form action={updateTrainingPrompt} className="mt-5">
          <input type="hidden" name="scope" value={current.scope}/>
          <div className="form-group"><label>Direcionamento estratégico</label><textarea key={`${current.scope}-${current.version}`} name="prompt" className="textarea min-h-[480px]" defaultValue={current.prompt}/></div>
          <div className="mt-4 flex flex-wrap items-center gap-3"><button className="button" type="submit">Salvar nova versão</button><span className="small muted">Última atualização: {new Date(current.updatedAt).toLocaleString('pt-BR')}</span></div>
        </form>
      </section>
      <aside className="panel">
        <div className="eyebrow">Histórico</div><h2>Versões recentes</h2>
        <div className="grid gap-3">{current.revisions.length?current.revisions.map(r=><div key={r.id} className="idea-card">
          <div className="flex items-center justify-between gap-3"><strong>Versão {r.version}</strong><span className="small muted">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span></div>
          <p className="small muted mt-2 line-clamp-4 whitespace-pre-wrap">{r.prompt}</p>
          {r.version!==current.version&&<form action={restoreTrainingPromptRevision} className="mt-3"><input type="hidden" name="scope" value={current.scope}/><input type="hidden" name="revisionId" value={r.id}/><button className="button ghost" type="submit">Restaurar como nova versão</button></form>}
        </div>):<p className="small muted">Sem histórico ainda.</p>}</div>
      </aside>
    </div>
    <div className="panel"><div className="eyebrow">Aprendizado controlado</div><h2>O sistema registra o que foi usado</h2><p className="muted">Cada geração registra plataforma, versão do treinamento e contexto. Isso cria a base para a próxima etapa: marcar conteúdos como aprovados ou rejeitados e fazer a IA sugerir ajustes no prompt. A sugestão não altera o treinamento até você aprovar.</p></div>
  </div>
}
