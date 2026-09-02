/**
 * Email abstraction. Sends real email via Resend when EMAIL_PROVIDER=resend and RESEND_API_KEY
 * are set; otherwise falls back to logging the message to the server console — good enough for
 * local dev (verification/reset links show up in the terminal running `npm run dev`).
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (process.env.EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "BikeFair <no-reply@bikefair.demo>",
        to: message.to,
        subject: message.subject,
        text: message.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[mailer] Resend request failed (${res.status}): ${body}`);
    }
    return;
  }

  console.log(`\n----- [BikeFair dev mailer] -----\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n----------------------------------\n`);
}
