import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign In" };

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Sign in to BikeFair</h1>
      <p className="mt-1 text-sm text-charcoal-500">Buy, sell, and message other riders.</p>
      <Suspense>
        <SignInForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-charcoal-500">
        New here?{" "}
        <Link href="/auth/sign-up" className="font-medium text-green-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
