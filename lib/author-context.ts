import type { Author } from '@prisma/client';

export const AUTHOR_SCOPE_COOKIE='freire_author_scope';

export const authorScopes=['GERAL','LAURO','RENATA','CASAL'] as const;
export type AuthorScope=(typeof authorScopes)[number];

export const authorScopeLabel:Record<AuthorScope,string>={
  GERAL:'Geral',
  LAURO:'Dr. Lauro',
  RENATA:'Dra. Renata',
  CASAL:'Casal'
};

export function isAuthorScope(value:string|undefined|null):value is AuthorScope{
  return authorScopes.includes(value as AuthorScope);
}

export function scopeToAuthor(scope:AuthorScope):Author|undefined{
  return scope==='GERAL'?undefined:scope as Author;
}
