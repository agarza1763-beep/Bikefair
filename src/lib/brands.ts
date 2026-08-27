/**
 * Recognized-brand allowlist. This is the fallback/default list seeded into the `RecognizedBrand`
 * table (see prisma/seed-recognized-brands.ts) so admins can maintain it from
 * /admin/recognized-brands without a deploy. Any listing whose `brand` doesn't match an active
 * entry (case-insensitive, either side containing the other) gets a caution badge — see
 * `isRecognizedBrand()` below and `UnrecognizedBrandBadge` in src/components/bike.
 *
 * This is deliberately an allowlist of known, established manufacturers rather than a blocklist
 * of "bad" brands: generic drop-shipped bikes/e-bikes are sold under an endless rotation of
 * house/storefront names (Hiboy, Swagtron, Ancheer, Jasion, "Generic", etc.), so trying to
 * enumerate every disreputable name is a losing game. Defaulting unknown-brand listings to "shown
 * with a caution badge" is the safer default.
 */
export const DEFAULT_RECOGNIZED_BRANDS: string[] = [
  // Full-line / multi-category manufacturers
  "Trek", "Specialized", "Cannondale", "Giant", "Scott", "Bianchi", "Cervelo", "Cervélo",
  "Santa Cruz", "Yeti", "Salsa", "Surly", "Kona", "Pinarello", "Orbea", "Canyon", "Cube",
  "Merida", "Norco", "Rocky Mountain", "Diamondback", "GT", "Marin", "Raleigh", "Schwinn",
  "Fuji", "Jamis", "Felt", "BMC", "Colnago", "Look", "Time", "Wilier", "Argon 18", "Ridley",
  "De Rosa", "Litespeed", "Moots", "Ibis", "Pivot", "Transition", "Evil", "Commencal", "YT Industries",
  "Nukeproof", "Devinci", "Niner", "Titus", "Cinelli", "Focus", "Lapierre", "Mondraker",
  "Liv", "Electra", "Priority", "Brompton", "Tern", "Dahon", "Co-op Cycles",
  // Kids
  "Woom", "Guardian Bikes", "Islabikes", "Cleary Bikes", "Prevelo",
  // Touring / gravel specialists
  "Genesis",
  // BMX
  "Mongoose", "Haro", "Sunday", "Fit Bike Co", "Kink", "Cult", "Colony", "We The People", "Stolen", "Redline",
  // Cruiser / comfort
  "Sixthreezero", "Kent",
  // Established e-bike manufacturers (UL-certified / well-known supply chains)
  "Rad Power Bikes", "Aventon", "Ride1Up", "Lectric", "Specialized Turbo", "Trek Verve+",
  "Trek Allant+", "Riese & Müller", "Riese and Muller", "Gazelle", "Bulls", "Haibike", "Bosch",
  "Priority Current", "Brompton Electric", "Serial 1", "Charge Bikes", "Cowboy", "VanMoof",
  "Super73", "Juiced Bikes", "Ariel Rider", "QuietKat", "Pedego", "Momentum", "Yuba", "Tern GSD",
  "Specialized Turbo Vado", "Cannondale Adventure Neo", "Giant Explore E+", "Trek Domane+",
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Case-insensitive, lenient match: recognizes "Trek" against a recognized "Trek" entry, but also
 * tolerates minor variations like "Trek Bikes" vs. "Trek" in either direction.
 */
export function isRecognizedBrand(brand: string, recognizedNames: string[]): boolean {
  if (!brand.trim()) return false;
  const b = normalize(brand);
  return recognizedNames.some((name) => {
    const n = normalize(name);
    return b === n || b.includes(n) || n.includes(b);
  });
}
