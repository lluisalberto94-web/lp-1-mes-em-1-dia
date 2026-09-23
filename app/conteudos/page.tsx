import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Author, ContentFormat, ContentStatus, Pillar, Platform, Prisma } from '@prisma/client';
import { authorLabel, enumValues, formatDate, formatLabel, pillarLabel, statusClass, statusLabel } from '@/lib/meta';
import { getAuthorScope } from '@/lib/author-context-server';
import { authorScopeLabel, scopeToAuthor } from '@/lib/author-context';

export const dynamic='force-dynamic';

export default async function Contents({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const scope=await getAuthorScope();
  const activeAuthor=scopeToAuthor(scope);
  const where:Prisma.ContentWhereInput={};

  if(params.q)where.OR=[{headline:{contains:params.q,mode:'insensitive'}},{hook:{contains:params.q,mode:'insensitive'}},{script:{contains:params.q,mode:'insensitive'}}];
  if(activeAuthor)where.author=activeAuthor;
  else if(params.author)where.author=params.author as Author;
  if(params.pillar)where.pillar=params.pillar as Pillar;
  if(params.status)where.status=params.status as ContentStatus;
  if(params.format)where.format=params.format as ContentFormat;
  if(params.platform)where.publications={some:{platform:params.platform as Platform}};

  const data=await prisma.content.findMany({where,include:{publications:true},orderBy:[{scheduledAt:'asc'},{createdAt:'desc'}]});

  return <div className="content">
    <div className="page-head">
      <div>
        <div className="eyebrow">Biblioteca operacional · {authorScopeLabel[scope]}</div>
        <h1>Conteúdos</h1>
        <p>Busque, filtre e abra qualquer ativo ou derivação.</p>
      </div>
      <Link className="button" href="/conteudos/novo">+ Novo conteúdo</Link>
    </div>

    <form className="filters">
      <input className="field" name="q" defaultValue={params.q} placeholder="Buscar: follow-up, processo..."/>
      {activeAuthor
        ?<div className="scope-filter-lock"><span>Autor</span><strong>{authorLabel[activeAuthor]}</strong></div>
        :<select className="select" name="author" defaultValue={params.author||''}><option value="">Autor</option>{enumValues.authors.map(a=><option value={a} key={a}>{authorLabel[a]}</option>)}</select>}
      <select className="select" name="platform" defaultValue={params.platform||''}><option value="">Plataforma</option>{enumValues.platforms.map(p=><option value={p} key={p}>{p.replace('YOUTUBE_SHORTS','YouTube Shorts')}</option>)}</select>
      <select className="select" name="pillar" defaultValue={params.pillar||''}><option value="">Pilar</option>{enumValues.pillars.map(p=><option value={p} key={p}>{pillarLabel[p]}</option>)}</select>
      <select className="select" name="status" defaultValue={params.status||''}><option value="">Status</option>{enumValues.statuses.map(s=><option value={s} key={s}>{statusLabel[s]}</option>)}</select>
      <select className="select" name="format" defaultValue={params.format||''}><option value="">Formato</option>{enumValues.formats.map(f=><option value={f} key={f}>{formatLabel[f]}</option>)}</select>
      <button className="button secondary">Filtrar</button>
    </form>

    <div className="table">
      <div className="table-row table-head"><span>Data</span><span>Headline</span><span>Autor</span><span>Pilar</span><span>Formato</span><span>Status</span></div>
      {data.map(c=><Link className="table-row" key={c.id} href={`/conteudos/${c.id}`}><span className="small muted">{formatDate(c.scheduledAt)}</span><div><div className="title">{c.headline}</div><div className="small muted mt-1">{c.publications.map(p=>p.platform.replace('YOUTUBE_SHORTS','SHORTS')).join(' · ')}</div></div><span>{authorLabel[c.author]}</span><span className="small">{pillarLabel[c.pillar]}</span><span className="pill">{formatLabel[c.format]}</span><span className={statusClass[c.status]}>{statusLabel[c.status]}</span></Link>)}
      {!data.length&&<div className="empty">Nada encontrado nesta visão.</div>}
    </div>
  </div>;
}
