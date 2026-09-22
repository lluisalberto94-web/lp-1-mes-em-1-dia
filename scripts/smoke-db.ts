import { PrismaClient, Author, Category, ContentFormat, ContentStatus, Pillar, Platform, PromptScope } from '@prisma/client';

const prisma = new PrismaClient();
const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`SMOKE FAILED: ${message}`);
};

async function main() {
  const initialCount = await prisma.content.count();
  assert(initialCount >= 14, `expected at least 14 seeded contents, found ${initialCount}`);
  const trainings = await prisma.trainingPrompt.findMany();
  assert(trainings.length === 5, `expected 5 training prompts, found ${trainings.length}`);
  assert(trainings.some((t) => t.scope === PromptScope.INSTAGRAM), 'Instagram training prompt missing');
  assert(trainings.some((t) => t.scope === PromptScope.MULTIPLATAFORMA), 'Multiplatform training prompt missing');

  const existingParent = await prisma.content.findFirst({
    where: { derivatives: { some: {} } },
    include: { derivatives: true },
  });
  assert(existingParent && existingParent.derivatives.length > 0, 'seeded parent/derived relationship missing');

  const marker = `SMOKE-${Date.now()}`;
  let parentId = '';
  let childId = '';
  let ideaId = '';
  let generationId = '';

  try {
    const parent = await prisma.content.create({
      data: {
        author: Author.LAURO,
        pillar: Pillar.NEGOCIOS,
        category: Category.CAPACIDADE,
        format: ContentFormat.REEL,
        status: ContentStatus.ROTEIRO,
        headline: `${marker} parent`,
        hook: 'smoke hook',
        publications: {
          create: [{ platform: Platform.INSTAGRAM, headline: `${marker} publication` }],
        },
      },
      include: { publications: true },
    });
    parentId = parent.id;
    assert(parent.publications.length === 1, 'publication creation failed');

    const child = await prisma.content.create({
      data: {
        parentId,
        author: Author.RENATA,
        pillar: Pillar.MARKETING,
        category: Category.CAPACIDADE,
        format: ContentFormat.CORTE,
        status: ContentStatus.IDEIA,
        headline: `${marker} child`,
      },
    });
    childId = child.id;

    const idea = await prisma.idea.create({
      data: {
        title: `${marker} idea`,
        author: Author.CASAL,
        pillar: Pillar.FE,
        promotedContentId: parentId,
      },
    });
    ideaId = idea.id;

    const updated = await prisma.content.update({
      where: { id: parentId },
      data: { status: ContentStatus.EDITANDO, script: 'smoke script persisted' },
    });
    assert(updated.status === ContentStatus.EDITANDO, 'status update failed');
    assert(updated.script === 'smoke script persisted', 'content edit failed');

    const searched = await prisma.content.findFirst({
      where: { headline: { contains: marker, mode: 'insensitive' } },
    });
    assert(searched, 'global-style text search failed');

    const filtered = await prisma.content.findMany({
      where: { author: Author.LAURO, status: ContentStatus.EDITANDO },
    });
    assert(filtered.some((c) => c.id === parentId), 'author/status filter failed');

    const relation = await prisma.content.findUnique({
      where: { id: parentId },
      include: { derivatives: true, promotedIdeas: true },
    });
    assert(relation?.derivatives.some((c) => c.id === childId), 'parent/derived relation failed');
    assert(relation?.promotedIdeas.some((i) => i.id === ideaId), 'idea-to-content promotion relation failed');

    const instagramTraining = await prisma.trainingPrompt.findUnique({ where: { scope: PromptScope.INSTAGRAM } });
    assert(instagramTraining, 'training lookup failed');
    const generation = await prisma.generationLog.create({
      data: {
        trainingPromptId: instagramTraining!.id,
        scope: PromptScope.INSTAGRAM,
        promptVersion: instagramTraining!.version,
        platform: 'INSTAGRAM',
        idea: marker,
      },
    });
    generationId = generation.id;
    assert(generation.promptVersion === instagramTraining!.version, 'generation prompt version not recorded');

    console.log(JSON.stringify({
      smoke: 'PASS',
      seededContents: initialCount,
      createContent: true,
      createPublication: true,
      updateStatus: true,
      editContent: true,
      createIdea: true,
      promoteIdea: true,
      filters: true,
      search: true,
      parentDerivatives: true,
      trainingPrompts: trainings.length,
      generationTrainingVersion: true,
    }));
  } finally {
    if (generationId) await prisma.generationLog.delete({ where: { id: generationId } }).catch(() => undefined);
    if (ideaId) await prisma.idea.delete({ where: { id: ideaId } }).catch(() => undefined);
    if (childId) await prisma.content.delete({ where: { id: childId } }).catch(() => undefined);
    if (parentId) await prisma.content.delete({ where: { id: parentId } }).catch(() => undefined);
  }

  const finalCount = await prisma.content.count();
  assert(finalCount === initialCount, 'smoke cleanup changed production content count');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
