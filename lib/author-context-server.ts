import 'server-only';
import { cookies } from 'next/headers';
import { AUTHOR_SCOPE_COOKIE, AuthorScope, isAuthorScope, scopeToAuthor } from '@/lib/author-context';

export async function getAuthorScope():Promise<AuthorScope>{
  const store=await cookies();
  const value=store.get(AUTHOR_SCOPE_COOKIE)?.value;
  return isAuthorScope(value)?value:'GERAL';
}

export async function getActiveAuthor(){
  return scopeToAuthor(await getAuthorScope());
}
