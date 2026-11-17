# Security alerts

Bitaqati sends server-side security notifications to a private Telegram chat.
Messages contain event categories, a country code or a short list of changed
file paths where relevant. They never contain passwords, access tokens,
cookies, raw IP addresses, request bodies, stack traces, customer details, or
payment credentials.

## One-time Telegram setup

1. In Telegram, create a bot with the official `@BotFather` and copy its bot
   token. Start a private conversation with the bot and send `/start`.
2. Obtain your numeric Telegram chat ID using a trusted Telegram ID helper.
   Do not share the bot token in chat, issues, or source files.
3. In Vercel → Project → Settings → Environment Variables, add these variables
   for **Production only**:
   - `TELEGRAM_BOT_TOKEN`: the bot token
   - `TELEGRAM_CHAT_ID`: the private chat ID
   - `SECURITY_ALERTS_WEBHOOK_SECRET`: a newly generated random secret
4. In GitHub → repository Settings → Secrets and variables → Actions, add a
   repository secret named `SECURITY_ALERTS_WEBHOOK_SECRET` with the exact
   same random value. Never add it as a normal Actions variable.
5. Redeploy the current `main` commit to Production after setting the Vercel
   variables. Do not put these values in `.env.example`, commits, or issue
   comments.

## Test delivery

After the Production deployment is ready and the variables are configured:

- Sign in to the admin account and complete the existing MFA challenge.
- Open `https://www.bitaqati.online/api/admin/security-alerts/test` in the
  same authenticated browser. It must return `ok: true` and send one test
  Telegram message.
- Alternatively, open GitHub Actions → **Security activity notifications**
  → **Run workflow** on `main`. This runs a test event through the protected
  production webhook.

## Signals and throttles

- Admin sign-in: a new country or a different browser/OS/device class is
  compared only after the existing MFA succeeds. The first successful
  sign-in establishes the baseline without an alarm.
- Login abuse: uses the existing five-attempt account/IP lockout; at most one
  notification is sent per 15 minutes.
- Admin account creation: alerts when the designated `ADMIN_EMAIL` account
  is newly registered through the site's sign-up endpoint.
- Website source changes: a push to `main` that changes tracked app, library,
  public, migration, or deployment configuration files is reported. The alert
  lists paths only, not file contents.
- Error surge: ten generic error-boundary reports in five minutes; at most one
  alert per 15 minutes.
- Order surge: six platform orders in ten minutes; at most one alert per
  30 minutes. This is order-volume monitoring only. The project currently
  does not show an online payment gateway, so it cannot verify card payments
  or payment processor fraud.

The database stores only throttling counters, the admin's last country code,
and a SHA-256 hash of a random browser-profile identifier. The raw device cookie
is HttpOnly and is never written to the database or included in a notification.
The alert labels the browser/OS/device class for context; it does not claim to
identify a physical hardware serial number. Repeated notices are aggregated
and reported as a suppressed count.
