/**
 * Seed script — populates the local dev database with realistic DEMO data so the app is useful
 * to click through immediately. Every seeded user/listing/shop/transaction is flagged `isDemo:
 * true` in the database so it can never be confused with real user data (and can be bulk-deleted
 * later with a single `WHERE isDemo = true`).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_RULES } from "../src/lib/valuation/rules";
import { FEE_DEFAULTS } from "../src/lib/fees";
import { getValuationEngine } from "../src/lib/valuation/engine";
import { geocode } from "../src/lib/geo";
import { seedRecognizedBrands } from "./seed-recognized-brands";
import type { BikeCategory, Condition, FrameMaterial, MileageLevel } from "../src/lib/constants";

const prisma = new PrismaClient();

function picsum(seed: string, w = 900, h = 675) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

async function main() {
  console.log("Seeding valuation rules…");
  for (const [key, value] of Object.entries(DEFAULT_RULES)) {
    const category = key.split(".")[0].toUpperCase();
    await prisma.valuationRule.upsert({
      where: { key },
      update: {},
      create: { key, category, label: key.replace(/\./g, " "), value: value as number, valueType: key.includes("cents") ? "FLAT_ADD_CENTS" : "MULTIPLIER", isActive: true },
    });
  }

  console.log("Seeding fees…");
  for (const [type, cfg] of Object.entries(FEE_DEFAULTS)) {
    await prisma.fee.upsert({ where: { type }, update: {}, create: { type, ...cfg } });
  }

  console.log("Seeding recognized brands…");
  await seedRecognizedBrands(prisma);

  console.log("Seeding admin + demo users…");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@bikefair.demo";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const adminHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: "BikeFair Admin", email: adminEmail, passwordHash: adminHash, role: "ADMIN", city: "Austin", state: "TX", emailVerified: new Date(), phoneVerified: true, verificationLevel: "TRUSTED", isDemo: true },
  });

  const demoPassword = await bcrypt.hash("Demo1234!", 10);
  const userSeeds = [
    { name: "Sarah Nguyen", email: "sarah@bikefair.demo", city: "Austin", state: "TX", verificationLevel: "TRUSTED" },
    { name: "Marcus Webb", email: "marcus@bikefair.demo", city: "Denver", state: "CO", verificationLevel: "VERIFIED" },
    { name: "Priya Patel", email: "priya@bikefair.demo", city: "Portland", state: "OR", verificationLevel: "VERIFIED" },
    { name: "Jake Sullivan", email: "jake@bikefair.demo", city: "San Antonio", state: "TX", verificationLevel: "BASIC" },
    { name: "Elena Torres", email: "elena@bikefair.demo", city: "Seattle", state: "WA", verificationLevel: "TRUSTED" },
    { name: "Chris Bauman", email: "chris@bikefair.demo", city: "Minneapolis", state: "MN", verificationLevel: "BASIC" },
    { name: "Dana Kim", email: "dana@bikefair.demo", city: "San Diego", state: "CA", verificationLevel: "VERIFIED" },
  ] as const;

  const users = [];
  for (const u of userSeeds) {
    const point = await geocode(u.city, u.state);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash: demoPassword,
        city: u.city,
        state: u.state,
        lat: point.lat,
        lng: point.lng,
        emailVerified: new Date(),
        phoneVerified: u.verificationLevel !== "BASIC",
        verificationLevel: u.verificationLevel,
        isTrustedSeller: u.verificationLevel === "TRUSTED",
        isDemo: true,
      },
    });
    if (u.verificationLevel !== "BASIC") {
      await prisma.verification.createMany({
        data: [
          { userId: user.id, type: "EMAIL", status: "VERIFIED", verifiedAt: new Date(), provider: "stub" },
          { userId: user.id, type: "PHONE", status: "VERIFIED", verifiedAt: new Date(), provider: "stub-demo" },
        ],
      });
    }
    users.push(user);
  }
  const [sarah, marcus, priya, jake, elena, chris, dana] = users;

  console.log("Seeding bike shops…");
  const shopSeeds = [
    { name: "Mellow Johnny's Bike Shop", city: "Austin", state: "TX", offersInspection: true, isVerified: true },
    { name: "Wheat Ridge Cyclery", city: "Denver", state: "CO", offersInspection: true, isVerified: true },
    { name: "River City Bicycles", city: "Portland", state: "OR", offersInspection: false, isVerified: true },
    { name: "Downtown Spokes Co-op", city: "Minneapolis", state: "MN", offersInspection: false, isVerified: false },
  ];
  const shops = [];
  for (const s of shopSeeds) {
    const point = await geocode(s.city, s.state);
    const shop = await prisma.bikeShop.create({
      data: {
        name: s.name,
        address: "123 Main St",
        city: s.city,
        state: s.state,
        zip: "00000",
        lat: point.lat,
        lng: point.lng,
        phone: "(555) 010-0100",
        website: undefined,
        offersInspection: s.offersInspection,
        inspectionFeeCents: s.offersInspection ? 4500 : null,
        isVerified: s.isVerified,
        isDemo: true,
        meetupCount: Math.floor(Math.random() * 20),
        hoursJson: JSON.stringify({ Mon: "10am–7pm", Tue: "10am–7pm", Wed: "10am–7pm", Thu: "10am–7pm", Fri: "10am–7pm", Sat: "10am–6pm", Sun: "Closed" }),
        description: "A designated BikeFair meetup location. See our Safety Center for what that does and doesn't mean.",
      },
    });
    shops.push(shop);
  }

  console.log("Seeding listings…");
  const engine = getValuationEngine();

  interface ListingSeed {
    seller: (typeof users)[number];
    category: BikeCategory;
    brand: string;
    model: string;
    year: number;
    frameSize: string;
    color: string;
    frameMaterial: FrameMaterial;
    groupset?: string;
    wheelset?: string;
    wheelsUpgraded?: boolean;
    condition: Condition;
    mileageLevel?: MileageLevel;
    description: string;
    upgrades?: string;
    originalMsrp?: number;
    askingPrice: number;
    city: string;
    state: string;
    serialNumber?: string;
    imageSeed: string;
    isFeatured?: boolean;
  }

  const listingSeeds: ListingSeed[] = [
    {
      seller: sarah,
      category: "GRAVEL",
      brand: "Trek",
      model: "Checkpoint SL 5",
      year: 2023,
      frameSize: "56cm",
      color: "Matte Black",
      frameMaterial: "CARBON",
      groupset: "Shimano GRX",
      wheelset: "Bontrager Aeolus",
      wheelsUpgraded: false,
      condition: "EXCELLENT",
      mileageLevel: "UNDER_1000",
      description: "Lightly ridden gravel bike, always garage-kept. Great for long weekend rides and light bikepacking. No accidents, no crashes.",
      originalMsrp: 320000,
      askingPrice: 205000,
      city: "Austin",
      state: "TX",
      serialNumber: "WTU192837465",
      imageSeed: "gravel-trek-1",
      isFeatured: true,
    },
    {
      seller: marcus,
      category: "MOUNTAIN",
      brand: "Santa Cruz",
      model: "Hightower",
      year: 2021,
      frameSize: "M/L",
      color: "Blue",
      frameMaterial: "CARBON",
      groupset: "SRAM GX Eagle",
      wheelset: "Upgraded carbon wheelset",
      wheelsUpgraded: true,
      condition: "GOOD",
      mileageLevel: "UNDER_5000",
      description: "Trail-ready full suspension MTB. Fresh brake pads and tires. Some cosmetic scratches on the down tube from normal trail use.",
      originalMsrp: 550000,
      askingPrice: 285000,
      city: "Denver",
      state: "CO",
      serialNumber: "SC20211099821",
      imageSeed: "mtb-santacruz-1",
      isFeatured: true,
    },
    {
      seller: priya,
      category: "ROAD",
      brand: "Cannondale",
      model: "CAAD13",
      year: 2020,
      frameSize: "54cm",
      color: "Red",
      frameMaterial: "ALUMINUM",
      groupset: "Shimano 105",
      condition: "GOOD",
      mileageLevel: "OVER_5000",
      description: "Great all-around road bike, well-maintained with regular tune-ups at River City Bicycles. Selling because I upgraded to a gravel bike.",
      originalMsrp: 180000,
      askingPrice: 95000,
      city: "Portland",
      state: "OR",
      imageSeed: "road-cannondale-1",
    },
    {
      seller: jake,
      category: "EBIKE",
      brand: "Specialized",
      model: "Turbo Vado 4.0",
      year: 2022,
      frameSize: "L",
      color: "Black",
      frameMaterial: "ALUMINUM",
      condition: "EXCELLENT",
      mileageLevel: "UNDER_1000",
      description: "Commuter e-bike, barely used since I started working from home. Includes rear rack and fenders.",
      originalMsrp: 300000,
      askingPrice: 210000,
      city: "San Antonio",
      state: "TX",
      imageSeed: "ebike-specialized-1",
      isFeatured: true,
    },
    {
      seller: elena,
      category: "COMMUTER",
      brand: "Trek",
      model: "FX 3 Disc",
      year: 2021,
      frameSize: "M",
      color: "Grey",
      frameMaterial: "ALUMINUM",
      condition: "GOOD",
      mileageLevel: "UNDER_5000",
      description: "Reliable daily commuter, hydraulic disc brakes, fits fenders and a rack. Some wear on the saddle.",
      askingPrice: 45000,
      city: "Seattle",
      state: "WA",
      imageSeed: "commuter-trek-1",
    },
    {
      seller: chris,
      category: "BMX",
      brand: "Mongoose",
      model: "Legion L60",
      year: 2019,
      frameSize: "One size",
      color: "Black/Gold",
      frameMaterial: "CHROMOLY",
      condition: "FAIR",
      mileageLevel: "OVER_5000",
      description: "Well-loved park bike. Pegs included. Needs new brake cable.",
      askingPrice: 22000,
      city: "Minneapolis",
      state: "MN",
      imageSeed: "bmx-mongoose-1",
    },
    {
      seller: dana,
      category: "TRIATHLON",
      brand: "Cervélo",
      model: "P-Series",
      year: 2022,
      frameSize: "54cm",
      color: "White/Blue",
      frameMaterial: "CARBON",
      groupset: "Shimano Ultegra Di2",
      wheelset: "Zipp 404",
      wheelsUpgraded: true,
      condition: "EXCELLENT",
      mileageLevel: "UNDER_1000",
      description: "Race-ready TT bike, Di2 shifting, aero cockpit. Only raced twice.",
      originalMsrp: 650000,
      askingPrice: 420000,
      city: "San Diego",
      state: "CA",
      imageSeed: "tri-cervelo-1",
      isFeatured: true,
    },
    {
      seller: sarah,
      category: "KIDS",
      brand: "Woom",
      model: "Woom 4",
      year: 2022,
      frameSize: "20in",
      color: "Green",
      frameMaterial: "ALUMINUM",
      condition: "GOOD",
      mileageLevel: "UNDER_1000",
      description: "Outgrown by our kiddo — great first \"real\" bike, lightweight frame, hand brakes.",
      askingPrice: 25000,
      city: "Austin",
      state: "TX",
      imageSeed: "kids-woom-1",
    },
    {
      seller: marcus,
      category: "FOLDING",
      brand: "Brompton",
      model: "C Line",
      year: 2021,
      frameSize: "One size",
      color: "Black",
      frameMaterial: "STEEL",
      condition: "EXCELLENT",
      mileageLevel: "UNDER_500",
      description: "Perfect for train commutes and small apartments. Folds in seconds. Barely used.",
      originalMsrp: 170000,
      askingPrice: 155000,
      city: "Denver",
      state: "CO",
      imageSeed: "folding-brompton-1",
    },
    {
      seller: priya,
      category: "TOURING",
      brand: "Surly",
      model: "Long Haul Trucker",
      year: 2018,
      frameSize: "58cm",
      color: "Olive",
      frameMaterial: "CHROMOLY",
      condition: "GOOD",
      mileageLevel: "OVER_5000",
      description: "Rode this across three states. Sturdy, comfortable, tons of braze-ons for racks and bags.",
      askingPrice: 68000,
      city: "Portland",
      state: "OR",
      imageSeed: "touring-surly-1",
    },
    {
      seller: elena,
      category: "CRUISER",
      brand: "Schwinn",
      model: "Huron",
      year: 2020,
      frameSize: "M",
      color: "Cream",
      frameMaterial: "STEEL",
      condition: "FAIR",
      mileageLevel: "UNDER_5000",
      description: "Classic beach cruiser, comfortable upright ride. Some rust on the chain (easy fix).",
      askingPrice: 12000,
      city: "Seattle",
      state: "WA",
      imageSeed: "cruiser-schwinn-1",
    },
    {
      seller: dana,
      category: "HYBRID",
      brand: "Giant",
      model: "Escape 3",
      year: 2021,
      frameSize: "M",
      color: "Blue",
      frameMaterial: "ALUMINUM",
      condition: "GOOD",
      mileageLevel: "UNDER_1000",
      description: "Great starter hybrid for fitness rides and light commuting. Recently tuned up.",
      askingPrice: 32000,
      city: "San Diego",
      state: "CA",
      imageSeed: "hybrid-giant-1",
    },
  ];

  const createdListings = [];
  for (const seed of listingSeeds) {
    const point = await geocode(seed.city, seed.state);
    const askingPriceCents = seed.askingPrice;
    const valuationResult = await engine.estimate({
      category: seed.category,
      brand: seed.brand,
      model: seed.model,
      year: seed.year,
      frameMaterial: seed.frameMaterial,
      groupset: seed.groupset,
      wheelset: seed.wheelset,
      wheelsUpgraded: seed.wheelsUpgraded,
      condition: seed.condition,
      mileageLevel: seed.mileageLevel,
      originalMsrpCents: seed.originalMsrp ?? null,
      state: seed.state,
      askingPriceCents,
    });

    const listing = await prisma.bikeListing.create({
      data: {
        sellerId: seed.seller.id,
        title: `${seed.year} ${seed.brand} ${seed.model}`,
        category: seed.category,
        brand: seed.brand,
        model: seed.model,
        year: seed.year,
        frameSize: seed.frameSize,
        color: seed.color,
        frameMaterial: seed.frameMaterial,
        groupset: seed.groupset,
        wheelset: seed.wheelset,
        wheelsUpgraded: !!seed.wheelsUpgraded,
        mileageLevel: seed.mileageLevel,
        condition: seed.condition,
        description: seed.description,
        upgrades: seed.upgrades,
        originalMsrp: seed.originalMsrp,
        serialNumber: seed.serialNumber,
        serialStatus: seed.serialNumber ? "VERIFIED" : "NOT_SUBMITTED",
        askingPrice: askingPriceCents,
        status: "ACTIVE",
        city: seed.city,
        state: seed.state,
        lat: point.lat,
        lng: point.lng,
        isFeatured: !!seed.isFeatured,
        isDemo: true,
        publishedAt: new Date(),
        images: {
          create: [0, 1, 2].map((i) => ({ url: picsum(`${seed.imageSeed}-${i}`), position: i })),
        },
      },
    });

    if (seed.serialNumber) {
      await prisma.serialNumberReview.create({ data: { listingId: listing.id, status: "VERIFIED", reviewedAt: new Date() } });
    }

    await prisma.bikeValuation.create({
      data: {
        listingId: listing.id,
        estimatedLow: valuationResult.estimatedLowCents,
        estimatedMid: valuationResult.estimatedMidCents,
        estimatedHigh: valuationResult.estimatedHighCents,
        askingPriceSnapshot: valuationResult.askingPriceCents,
        pricePositionPct: valuationResult.pricePositionPct,
        pricePositionLabel: valuationResult.pricePositionLabel,
        breakdown: JSON.stringify(valuationResult.breakdown),
        engineVersion: valuationResult.engineVersion,
      },
    });

    createdListings.push(listing);
  }

  console.log("Seeding a completed transaction + review pair…");
  const soldListing = createdListings[2]; // Priya's CAAD13
  await prisma.bikeListing.update({ where: { id: soldListing.id }, data: { status: "SOLD", soldAt: new Date() } });
  const convo = await prisma.conversation.create({
    data: { listingId: soldListing.id, buyerId: chris.id, sellerId: priya.id },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: convo.id, senderId: chris.id, body: "Is this still available?" },
      { conversationId: convo.id, senderId: priya.id, body: "Yes! Happy to meet this weekend." },
      { conversationId: convo.id, senderId: chris.id, body: "Great, let's meet at River City Bicycles." },
    ],
  });
  const transaction = await prisma.transaction.create({
    data: {
      listingId: soldListing.id,
      buyerId: chris.id,
      sellerId: priya.id,
      agreedPrice: 92000,
      status: "COMPLETED",
      buyerConfirmedAt: new Date(),
      sellerConfirmedAt: new Date(),
      sellerClosingFeeCents: 2760,
      isDemo: true,
    },
  });
  await prisma.paymentRecord.create({ data: { userId: priya.id, transactionId: transaction.id, feeType: "SELLER_CLOSING", amountCents: 2760, status: "SUCCEEDED" } });
  await prisma.review.create({
    data: {
      transactionId: transaction.id,
      reviewerId: chris.id,
      revieweeId: priya.id,
      overallRating: 5,
      communicationRating: 5,
      reliabilityRating: 5,
      accuracyRating: 4,
      comment: "Bike was exactly as described. Smooth transaction, would buy from Priya again!",
    },
  });

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("Demo user login: sarah@bikefair.demo / Demo1234! (all demo users share this password)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
