/**
 * Ops utility: wipes all bike listings (and everything that hangs off a listing — images,
 * components, valuations, conversations/messages/offers/meetups, transactions, reviews, payment
 * records, serial-number reviews) while leaving users, bike shops, fees, and valuation rules
 * intact. Use this to take the marketplace from "full of demo listings" to "zero listings, ready
 * for real sellers" without touching accounts or shop profiles.
 *
 * Run with: npx tsx prisma/clear-listings.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const listingCount = await prisma.bikeListing.count();
  console.log(`Found ${listingCount} listing(s). Clearing all listing-derived data...`);

  await prisma.review.deleteMany({});
  await prisma.paymentRecord.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.conversation.deleteMany({}); // cascades to Message, Offer, Meetup
  await prisma.report.updateMany({ data: { listingId: null } }); // preserve any report history, just detach it
  await prisma.bikeListing.deleteMany({}); // cascades to BikeImage, BikeComponent, BikeValuation, SerialNumberReview

  // Bike shop meetup counters were derived from meetups that no longer exist — zero them out too.
  await prisma.bikeShop.updateMany({ data: { meetupCount: 0 } });

  console.log("Done. Users, bike shops, fees, and valuation rules were left untouched.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
