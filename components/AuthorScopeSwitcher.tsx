'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { AUTHOR_SCOPE_COOKIE, AuthorScope, authorScopeLabel, authorScopes } from '@/lib/author-context';

export function AuthorScopeSwitcher({active,compact=false}:{active:AuthorScope,compact?:boolean}){
  const router=useRouter();
  const [pending,startTransition]=useTransition();

  function select(scope:AuthorScope){
    if(scope===active)return;
    document.cookie=`${AUTHOR_SCOPE_COOKIE}=${scope}; path=/; max-age=31536000; samesite=lax`;
    startTransition(()=>router.refresh());
  }

  return <div className={compact?'author-scope author-scope-compact':'author-scope'}>
    <div className="author-scope-label">{compact?'Visão':'Quem está usando?'}</div>
    <div className="author-scope-buttons">
      {authorScopes.map(scope=><button
        type="button"
        key={scope}
        className={scope===active?'author-scope-button active':'author-scope-button'}
        onClick={()=>select(scope)}
        disabled={pending}
        aria-pressed={scope===active}
      >{authorScopeLabel[scope]}</button>)}
    </div>
  </div>;
}
