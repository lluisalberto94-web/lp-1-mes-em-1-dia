'use server';
import { prisma } from '@/lib/db';
import { Author, Category, ContentFormat, ContentStatus, Pillar, Platform, PromptScope } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const parseDate=(value:FormDataEntryValue|null)=> value ? new Date(`${String(value)}T12:00:00-03:00`) : null;
export async function updateContentStatus(id:string,status:ContentStatus){await prisma.content.update({where:{id},data:{status}});revalidatePath('/');revalidatePath('/calendario');revalidatePath('/conteudos');}
export async function createIdea(formData:FormData){await prisma.idea.create({data:{title:String(formData.get('title')||''),notes:String(formData.get('notes')||'')||null,author:(formData.get('author')||null) as Author|null,pillar:(formData.get('pillar')||null) as Pillar|null}});revalidatePath('/ideias');}
export async function createContent(formData:FormData){
  const platforms=formData.getAll('platforms').map(String) as Platform[];
  const content=await prisma.content.create({data:{scheduledAt:parseDate(formData.get('scheduledAt')),author:String(formData.get('author')) as Author,pillar:String(formData.get('pillar')) as Pillar,category:String(formData.get('category')) as Category,format:String(formData.get('format')) as ContentFormat,status:String(formData.get('status')) as ContentStatus,headline:String(formData.get('headline')||''),hook:String(formData.get('hook')||'')||null,ideaCore:String(formData.get('ideaCore')||'')||null,script:String(formData.get('script')||'')||null,caption:String(formData.get('caption')||'')||null,cta:String(formData.get('cta')||'')||null,editNotes:String(formData.get('editNotes')||'')||null,parentId:String(formData.get('parentId')||'')||null,publications:{create:platforms.map(platform=>({platform,headline:String(formData.get('headline')||''),caption:String(formData.get('caption')||'')||null,cta:String(formData.get('cta')||'')||null}))}}});
  redirect(`/conteudos/${content.id}`);
}
export async function updateContent(id:string,formData:FormData){await prisma.content.update({where:{id},data:{scheduledAt:parseDate(formData.get('scheduledAt')),author:String(formData.get('author')) as Author,pillar:String(formData.get('pillar')) as Pillar,category:String(formData.get('category')) as Category,format:String(formData.get('format')) as ContentFormat,status:String(formData.get('status')) as ContentStatus,headline:String(formData.get('headline')||''),hook:String(formData.get('hook')||'')||null,ideaCore:String(formData.get('ideaCore')||'')||null,script:String(formData.get('script')||'')||null,caption:String(formData.get('caption')||'')||null,cta:String(formData.get('cta')||'')||null,editNotes:String(formData.get('editNotes')||'')||null,parentId:String(formData.get('parentId')||'')||null}});revalidatePath('/');revalidatePath('/calendario');revalidatePath('/conteudos');revalidatePath(`/conteudos/${id}`);}
export async function updatePublication(id:string,formData:FormData){await prisma.publication.update({where:{id},data:{headline:String(formData.get('headline')||''),caption:String(formData.get('caption')||'')||null,cta:String(formData.get('cta')||'')||null,editNotes:String(formData.get('editNotes')||'')||null,seoTitle:String(formData.get('seoTitle')||'')||null,thumbnailHeadline:String(formData.get('thumbnailHeadline')||'')||null,keywordPrimary:String(formData.get('keywordPrimary')||'')||null,keywordsSecondary:String(formData.get('keywordsSecondary')||'').split(',').map(s=>s.trim()).filter(Boolean),description:String(formData.get('description')||'')||null}});revalidatePath('/conteudos');}


export async function updateTrainingPrompt(formData:FormData){
  const scope=String(formData.get('scope')||'') as PromptScope;
  const prompt=String(formData.get('prompt')||'').trim();
  if(!prompt)return;
  await prisma.$transaction(async(tx)=>{
    const current=await tx.trainingPrompt.findUnique({where:{scope}});
    if(!current){
      await tx.trainingPrompt.create({data:{scope,prompt,revisions:{create:{version:1,prompt}}}});
      return;
    }
    if(current.prompt===prompt)return;
    const next=current.version+1;
    await tx.trainingPrompt.update({where:{id:current.id},data:{prompt,version:next}});
    await tx.promptRevision.create({data:{trainingPromptId:current.id,version:next,prompt}});
  });
  revalidatePath('/treinamento-ia');
}

export async function restoreTrainingPromptRevision(formData:FormData){
  const scope=String(formData.get('scope')||'') as PromptScope;
  const revisionId=String(formData.get('revisionId')||'');
  if(!revisionId)return;
  await prisma.$transaction(async(tx)=>{
    const current=await tx.trainingPrompt.findUnique({where:{scope}});
    const revision=await tx.promptRevision.findUnique({where:{id:revisionId}});
    if(!current||!revision||revision.trainingPromptId!==current.id)return;
    const next=current.version+1;
    await tx.trainingPrompt.update({where:{id:current.id},data:{prompt:revision.prompt,version:next}});
    await tx.promptRevision.create({data:{trainingPromptId:current.id,version:next,prompt:revision.prompt}});
  });
  revalidatePath('/treinamento-ia');
}
