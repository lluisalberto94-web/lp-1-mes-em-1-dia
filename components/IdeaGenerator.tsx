'use client';

import { useState } from 'react';
import { authorLabel, enumValues, pillarLabel } from '@/lib/meta';

type IdeaResult={
  title:string;
  angle?:string;
  why?:string;
  hook?:string;
  format?:string;
  platform?:string;
};

export function IdeaGenerator({initialAuthor='LAURO',lockAuthor=false}:{initialAuthor?:string,lockAuthor?:boolean}){
  const [form,setForm]=useState({
    author:initialAuthor,
    pillar:'NEGOCIOS',
    platform:'MULTIPLATAFORMA',
    objective:'ALCANCE',
    quantity:'5',
    context:''
  });
  const [result,setResult]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState<number|null>(null);
  const [saved,setSaved]=useState<Record<number,string>>({});

  const update=(k:string,v:string)=>setForm(x=>({...x,[k]:v}));

  async function generate(){
    setLoading(true);
    setResult(null);
    const r=await fetch('/api/generate-ideas',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify(form)
    });
    setResult(await r.json());
    setLoading(false);
  }

  async function persistIdea(idea:IdeaResult,index:number){
    if(saved[index])return saved[index];
    setSaving(index);
    const notes=[
      idea.angle&&('Ângulo: '+idea.angle),
      idea.why&&('Por que funciona: '+idea.why),
      idea.hook&&('Gancho sugerido: '+idea.hook),
      idea.format&&('Formato sugerido: '+idea.format)
    ].filter(Boolean).join('\n\n');
    const r=await fetch('/api/ideas',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({title:idea.title,notes,author:form.author,pillar:form.pillar})
    });
    const j=await r.json();
    setSaved(x=>({...x,[index]:j.id}));
    setSaving(null);
    return j.id as string;
  }

  async function goToScript(idea:IdeaResult,index:number){
    const id=await persistIdea(idea,index);
    const params=new URLSearchParams({
      idea:idea.title,
      ideaId:id,
      platform:idea.platform||form.platform
    });
    window.location.href='/gerador-roteiros?'+params.toString();
  }

  return <div className="generator-grid">
    <section className="panel">
      <div className="form-group">
        <label>Quem aparece?</label>
        <select className="select" value={form.author} onChange={e=>update('author',e.target.value)} disabled={lockAuthor}>
          {enumValues.authors.map(a=><option key={a} value={a}>{authorLabel[a]}</option>)}
        </select>
        {lockAuthor&&<div className="field-hint">Definido pela visão global.</div>}
      </div>

      <div className="form-group mt-4">
        <label>Pilar</label>
        <select className="select" value={form.pillar} onChange={e=>update('pillar',e.target.value)}>
          {enumValues.pillars.map(p=><option key={p} value={p}>{pillarLabel[p]}</option>)}
        </select>
      </div>

      <div className="form-group mt-4">
        <label>Plataforma</label>
        <select className="select" value={form.platform} onChange={e=>update('platform',e.target.value)}>
          <option value="MULTIPLATAFORMA">Multiplataforma</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="TIKTOK">TikTok</option>
          <option value="YOUTUBE">YouTube</option>
          <option value="SHORTS">Shorts</option>
        </select>
      </div>

      <div className="form-group mt-4">
        <label>Objetivo</label>
        <select className="select" value={form.objective} onChange={e=>update('objective',e.target.value)}>
          {['ALCANCE','AUTORIDADE','ENGAJAMENTO','RELACIONAMENTO','VENDA','PROVA'].map(x=><option key={x}>{x}</option>)}
        </select>
      </div>

      <div className="form-group mt-4">
        <label>Quantidade de ideias</label>
        <select className="select" value={form.quantity} onChange={e=>update('quantity',e.target.value)}>
          <option value="5">5 ideias</option>
          <option value="10">10 ideias</option>
        </select>
      </div>

      <div className="form-group mt-4">
        <label>Contexto / direção</label>
        <textarea className="textarea" value={form.context} onChange={e=>update('context',e.target.value)} placeholder="Ex.: quero aproveitar uma viagem, falar com donos de clínica que estão sobrecarregados, usar mais bastidores..."/>
      </div>

      <button className="button mt-5" onClick={generate} disabled={loading}>{loading?'Gerando ideias...':'Gerar ideias'}</button>
    </section>

    <section>
      {result?.ideas?.length?<>
        <div className="ideas generator-ideas">
          {result.ideas.map((idea:IdeaResult,index:number)=><article className="idea-card generated-idea-card" key={idea.title+'-'+index}>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="pill pill-gold">Ideia {index+1}</span>
              {idea.format&&<span className="pill">{idea.format}</span>}
            </div>
            <h3>{idea.title}</h3>
            {idea.angle&&<div className="idea-detail"><strong>Ângulo</strong><p>{idea.angle}</p></div>}
            {idea.why&&<div className="idea-detail"><strong>Por que vale virar conteúdo</strong><p>{idea.why}</p></div>}
            {idea.hook&&<div className="idea-detail"><strong>Gancho possível</strong><p>{idea.hook}</p></div>}
            <div className="flex flex-wrap gap-2 mt-4">
              <button className="button secondary" onClick={()=>persistIdea(idea,index)} disabled={saving===index||Boolean(saved[index])}>
                {saved[index]?'Salvo no banco':saving===index?'Salvando...':'Salvar no Banco de Ideias'}
              </button>
              <button className="button" onClick={()=>goToScript(idea,index)} disabled={saving===index}>Gerar roteiro</button>
            </div>
          </article>)}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {result.training&&<span className="pill pill-gold">Treinamento de ideias: {result.training.label} · v{result.training.version}</span>}
          <span className="small muted">Modo: {result.mode==='llm-webhook'?'IA conectada':'estrutura local; o treinamento será enviado ao LLM quando a integração estiver ativa'}</span>
        </div>
      </>:<div className="empty">Escolha a direção e gere uma lista de temas. Depois você decide quais merecem virar roteiro.</div>}
    </section>
  </div>;
}
