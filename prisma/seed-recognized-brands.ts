/**
 * Seeds (idempotently) the RecognizedBrand allowlist from the code defaults in src/lib/brands.ts.
 * Safe to re-run any time — uses upsert on the unique `name`, so it never duplicates or touches
 * listings/users/shops. Called both standalone (`npm run db:seed-brands`) and from the main
 * prisma/seed.ts on a fresh install.
 */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_RECOGNIZED_BRANDS } from "../src/lib/brands";

export async function seedRecognizedBrands(prisma: PrismaClient) {
  for (const name of DEFAULT_RECOGNIZED_BRANDS) {
    await prisma.recognizedBrand.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`Seeded ${DEFAULT_RECOGNIZED_BRANDS.length} recognized brand(s).`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedRecognizedBrands(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
