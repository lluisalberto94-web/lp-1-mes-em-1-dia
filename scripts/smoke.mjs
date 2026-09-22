import fs from 'node:fs';
const checks=['app/page.tsx','app/calendario/page.tsx','app/conteudos/page.tsx','app/ideias/page.tsx','app/gerador/page.tsx','prisma/schema.prisma','scripts/seed.ts','railway.toml'];
for(const f of checks){if(!fs.existsSync(new URL('../'+f,import.meta.url)))throw new Error('Missing '+f)}
console.log('Static smoke checks passed:',checks.length);
