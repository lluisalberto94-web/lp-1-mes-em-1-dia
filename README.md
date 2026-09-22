# Freire Content OS

MVP funcional para organizar, gerar e acompanhar a produção de conteúdo de Lauro Freire, Renata Freire e Freire Educação.

## Stack
- Next.js 15 / App Router / TypeScript
- React 19
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Railway

## Funcionalidades da V1
- Dashboard executivo com volume por estágio, pilar e autor
- Calendário em 7, 14 e 30 dias com mudança rápida de status
- Biblioteca de conteúdos com busca e filtros
- Conteúdo-mãe e derivados
- Separação entre conteúdo e publicação por plataforma
- Edição de headline, gancho, roteiro, legenda, CTA, notas de edição e SEO
- Banco de ideias e promoção de ideia para conteúdo
- Gerador estruturado de conteúdo com fallback local
- Ponto de integração de IA via `AI_WEBHOOK_URL`
- Seed idempotente de 14 dias
- Smoke test de persistência/CRUD no pipeline de deploy

## Local
```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run smoke:db
npm run dev
```

## Railway
1. Provisione PostgreSQL.
2. Configure `DATABASE_URL` no serviço web.
3. Opcional: configure `AI_WEBHOOK_URL`.
4. Build: `npm run build`.
5. Pre-deploy: `npm run db:push && npm run db:seed && npm run smoke:db`.
6. Start: `npm run start`.
7. Healthcheck: `/`.

## Variáveis
- `DATABASE_URL` obrigatória
- `NODE_ENV=production` em produção
- `AI_WEBHOOK_URL` opcional; deve aceitar JSON do gerador e devolver JSON compatível com o resultado exibido pela aplicação

## Teste de banco
`npm run smoke:db` valida seed, criação de conteúdo e publicação, alteração de status, edição, criação/promoção de ideia, busca, filtros e relação conteúdo-mãe/derivado. Os dados de teste são removidos ao final.

## Princípio
1 ideia → vários ativos. Fundadores como mídia. Empresa como plataforma.
