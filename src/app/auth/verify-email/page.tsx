import { verifyEmailAction } from "@/server/actions/auth";
import { LinkButton } from "@/components/ui/button";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { ok: false as const, error: "Missing verification token." };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      {result.ok ? (
        <>
          <h1 className="font-display text-2xl font-bold text-charcoal-900">Email verified</h1>
          <p className="mt-2 text-sm text-charcoal-500">Your email is confirmed. Verify your phone number too from your account page to unlock Verified status.</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold text-charcoal-900">Verification failed</h1>
          <p className="mt-2 text-sm text-charcoal-500">{result.error}</p>
        </>
      )}
      <LinkButton href="/account" className="mt-6">
        Go to My Account
      </LinkButton>
    </div>
  );
}
