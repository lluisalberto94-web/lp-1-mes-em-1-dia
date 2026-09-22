import { NextResponse } from 'next/server';
import { Author, Pillar } from '@prisma/client';
import { prisma } from '@/lib/db';

export async function POST(req:Request){
  const b=await req.json();
  const idea=await prisma.idea.create({
    data:{
      title:String(b.title||'').trim(),
      notes:String(b.notes||'').trim()||null,
      author:b.author?(String(b.author) as Author):null,
      pillar:b.pillar?(String(b.pillar) as Pillar):null,
    }
  });
  return NextResponse.json({id:idea.id});
}
