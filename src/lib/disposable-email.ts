/**
 * Blocklist of common disposable/temp-mail domains. Not exhaustive — new ones appear constantly —
 * but catches the vast majority of casual throwaway-email spam sign-ups with zero false positives
 * for real users, since nobody's actual address lives on one of these.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.biz",
  "guerrillamail.de",
  "sharklasers.com",
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmail.net",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.net",
  "getnada.com",
  "trashmail.com",
  "fakeinbox.com",
  "dispostable.com",
  "maildrop.cc",
  "mintemail.com",
  "mailnesia.com",
  "mailcatch.com",
  "spamgourmet.com",
  "moakt.com",
  "emailondeck.com",
  "discard.email",
  "mytemp.email",
  "tempinbox.com",
  "burnermail.io",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  return !!domain && DISPOSABLE_DOMAINS.has(domain);
}
