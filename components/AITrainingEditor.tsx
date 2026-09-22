'use client';
import { useMemo, useState } from 'react';
import { restoreTrainingPromptRevision, updateTrainingPrompt } from '@/app/actions';

type Revision = { id:string; version:number; prompt:string; createdAt:string };
type PromptItem = { id:string; kind:string; kindLabel:string; scope:string; label:string; prompt:string; version:number; usageCount:number; updatedAt:string; revisions:Revision[] };

export function AITrainingEditor({prompts}:{prompts:PromptItem[]}){
  const kinds=['IDEIA','ROTEIRO'];
  const [kind,setKind]=useState('IDEIA');
  const scoped=useMemo(()=>prompts.filter(p=>p.kind===kind),[prompts,kind]);
  const [active,setActive]=useState('INSTAGRAM');
  const current=useMemo(()=>scoped.find(p=>p.scope===active)||scoped[0],[scoped,active]);
  const testHref=kind==='IDEIA'?'/gerador-ideias':'/gerador-roteiros';

  if(!prompts.length)return <div className="empty">Os prompts iniciais ainda não foram carregados.</div>;

  return <div className="grid gap-4">
    <div className="training-kind-switch">
      {kinds.map(k=><button key={k} onClick={()=>{setKind(k);setActive('INSTAGRAM')}} className={kind===k?'training-kind active':'training-kind'}>
        <span>{k==='IDEIA'?'Gerador de Ideias':'Gerador de Roteiros'}</span>
        <small>{k==='IDEIA'?'O que vale virar conteúdo':'Como executar a ideia escolhida'}</small>
      </button>)}
    </div>

    <div className="flex flex-wrap gap-2">
      {scoped.map(p=><button key={p.kind+'-'+p.scope} onClick={()=>setActive(p.scope)} className={active===p.scope?'button':'button ghost'}>{p.label}</button>)}
    </div>

    {current&&<div className="grid gap-4 xl:grid-cols-[1.45fr_.55fr]">
      <section className="panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="eyebrow">{current.kindLabel} · {current.label}</div>
            <h2 className="!mb-1">Treinamento ativo · v{current.version}</h2>
            <p className="small muted">Usado em {current.usageCount} gerações. Salvar uma alteração cria uma nova versão.</p>
          </div>
          <a href={testHref} className="button secondary">Testar no gerador</a>
        </div>

        <form action={updateTrainingPrompt} className="mt-5">
          <input type="hidden" name="kind" value={current.kind}/>
          <input type="hidden" name="scope" value={current.scope}/>
          <div className="form-group">
            <label>Direcionamento estratégico</label>
            <textarea key={current.kind+'-'+current.scope+'-'+current.version} name="prompt" className="textarea min-h-[480px]" defaultValue={current.prompt}/>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="button" type="submit">Salvar nova versão</button>
            <span className="small muted">Última atualização: {new Date(current.updatedAt).toLocaleString('pt-BR')}</span>
          </div>
        </form>
      </section>

      <aside className="panel">
        <div className="eyebrow">Histórico</div>
        <h2>Versões recentes</h2>
        <div className="grid gap-3">{current.revisions.length?current.revisions.map(r=><div key={r.id} className="idea-card">
          <div className="flex items-center justify-between gap-3"><strong>Versão {r.version}</strong><span className="small muted">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span></div>
          <p className="small muted mt-2 line-clamp-4 whitespace-pre-wrap">{r.prompt}</p>
          {r.version!==current.version&&<form action={restoreTrainingPromptRevision} className="mt-3">
            <input type="hidden" name="kind" value={current.kind}/>
            <input type="hidden" name="scope" value={current.scope}/>
            <input type="hidden" name="revisionId" value={r.id}/>
            <button className="button ghost" type="submit">Restaurar como nova versão</button>
          </form>}
        </div>):<p className="small muted">Sem histórico ainda.</p>}</div>
      </aside>
    </div>}

    <div className="panel">
      <div className="eyebrow">Dois cérebros, uma linha editorial</div>
      <h2>Ideação e roteiro não usam a mesma lógica</h2>
      <p className="muted">O Gerador de Ideias usa apenas o treinamento de ideação. O Gerador de Roteiros usa apenas o treinamento de roteiro. Cada geração registra o tipo, a plataforma e a versão usada.</p>
    </div>
  </div>
}
