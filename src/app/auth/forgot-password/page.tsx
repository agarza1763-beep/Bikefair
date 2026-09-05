import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Reset Your Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-charcoal-900">Reset your password</h1>
      <p className="mt-1 text-sm text-charcoal-500">Enter your account email and we'll send you a link to set a new password.</p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-charcoal-500">
        Remembered it?{" "}
        <Link href="/auth/sign-in" className="font-medium text-green-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
