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
      const existing=await prisma.trainingPrompt.findUnique({where:{kind_scope:{kind,scope}}});
      if(!existing){
        await prisma.trainingPrompt.create({data:{kind,scope,prompt,revisions:{create:{version:1,prompt}}}});
      }
    }
  }
}
async function main(){await seedTraining();if(await prisma.content.count())return;const created:any[]=[];for(let i=0;i<ideas.length;i++){const [headline,author,pillar,format,category,platforms]=ideas[i];const d=new Date('2026-09-22T12:00:00-03:00');d.setDate(d.getDate()+i);const c=await prisma.content.create({data:{scheduledAt:d,headline,author,pillar,format,category,status:status[i],hook:`Para aí rapidinho: ${headline}`,ideaCore:`Conectar “${headline}” à realidade do dono de clínica e ao inimigo central: improviso.`,script:`GANCHO\n${headline}\n\nPROBLEMA\nMostre o custo do improviso.\n\nDESENVOLVIMENTO\nTraga um princípio aplicável.\n\nEXEMPLO\nUse um bastidor, número ou situação real.\n\nCONCLUSÃO\nCrescimento com estrutura, execução e princípios.`,caption:`${headline}\n\nO problema não é trabalhar pouco. É trabalhar sem sistema.`,cta:i===13?'Salve para revisar com sua equipe.':'Salve e compartilhe com outro dono de clínica.',editNotes:'Sem vinheta. Corte seco. Headline nos primeiros 2 segundos. Legenda dinâmica.',publications:{create:platforms.map((platform:Platform)=>({platform,headline,caption:`${headline}\n\nMenos improviso. Mais estrutura.`,cta:'Salve e compartilhe.',seoTitle:platform===Platform.YOUTUBE?`${headline} | Gestão de clínicas`:null,thumbnailHeadline:platform===Platform.YOUTUBE?'VOCÊ VIROU O GARGALO':null,keywordPrimary:platform===Platform.YOUTUBE?'gestão de clínicas':null,keywordsSecondary:platform===Platform.YOUTUBE?['processos','liderança','crescimento']:[],description:platform===Platform.YOUTUBE?'Como reduzir a dependência do dono e estruturar a clínica para crescer com previsibilidade.':null,sourceOrigin:format===ContentFormat.CORTE?'CORTE DO YOUTUBE':'ORIGINAL VERTICAL'}))}}});created.push(c);}await prisma.content.update({where:{id:created[3].id},data:{parentId:created[2].id}});await prisma.content.update({where:{id:created[6].id},data:{parentId:created[2].id}});await prisma.idea.createMany({data:[{title:'Lauro: empresário que confunde saldo com lucro',notes:'Usar exemplo de decisão errada tomada olhando só caixa.',author:Author.LAURO,pillar:Pillar.NEGOCIOS},{title:'Renata: follow-up que nutre em vez de cobrar resposta',author:Author.RENATA,pillar:Pillar.MARKETING},{title:'Casal: uma decisão em que princípio custou mais no curto prazo',author:Author.CASAL,pillar:Pillar.FE}]});}
main().finally(()=>prisma.$disconnect());
