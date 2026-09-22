import Link from 'next/link';
import { prisma } from '@/lib/db';
import { authorLabel, formatDate, pillarLabel, statusClass, statusLabel } from '@/lib/meta';
import { ContentStatus, Pillar } from '@prisma/client';
export const dynamic='force-dynamic';
export default async function Dashboard(){
 const now=new Date(); const end=new Date(now); end.setDate(end.getDate()+7);
 const [week,upcoming]=await Promise.all([prisma.content.findMany({where:{scheduledAt:{gte:now,lte:end}},include:{publications:true}}),prisma.content.findMany({where:{scheduledAt:{gte:now}},orderBy:{scheduledAt:'asc'},take:6,include:{publications:true}})]);
 const count=(s:ContentStatus)=>week.filter(x=>x.status===s).length;
 const dist=Object.values(Pillar).map(p=>({p,n:week.filter(x=>x.pillar===p).length})); const max=Math.max(1,...dist.map(x=>x.n));
 const authors=['LAURO','RENATA','CASAL'] as const;
 return <div className="content"><div className="page-head"><div><div className="eyebrow">Visão executiva</div><h1>O que precisa andar agora.</h1><p>Produção, aprovação e distribuição sem planilha paralela.</p></div><Link className="button" href="/conteudos/novo">+ Novo conteúdo</Link></div>
 <section className="grid-metrics">{[[week.length,'Conteúdos esta semana','programados'],[count(ContentStatus.GRAVAR),'A gravar','produção'],[count(ContentStatus.EDITANDO),'Em edição','pós-produção'],[count(ContentStatus.APROVACAO)+count(ContentStatus.AGENDADO),'Prontos','aprovar/agendar'],[count(ContentStatus.PUBLICADO),'Publicados','no período']].map(([n,l,e])=><div className="metric" key={String(l)}><span>{l}</span><strong>{n}</strong><em>{e}</em></div>)}</section>
 <div className="two-col"><section className="panel"><h2>Próximos conteúdos</h2><div className="list">{upcoming.map(c=><Link className="row" key={c.id} href={`/conteudos/${c.id}`}><span className="pill pill-gold">{formatDate(c.scheduledAt)}</span><div><div className="title">{c.headline}</div><div className="small muted">{c.publications.map(p=>p.platform.replace('YOUTUBE_SHORTS','SHORTS')).join(' · ')}</div></div><span className="small">{authorLabel[c.author]}</span><span className={statusClass[c.status]}>{statusLabel[c.status]}</span></Link>)}</div></section>
 <section className="panel"><h2>Distribuição por pilar</h2>{dist.map(d=><div className="dist-row" key={d.p}><span className="small muted">{pillarLabel[d.p]}</span><div className="bar"><span style={{width:`${(d.n/max)*100}%`}}/></div><strong>{d.n}</strong></div>)}<h2 className="mt-8">Quem está gravando</h2><div className="flex flex-wrap gap-2">{authors.map(a=><span className="pill" key={a}>{authorLabel[a]} · {week.filter(x=>x.author===a).length}</span>)}</div></section></div></div>}
