'use client';

import { useState } from 'react';
import { authorLabel, enumValues, pillarLabel } from '@/lib/meta';

export function Generator({initialIdea='',ideaId,initialPlatform='MULTIPLATAFORMA'}:{initialIdea?:string,ideaId?:string,initialPlatform?:string}){
  const [form,setForm]=useState({
    author:'LAURO',
    pillar:'NEGOCIOS',
    platform:['INSTAGRAM','TIKTOK','YOUTUBE','SHORTS','MULTIPLATAFORMA'].includes(initialPlatform)?initialPlatform:'MULTIPLATAFORMA',
    objective:'AUTORIDADE',
    idea:initialIdea,
    context:'',
    date:new Date().toISOString().slice(0,10)
  });
  const [result,setResult]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [saved,setSaved]=useState<string>('');
  const update=(k:string,v:string)=>setForm(x=>({...x,[k]:v}));

  async function generate(){
    setLoading(true);
    setSaved('');
    const r=await fetch('/api/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(form)});
    setResult(await r.json());
    setLoading(false);
  }

  async function save(){
    const r=await fetch('/api/contents',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...form,result,ideaId})});
    const j=await r.json();
    setSaved(j.id);
  }

  return <div className="generator-grid">
    <section className="panel">
      <div className="form-group">
        <label>Quem aparece?</label>
        <select className="select" value={form.author} onChange={e=>update('author',e.target.value)}>
          {enumValues.authors.map(a=><option key={a} value={a}>{authorLabel[a]}</option>)}
        </select>
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
          <option value="INSTAGRAM">Instagram</option>
          <option value="TIKTOK">TikTok</option>
          <option value="YOUTUBE">YouTube</option>
          <option value="SHORTS">Shorts</option>
          <option value="MULTIPLATAFORMA">Multiplataforma</option>
        </select>
      </div>

      <div className="form-group mt-4">
        <label>Objetivo</label>
        <select className="select" value={form.objective} onChange={e=>update('objective',e.target.value)}>
          {['AUTORIDADE','ALCANCE','ENGAJAMENTO','RELACIONAMENTO','VENDA','PROVA'].map(x=><option key={x}>{x}</option>)}
        </select>
      </div>

      <div className="form-group mt-4">
        <label>Data</label>
        <input className="field" type="date" value={form.date} onChange={e=>update('date',e.target.value)}/>
      </div>

      <div className="form-group mt-4">
        <label>Ideia escolhida</label>
        <textarea className="textarea" value={form.idea} onChange={e=>update('idea',e.target.value)} placeholder="Ex.: clínicas que aumentam marketing quando o problema está no comercial"/>
      </div>

      <div className="form-group mt-4">
        <label>Contexto adicional</label>
        <textarea className="textarea" value={form.context} onChange={e=>update('context',e.target.value)} placeholder="Ex.: usar um caso real, tom mais direto, vídeo gravado no carro..."/>
      </div>

      <button className="button mt-5" onClick={generate} disabled={loading||!form.idea.trim()}>{loading?'Gerando roteiro...':'Gerar roteiro'}</button>
    </section>

    <section>{result?<>
      <div className="result-block"><h3>3 headlines</h3><ol className="list-decimal pl-5">{result.headlines?.map((h:string)=><li key={h}>{h}</li>)}</ol></div>
      {[
        ['Gancho',result.hook],
        ['Ideia central',result.ideaCore],
        ['Roteiro',result.script],
        ['CTA',result.cta],
        ['Legenda Instagram',result.instagram],
        ['Versão TikTok',result.tiktok],
        ['Hashtags',result.hashtags?.join(' ')],
        ['Instrução de edição',result.editNotes]
      ].map(([t,v])=>v&&<div className="result-block" key={t}><h3>{t}</h3><p className="whitespace-pre-wrap">{v}</p></div>)}

      {result.youtube&&<div className="result-block"><h3>YouTube SEO</h3><p><strong>{result.youtube.title}</strong></p><p>Thumbnail: {result.youtube.thumbnail}</p><p>Palavra-chave: {result.youtube.keyword}</p><p>Cortes: {result.youtube.cuts.join(' · ')}</p></div>}
      {result.short&&<div className="result-block"><h3>Short</h3><p>{result.short.title} · {result.short.headline}</p></div>}

      <div className="flex flex-wrap items-center gap-3">
        <button className="button" onClick={save}>Salvar como conteúdo</button>
        {saved&&<a className="button secondary" href={'/conteudos/'+saved}>Abrir conteúdo</a>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {result.training&&<span className="pill pill-gold">Treinamento de roteiro: {result.training.label} · v{result.training.version}</span>}
        <span className="small muted">Modo: {result.mode==='llm-webhook'?'IA conectada':'estrutura local; o treinamento será enviado ao LLM quando a integração estiver ativa'}</span>
      </div>
    </>:<div className="empty">Escolha uma ideia e transforme em roteiro. Se ainda não tem o tema, comece no Gerador de Ideias.</div>}</section>
  </div>;
}
