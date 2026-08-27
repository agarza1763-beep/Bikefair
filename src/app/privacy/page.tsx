import { BRAND_NAME } from "@/lib/constants";

export const metadata = { title: "Privacy Policy — BikeFair" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-charcoal-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-charcoal-400">
        Placeholder legal text for demo purposes, structured for straightforward attorney review before production use.
      </p>

      <LegalSection title="1. Information we collect">
        <p>
          Account information (name, email, phone, city/state), listing details you provide (including bicycle serial numbers), messages between users, transaction and
          review records, and standard technical data (IP address, device/browser information) collected automatically.
        </p>
      </LegalSection>

      <LegalSection title="2. Bicycle serial numbers">
        <p>
          Serial numbers are collected to support a safety review workflow and are treated as sensitive, internal-only information. They are not displayed on public
          listing pages and are visible only to {BRAND_NAME} staff conducting a review, or in an aggregated status (e.g., "Verified," "Review required") shown to other
          users. We instruct sellers never to photograph a serial number in a way that becomes publicly visible.
        </p>
      </LegalSection>

      <LegalSection title="3. Messages">
        <p>Messages between buyers and sellers are visible only to the participants in that conversation and to {BRAND_NAME} staff for safety and moderation purposes.</p>
      </LegalSection>

      <LegalSection title="4. How we use information">
        <p>
          To operate the marketplace (listings, search, messaging, meetup coordination), to generate Estimated Fair Market Value figures, to maintain safety and trust
          (verification, reputation, fraud/report review), and to communicate with you about your account.
        </p>
      </LegalSection>

      <LegalSection title="5. What we don't do">
        <p>
          We do not sell your personal information. We do not publicly display your serial number, your exact address, or your private messages. We do not perform
          identity verification unless a specific, configured provider is in active use and disclosed to you at the time.
        </p>
      </LegalSection>

      <LegalSection title="6. Data retention & security">
        <p>
          We retain account and transaction data as needed to operate the platform and comply with legal obligations. Passwords are stored using industry-standard
          one-way hashing; we never store passwords in plain text.
        </p>
      </LegalSection>

      <p className="mt-10 text-xs text-charcoal-400">Last updated: placeholder date. Replace with your organization's actual privacy policy before launch.</p>
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-charcoal-900">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-charcoal-600">{children}</div>
    </section>
  );
}
