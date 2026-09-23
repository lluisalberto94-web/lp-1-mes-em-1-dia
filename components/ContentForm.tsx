import { enumValues, authorLabel, categoryLabel, formatLabel, pillarLabel, statusLabel, platformLabel } from '@/lib/meta';
import { Author, Content } from '@prisma/client';

export function ContentForm({content,parents,initialAuthor='LAURO',lockAuthor=false}:{content?:Content,parents?:Content[],initialAuthor?:Author,lockAuthor?:boolean}){
  const authorValue=content?.author||initialAuthor;

  return <div className="form-grid">
    <div className="form-group"><label>Data</label><input className="field" type="date" name="scheduledAt" defaultValue={content?.scheduledAt?content.scheduledAt.toISOString().slice(0,10):''}/></div>
    <div className="form-group">
      <label>Autor</label>
      {lockAuthor&&!content
        ?<><input type="hidden" name="author" value={authorValue}/><select className="select" value={authorValue} disabled aria-label="Autor definido pela visão global">{enumValues.authors.map(v=><option key={v} value={v}>{authorLabel[v]}</option>)}</select><div className="field-hint">Definido pela visão global.</div></>
        :<select className="select" name="author" defaultValue={authorValue}>{enumValues.authors.map(v=><option key={v} value={v}>{authorLabel[v]}</option>)}</select>}
    </div>
    <div className="form-group"><label>Pilar</label><select className="select" name="pillar" defaultValue={content?.pillar||'NEGOCIOS'}>{enumValues.pillars.map(v=><option key={v} value={v}>{pillarLabel[v]}</option>)}</select></div>
    <div className="form-group"><label>Categoria</label><select className="select" name="category" defaultValue={content?.category||'CAPACIDADE'}>{enumValues.categories.map(v=><option key={v} value={v}>{categoryLabel[v]}</option>)}</select></div>
    <div className="form-group"><label>Formato</label><select className="select" name="format" defaultValue={content?.format||'REEL'}>{enumValues.formats.map(v=><option key={v} value={v}>{formatLabel[v]}</option>)}</select></div>
    <div className="form-group"><label>Status</label><select className="select" name="status" defaultValue={content?.status||'IDEIA'}>{enumValues.statuses.map(v=><option key={v} value={v}>{statusLabel[v]}</option>)}</select></div>
    {!content&&<div className="form-group full"><label>Publicações</label><div className="flex flex-wrap gap-3">{enumValues.platforms.map(v=><label className="pill" key={v}><input type="checkbox" name="platforms" value={v} defaultChecked={v==='INSTAGRAM'}/>{platformLabel[v]}</label>)}</div></div>}
    <div className="form-group full"><label>Conteúdo-mãe</label><select className="select" name="parentId" defaultValue={content?.parentId||''}><option value="">Nenhum</option>{parents?.filter(p=>p.id!==content?.id).map(p=><option key={p.id} value={p.id}>{p.headline}</option>)}</select></div>
    <div className="form-group full"><label>Headline</label><input className="field" name="headline" required defaultValue={content?.headline||''}/></div>
    <div className="form-group full"><label>Gancho</label><textarea className="textarea" name="hook" defaultValue={content?.hook||''}/></div>
    <div className="form-group full"><label>Ideia central</label><textarea className="textarea" name="ideaCore" defaultValue={content?.ideaCore||''}/></div>
    <div className="form-group full"><label>Roteiro</label><textarea className="textarea" name="script" defaultValue={content?.script||''}/></div>
    <div className="form-group full"><label>Legenda base</label><textarea className="textarea" name="caption" defaultValue={content?.caption||''}/></div>
    <div className="form-group"><label>CTA</label><textarea className="textarea" name="cta" defaultValue={content?.cta||''}/></div>
    <div className="form-group"><label>Instrução de edição</label><textarea className="textarea" name="editNotes" defaultValue={content?.editNotes||''}/></div>
  </div>;
}
