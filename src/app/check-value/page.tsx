import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { CheckValueForm } from "./check-value-form";

export const metadata = {
  title: "Check Your Bike's Value",
  description: "Get a free estimated fair market value for your used bicycle in seconds — no listing required.",
};

export default function CheckValuePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-extrabold text-charcoal-900">What's Your Bike Worth?</h1>
        <p className="mt-3 text-charcoal-600">
          Get an estimated fair market value in seconds — no account, no listing, no commitment. Just enter a few details about the bike.
        </p>
        <p className="mt-2 text-sm text-charcoal-500">
          Curious how the estimate works? See the{" "}
          <Link href="/value-guide" className="font-medium text-green-700 underline">
            Fair Value Guide
          </Link>
          .
        </p>
      </div>

      <div className="mt-10">
        <CheckValueForm />
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-charcoal-500">Ready to actually sell it?</p>
        <LinkButton href="/sell/create" variant="accent" size="lg" className="mt-3">
          List Your Bike on BikeFair
        </LinkButton>
      </div>
    </div>
  );
}
