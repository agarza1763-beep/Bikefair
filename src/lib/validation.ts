import { z } from "zod";
import { AGENCY_TYPES, BIKE_CATEGORIES, CONDITIONS, FRAME_MATERIALS, MEETUP_TYPES, MILEAGE_LEVELS, REPORT_TYPES, US_STATES } from "@/lib/constants";

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.enum(US_STATES, { message: "Select a state" }),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});

export const listingBasicsSchema = z.object({
  category: z.enum(BIKE_CATEGORIES),
  brand: z.string().trim().min(1, "Brand is required").max(60),
  model: z.string().trim().min(1, "Model is required").max(80),
  year: z.coerce.number().int().min(1970).max(new Date().getFullYear() + 1),
  frameSize: z.string().trim().min(1, "Frame size is required").max(30),
  color: z.string().trim().max(40).optional().or(z.literal("")),
  frameMaterial: z.enum(FRAME_MATERIALS),
});

export const listingComponentsSchema = z.object({
  groupset: z.string().trim().max(80).optional().or(z.literal("")),
  brakeType: z.string().trim().max(60).optional().or(z.literal("")),
  suspension: z.string().trim().max(60).optional().or(z.literal("")),
  wheelset: z.string().trim().max(80).optional().or(z.literal("")),
  wheelsUpgraded: z.boolean().optional(),
  wheelSize: z.string().trim().max(30).optional().or(z.literal("")),
});

export const listingConditionSchema = z.object({
  condition: z.enum(CONDITIONS),
  mileageLevel: z.enum(MILEAGE_LEVELS).optional(),
  description: z.string().trim().min(20, "Please write at least 20 characters describing the bike").max(4000),
  upgrades: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const listingSerialSchema = z.object({
  serialNumber: z.string().trim().max(60).optional().or(z.literal("")),
});

export const listingPriceSchema = z.object({
  askingPrice: z.coerce.number().min(5, "Enter an asking price"),
  originalMsrp: z.coerce.number().min(0).optional(),
});

export const listingMeetupPrefsSchema = z.object({
  city: z.string().trim().min(1, "City is required").max(80),
  state: z.enum(US_STATES),
  zip: z.string().trim().max(10).optional().or(z.literal("")),
  prefersPublicMeetup: z.boolean().optional(),
  prefersBikeShopMeetup: z.boolean().optional(),
  prefersLawEnforcement: z.boolean().optional(),
  meetupNotes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Message can't be empty").max(2000),
});

export const offerSchema = z.object({
  amount: z.coerce.number().min(1, "Enter an offer amount"),
  message: z.string().trim().max(500).optional().or(z.literal("")),
});

export const meetupSchema = z.object({
  type: z.enum(MEETUP_TYPES),
  bikeShopId: z.string().optional(),
  safeExchangeLocationId: z.string().optional(),
  locationName: z.string().trim().min(1).max(120),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(2).optional().or(z.literal("")),
  scheduledAt: z.string().optional().or(z.literal("")),
  inspectionRequested: z.boolean().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const reportSchema = z.object({
  type: z.enum(REPORT_TYPES),
  description: z.string().trim().min(10, "Please provide more detail (at least 10 characters)").max(2000),
  listingId: z.string().optional(),
  reportedUserId: z.string().optional(),
});

export const listingWizardSchema = listingBasicsSchema
  .merge(listingComponentsSchema)
  .merge(listingConditionSchema)
  .merge(listingSerialSchema)
  .merge(listingPriceSchema)
  .merge(listingMeetupPrefsSchema)
  .extend({
    images: z.array(z.string().min(1)).min(1, "Add at least one photo"),
  });
export type ListingWizardInput = z.infer<typeof listingWizardSchema>;

export const bikeShopSchema = z.object({
  name: z.string().trim().min(2, "Shop name is required").max(100),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  address: z.string().trim().min(3, "Street address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(80),
  state: z.enum(US_STATES, { message: "Select a state" }),
  zip: z.string().trim().max(10).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  offersInspection: z.boolean().optional(),
  inspectionFee: z.coerce.number().min(0).optional(),
  isVerified: z.boolean().optional(),
  hours: z.record(z.string(), z.string()).optional(),
});
export type BikeShopInput = z.infer<typeof bikeShopSchema>;

export const safeExchangeLocationSchema = z.object({
  name: z.string().trim().min(2, "Location name is required").max(100),
  agencyType: z.enum(AGENCY_TYPES),
  address: z.string().trim().min(3, "Street address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(80),
  state: z.enum(US_STATES, { message: "Select a state" }),
  zip: z.string().trim().max(10).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});
export type SafeExchangeLocationInput = z.infer<typeof safeExchangeLocationSchema>;

export const reviewSchema = z.object({
  overallRating: z.coerce.number().int().min(1).max(5),
  communicationRating: z.coerce.number().int().min(1).max(5),
  reliabilityRating: z.coerce.number().int().min(1).max(5),
  accuracyRating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});
