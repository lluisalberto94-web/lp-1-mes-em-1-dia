import { Author, Category, ContentFormat, ContentStatus, Pillar, Platform } from '@prisma/client';

export const authorLabel: Record<Author,string> = { LAURO:'Lauro', RENATA:'Renata', CASAL:'Lauro + Renata' };
export const pillarLabel: Record<Pillar,string> = {
  NEGOCIOS:'Negócios & Crescimento', MARKETING:'Marketing & Comercial', LIDERANCA:'Liderança & Pessoas',
  FE:'Fé & Princípios', MATRIMONIO:'Matrimônio & Família', PROSPERIDADE:'Prosperidade & Desenvolvimento'
};
export const categoryLabel: Record<Category,string> = { IDENTIDADE:'Identidade', CAPACIDADE:'Capacidade', MERECIMENTO:'Merecimento' };
export const statusLabel: Record<ContentStatus,string> = {
  IDEIA:'Ideia', ROTEIRO:'Roteiro', GRAVAR:'Gravar', GRAVADO:'Gravado', EDITANDO:'Editando', APROVACAO:'Aprovação', AGENDADO:'Agendado', PUBLICADO:'Publicado'
};
export const formatLabel: Record<ContentFormat,string> = {
  REEL:'Reel', TIKTOK:'TikTok', SHORT:'Short', VIDEO_LONGO:'Vídeo longo', CARROSSEL:'Carrossel', STORIES:'Stories', FOTO:'Foto', CORTE:'Corte'
};
export const platformLabel: Record<Platform,string> = {
  INSTAGRAM:'Instagram', TIKTOK:'TikTok', YOUTUBE:'YouTube', YOUTUBE_SHORTS:'YouTube Shorts'
};
export const statusClass: Record<ContentStatus,string> = {
  IDEIA:'status status-idea', ROTEIRO:'status status-script', GRAVAR:'status status-record', GRAVADO:'status status-recorded',
  EDITANDO:'status status-edit', APROVACAO:'status status-approval', AGENDADO:'status status-scheduled', PUBLICADO:'status status-published'
};
export const enumValues = {
  authors: Object.values(Author), pillars: Object.values(Pillar), categories: Object.values(Category),
  formats: Object.values(ContentFormat), statuses: Object.values(ContentStatus), platforms: Object.values(Platform)
};
export function formatDate(date?: Date | null) {
  if (!date) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'America/Sao_Paulo'}).format(date).replace('.','').toUpperCase();
}
