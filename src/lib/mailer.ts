/**
 * Email abstraction. No email provider is configured in this MVP, so `sendMail()` just logs the
 * message to the server console — good enough for local dev/demo (verification links show up in
 * the terminal running `npm run dev`). Configure EMAIL_PROVIDER + RESEND_API_KEY (or swap in
 * another provider) in .env and implement the branch below to send real email in production.
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (process.env.EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) {
    // TODO: wire up Resend (or another provider) here, e.g.:
    // await fetch("https://api.resend.com/emails", { method: "POST", headers: {...}, body: JSON.stringify({...}) });
  }

  console.log(`\n----- [BikeFair dev mailer] -----\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n----------------------------------\n`);
}
