import { PrismaClient, Author, Category, ContentFormat, ContentStatus, Pillar, Platform, PromptScope, TrainingKind } from '@prisma/client';
import { getDefaultTrainingPrompt } from '../lib/training';
const prisma=new PrismaClient();
const ideas=[
['Sua clínica cresce ou só tem meses bons?',Author.LAURO,Pillar.NEGOCIOS,ContentFormat.REEL,Category.CAPACIDADE,[Platform.INSTAGRAM,Platform.TIKTOK,Platform.YOUTUBE_SHORTS]],
['Follow-up não é mandar: “Oi, conseguiu decidir?”',Author.RENATA,Pillar.MARKETING,ContentFormat.REEL,Category.CAPACIDADE,[Platform.INSTAGRAM,Platform.TIKTOK,Platform.YOUTUBE_SHORTS]],
['Por que clínicas que faturam bem continuam dependentes do dono?',Author.CASAL,Pillar.NEGOCIOS,ContentFormat.VIDEO_LONGO,Category.CAPACIDADE,[Platform.YOUTUBE]],
['3 números que o dono da clínica precisa conhecer além do saldo bancário',Author.LAURO,Pillar.NEGOCIOS,ContentFormat.CARROSSEL,Category.CAPACIDADE,[Platform.INSTAGRAM]],
['Prosperidade não é escolher entre família e empresa',Author.CASAL,Pillar.PROSPERIDADE,ContentFormat.REEL,Category.IDENTIDADE,[Platform.INSTAGRAM,Platform.TIKTOK]],
['Uma decisão difícil que tivemos que tomar nas nossas clínicas',Author.CASAL,Pillar.NEGOCIOS,ContentFormat.REEL,Category.MERECIMENTO,[Platform.INSTAGRAM]],
['Marketing não resolve uma clínica comercialmente desorganizada',Author.CASAL,Pillar.MARKETING,ContentFormat.CORTE,Category.CAPACIDADE,[Platform.INSTAGRAM,Platform.TIKTOK,Platform.YOUTUBE_SHORTS]],
['Seu problema talvez não seja falta de lead',Author.RENATA,Pillar.MARKETING,ContentFormat.REEL,Category.CAPACIDADE,[Platform.INSTAGRAM,Platform.TIKTOK]],
['Se tudo precisa passar por você, você não tem uma equipe. Tem ajudantes.',Author.LAURO,Pillar.LIDERANCA,ContentFormat.REEL,Category.CAPACIDADE,[Platform.INSTAGRAM,Platform.TIKTOK,Platform.YOUTUBE_SHORTS]],
['O que casamento nos ensinou sobre sociedade',Author.CASAL,Pillar.MATRIMONIO,ContentFormat.REEL,Category.IDENTIDADE,[Platform.INSTAGRAM]],
['Faturamento alto não significa empresa saudável',Author.LAURO,Pillar.NEGOCIOS,ContentFormat.REEL,Category.CAPACIDADE,[Platform.INSTAGRAM,Platform.TIKTOK]],
['Vender é transferir certeza com entusiasmo',Author.RENATA,Pillar.MARKETING,ContentFormat.REEL,Category.CAPACIDADE,[Platform.INSTAGRAM,Platform.TIKTOK,Platform.YOUTUBE_SHORTS]],
['Fé não substitui responsabilidade',Author.CASAL,Pillar.FE,ContentFormat.REEL,Category.IDENTIDADE,[Platform.INSTAGRAM]],
['O dono que resolve tudo está treinando a empresa para depender dele',Author.LAURO,Pillar.LIDERANCA,ContentFormat.REEL,Category.CAPACIDADE,[Platform.INSTAGRAM,Platform.YOUTUBE_SHORTS]]
] as const;
const status=[ContentStatus.GRAVAR,ContentStatus.ROTEIRO,ContentStatus.AGENDADO,ContentStatus.EDITANDO,ContentStatus.IDEIA,ContentStatus.GRAVADO,ContentStatus.APROVACAO,ContentStatus.GRAVAR,ContentStatus.ROTEIRO,ContentStatus.IDEIA,ContentStatus.AGENDADO,ContentStatus.GRAVADO,ContentStatus.IDEIA,ContentStatus.ROTEIRO];
async function seedTraining(){
  for(const kind of Object.values(TrainingKind) as TrainingKind[]){
    for(const scope of Object.values(PromptScope) as PromptScope[]){
      const prompt=getDefaultTrainingPrompt(kind,scope);
      const existing=await prisma.trainingPrompt.findFirst({where:{kind,scope}});
      if(!existing){
        await prisma.trainingPrompt.create({data:{kind,scope,prompt,revisions:{create:{version:1,prompt}}}});
      }
    }
  }
}
async function main(){
  await seedTraining();

  const demoHeadlines=ideas.map(([headline])=>headline);
  const keepHeadline=ideas[0][0];

  // Remove only the demo content shipped by this project. Never touch user-created content.
  await prisma.content.deleteMany({
    where:{
      headline:{in:demoHeadlines.filter((headline)=>headline!==keepHeadline) as string[]}
    }
  });

  // Keep a single clean example in the library, unscheduled and in the earliest workflow stage.
  const existingDemo=await prisma.content.findFirst({where:{headline:keepHeadline}});
  if(existingDemo){
    await prisma.content.update({
      where:{id:existingDemo.id},
      data:{
        scheduledAt:null,
        status:ContentStatus.IDEIA,
        parentId:null
      }
    });
  }

  // If the database has no content at all, create only one example instead of the old 14-item demo set.
  if(await prisma.content.count())return;

  const [headline,author,pillar,format,category,platforms]=ideas[0];
  await prisma.content.create({
    data:{
      scheduledAt:null,
      headline,
      author,
      pillar,
      format,
      category,
      status:ContentStatus.IDEIA,
      hook:`Para aí rapidinho: ${headline}`,
      ideaCore:`Conectar “${headline}” à realidade do dono de clínica e ao inimigo central: improviso.`,
      script:`GANCHO
${headline}

PROBLEMA
Mostre o custo do improviso.

DESENVOLVIMENTO
Traga um princípio aplicável.

EXEMPLO
Use um bastidor, número ou situação real.

CONCLUSÃO
Crescimento com estrutura, execução e princípios.`,
      caption:`${headline}

O problema não é trabalhar pouco. É trabalhar sem sistema.`,
      cta:'Salve e compartilhe com outro dono de clínica.',
      editNotes:'Sem vinheta. Corte seco. Headline nos primeiros 2 segundos. Legenda dinâmica.',
      publications:{
        create:platforms.map((platform:Platform)=>({
          platform,
          headline,
          caption:`${headline}

Menos improviso. Mais estrutura.`,
          cta:'Salve e compartilhe.',
          sourceOrigin:'ORIGINAL VERTICAL'
        }))
      }
    }
  });
}
main().finally(()=>prisma.$disconnect());
