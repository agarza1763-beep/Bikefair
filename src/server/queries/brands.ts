import { prisma } from "@/lib/prisma";
import { DEFAULT_RECOGNIZED_BRANDS } from "@/lib/brands";

/** Active recognized-brand names, from the DB if seeded, else the code defaults. */
export async function getRecognizedBrandNames(): Promise<string[]> {
  try {
    const rows = await prisma.recognizedBrand.findMany({ where: { isActive: true }, select: { name: true } });
    if (rows.length > 0) return rows.map((r) => r.name);
  } catch {
    // table not migrated/seeded yet — fall through to defaults
  }
  return DEFAULT_RECOGNIZED_BRANDS;
}
