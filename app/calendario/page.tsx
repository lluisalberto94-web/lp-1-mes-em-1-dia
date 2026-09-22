import Link from 'next/link';
import { prisma } from '@/lib/db';
import { authorLabel, formatDate, formatLabel, pillarLabel, statusClass, statusLabel } from '@/lib/meta';
import { StatusSelect } from '@/components/StatusSelect';
export const dynamic='force-dynamic';

export default async function Calendar({searchParams}:{searchParams:Promise<{days?:string,view?:string}>}){
  const params=await searchParams;
  const days=[7,14,30].includes(Number(params.days))?Number(params.days):14;
  const view=params.view==='list'?'list':'grid';
  const start=new Date();start.setHours(0,0,0,0);
  const end=new Date(start);end.setDate(end.getDate()+days);
  const contents=await prisma.content.findMany({
    where:{scheduledAt:{gte:start,lt:end}},
    orderBy:{scheduledAt:'asc'},
    include:{publications:true}
  });
  const dates=Array.from({length:days},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return d});
  const dayLabel=(d:Date)=>new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(d).replace('.','').toUpperCase();

  return <div className="content">
    <div className="page-head calendar-page-head">
      <div>
        <div className="eyebrow">Calendário editorial</div>
        <h1>{days} dias de visão.</h1>
        <p>Headline, autor, formato e estágio visíveis sem abrir cinco ferramentas.</p>
      </div>
      <div className="calendar-controls">
        <div className="calendar-switch" aria-label="Período">
          {[7,14,30].map(n=><Link className={days===n?'active':''} key={n} href={`/calendario?days=${n}&view=${view}`}>{n} dias</Link>)}
        </div>
        <div className="calendar-switch" aria-label="Visualização">
          <Link className={view==='grid'?'active':''} href={`/calendario?days=${days}&view=grid`}>Blocos</Link>
          <Link className={view==='list'?'active':''} href={`/calendario?days=${days}&view=list`}>Lista</Link>
        </div>
      </div>
    </div>

    {view==='grid'?<div className="calendar">{dates.map(d=>{
      const key=d.toDateString();
      const items=contents.filter(c=>c.scheduledAt?.toDateString()===key);
      return <section className="day" key={key}>
        <div className="day-head"><strong>{dayLabel(d)}</strong><span>{formatDate(d)}</span></div>
        {items.length?items.map(c=><article className="content-card calendar-card" key={c.id}>
          <div className="calendar-card-main">
            <div className="card-meta">
              <span className="pill pill-gold">{formatLabel[c.format]}</span>
              <span className={statusClass[c.status]}>{statusLabel[c.status]}</span>
            </div>
            <Link className="calendar-card-title" href={`/conteudos/${c.id}`}><h3>{c.headline}</h3></Link>
            <div className="calendar-card-details">
              <div className="small muted">{authorLabel[c.author]}</div>
              <div className="small muted mt-1">{pillarLabel[c.pillar]}</div>
              <div className="small mt-2">{c.publications.map(p=>p.platform.replace('YOUTUBE_SHORTS','SHORTS')).join(' · ')}</div>
            </div>
          </div>
          <div className="calendar-card-footer"><StatusSelect id={c.id} value={c.status}/></div>
        </article>):<div className="empty small">Sem conteúdo</div>}
      </section>
    })}</div>:<div className="calendar-list-wrap">
      <div className="calendar-list">
        <div className="calendar-list-row calendar-list-head">
          <span>Data</span><span>Dia</span><span>Título</span><span>Autor</span><span>Pilar</span><span>Plataforma</span><span>Status</span>
        </div>
        {contents.length?contents.map(c=>{
          const d=c.scheduledAt||start;
          return <div className="calendar-list-row" key={c.id}>
            <span className="calendar-list-date" data-label="Data">{formatDate(d)}</span>
            <span className="small muted" data-label="Dia">{dayLabel(d)}</span>
            <Link className="calendar-list-title" data-label="Título" href={`/conteudos/${c.id}`}>{c.headline}</Link>
            <span data-label="Autor">{authorLabel[c.author]}</span>
            <span data-label="Pilar">{pillarLabel[c.pillar]}</span>
            <span data-label="Plataforma">{c.publications.map(p=>p.platform.replace('YOUTUBE_SHORTS','SHORTS')).join(' · ')||'—'}</span>
            <div className="calendar-list-status" data-label="Status"><StatusSelect id={c.id} value={c.status}/></div>
          </div>
        }):<div className="empty">Nenhum conteúdo programado neste período.</div>}
      </div>
    </div>}
  </div>
}
