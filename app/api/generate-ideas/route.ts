import { NextResponse } from 'next/server';
import { TrainingKind } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getDefaultTrainingPrompt, promptScopeLabels, scopeFromPlatform } from '@/lib/training';

const ideaBanks:Record<string,string[]>={
  NEGOCIOS:[
    'O dono que cresce faturamento e continua sem empresa',
    '3 decisões que uma clínica não pode tomar olhando só para o caixa',
    'Quando contratar mais gente piora a operação',
    'O crescimento que aumenta o caos em vez do lucro',
    'Por que clínicas boas continuam dependentes do dono',
    'O indicador que revela se sua clínica tem estrutura ou só movimento',
    'Seu faturamento cresceu. Sua empresa também?',
    'O custo invisível de centralizar todas as decisões',
    'A diferença entre uma clínica ocupada e uma clínica saudável',
    'O processo que o dono costuma criar tarde demais'
  ],
  MARKETING:[
    'Seu problema talvez não seja falta de lead',
    'Mais tráfego pode piorar uma operação comercial desorganizada',
    'O follow-up que parece cobrança e afasta o paciente',
    'Por que marketing bom não salva atendimento ruim',
    'A métrica de marketing que engana donos de clínica',
    'Lead não é venda: onde a clínica perde dinheiro no meio do caminho',
    'O anúncio funcionou. Então por que o caixa não sentiu?',
    'A diferença entre gerar demanda e desperdiçar oportunidade',
    'O erro de tratar todo lead como se estivesse pronto para comprar',
    'Quando baixar o CPL vira uma péssima meta'
  ],
  LIDERANCA:[
    'Se tudo precisa passar por você, sua equipe não ganhou autonomia',
    'O dono que resolve tudo treina a empresa para depender dele',
    'Delegar tarefa não é delegar responsabilidade',
    'Por que bons funcionários parecem fracos em processos ruins',
    'A reunião que existe porque ninguém sabe quem decide',
    'O custo de contratar sem definir o que é bom desempenho',
    'Sua equipe precisa de mais cobrança ou mais clareza?',
    'O líder que responde tudo cria uma equipe que pergunta tudo',
    'Processo ruim transforma gente boa em gente lenta',
    'Quando confiança sem acompanhamento vira desorganização'
  ],
  FE:[
    'Fé não substitui responsabilidade',
    'O princípio que fica caro no curto prazo e protege no longo',
    'Como tomar decisões difíceis sem negociar convicções',
    'Prosperidade sem propósito vira só acúmulo',
    'O que responsabilidade tem a ver com confiança em Deus',
    'Princípios precisam aparecer também quando o caixa aperta',
    'A decisão empresarial que revela o que você realmente valoriza',
    'Quando resultado e princípio parecem entrar em conflito',
    'Fé aplicada à empresa sem transformar conteúdo em pregação',
    'O que muda quando o empresário para de separar caráter e gestão'
  ],
  MATRIMONIO:[
    'O que casamento nos ensinou sobre sociedade',
    'Como discordar sem transformar a empresa em campo de batalha',
    'O erro de levar toda conversa de trabalho para dentro de casa',
    'Casal empreendedor precisa de papéis claros, não de adivinhação',
    'Quando o negócio começa a competir com a família',
    'O acordo que evita pequenas frustrações virarem grandes conflitos',
    'Por que alinhamento no casamento também é processo',
    'Como decidir quando os dois têm opiniões fortes',
    'O que sociedade e casamento têm em comum sobre expectativa',
    'A conversa que casal empreendedor adia até virar problema'
  ],
  PROSPERIDADE:[
    'Prosperidade não é escolher entre família e empresa',
    'Faturar mais sem ganhar liberdade é crescimento incompleto',
    'O empresário que cresce por fora e empobrece a rotina',
    'O que significa construir riqueza sem perder presença',
    'Resultado financeiro é parte da prosperidade, não a definição inteira',
    'Quando o negócio ganha e a família paga a conta',
    'A diferença entre ganhar dinheiro e construir uma vida próspera',
    'Por que liberdade exige estrutura antes de exigir faturamento',
    'Crescimento saudável precisa caber na vida real',
    'O preço de uma empresa que só funciona com sua presença'
  ]
};

function fallback(body:any,training:{scope:string;version:number}){
  const bank=ideaBanks[body.pillar]||ideaBanks.NEGOCIOS;
  const qty=Math.min(Math.max(Number(body.quantity)||5,3),10);
  const platform=body.platform||'MULTIPLATAFORMA';
  const ideas=bank.slice(0,qty).map((title,index)=>({
    title,
    angle:index%3===0?'Contraste entre resultado aparente e estrutura real':index%3===1?'Erro comum que parece lógico, mas cobra um preço depois':'Sinal prático que o empresário consegue reconhecer na própria operação',
    why:'Conecta uma dor concreta do dono de clínica a uma decisão de gestão, sem depender de motivação genérica.',
    hook:index%2===0?`Tem uma diferença enorme entre crescer e só ficar mais ocupado.`:`Se isso ainda depende de você, o problema não é falta de esforço.`,
    format:platform==='YOUTUBE'?'Vídeo longo':platform==='INSTAGRAM'?'Reel ou carrossel':platform==='TIKTOK'?'Vídeo falado':platform==='SHORTS'?'Short vertical':'Reel + TikTok + Shorts',
    platform
  }));
  return {mode:'structured-fallback',training:{kind:'IDEIA',scope:training.scope,label:promptScopeLabels[training.scope as keyof typeof promptScopeLabels],version:training.version},ideas};
}

export async function POST(req:Request){
  const body=await req.json();
  const kind=TrainingKind.IDEIA;
  const scope=scopeFromPlatform(body.platform);
  const defaultPrompt=getDefaultTrainingPrompt(kind,scope);

  let training=await prisma.trainingPrompt.findFirst({where:{kind,scope}});
  if(!training){
    training=await prisma.trainingPrompt.create({data:{kind,scope,prompt:defaultPrompt,revisions:{create:{version:1,prompt:defaultPrompt}}}});
  }

  await prisma.$transaction([
    prisma.trainingPrompt.update({where:{id:training.id},data:{usageCount:{increment:1}}}),
    prisma.generationLog.create({data:{
      trainingPromptId:training.id,
      kind,
      scope,
      promptVersion:training.version,
      platform:String(body.platform||'MULTIPLATAFORMA'),
      author:body.author?String(body.author):null,
      pillar:body.pillar?String(body.pillar):null,
      objective:body.objective?String(body.objective):null,
      idea:body.context?String(body.context):null
    }})
  ]).catch(()=>null);

  const trainingMeta={kind:'IDEIA',scope,label:promptScopeLabels[scope],version:training.version};
  const effectiveBody={...body,generatorType:'IDEIA',systemPrompt:training.prompt,training:trainingMeta};
  const webhook=process.env.AI_WEBHOOK_URL;

  if(webhook){
    try{
      const r=await fetch(webhook,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(effectiveBody),cache:'no-store'});
      if(r.ok)return NextResponse.json({mode:'llm-webhook',training:trainingMeta,...(await r.json())});
    }catch{}
  }

  return NextResponse.json(fallback(body,{scope,version:training.version}));
}
