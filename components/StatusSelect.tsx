'use client';
import { ContentStatus } from '@prisma/client';
import { updateContentStatus } from '@/app/actions';
import { statusLabel } from '@/lib/meta';
import { useTransition } from 'react';
export function StatusSelect({id,value}:{id:string,value:ContentStatus}){const [pending,startTransition]=useTransition();return <select aria-label="Alterar status" className="status-select" defaultValue={value} disabled={pending} onChange={e=>startTransition(()=>updateContentStatus(id,e.target.value as ContentStatus))}>{Object.values(ContentStatus).map(s=><option key={s} value={s}>{statusLabel[s]}</option>)}</select>}
