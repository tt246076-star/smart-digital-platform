# Bitaqati off-site backup and restore

This runbook describes the GitHub Actions workflows:

- `.github/workflows/daily-backup.yml`: daily database, Storage-object, and Git-history backup; encrypts the archive with age before upload to a private Cloudflare R2 bucket.
- `.github/workflows/restore-drill.yml`: manual restore rehearsal into a separate, empty Supabase test project. It refuses the live project reference.

No database password, Storage key, R2 secret, or age private identity belongs in this repository.

## 1. Create the off-site destination

1. In Cloudflare R2, create a **private** bucket, for example `bitaqati-backups`. Do not enable public access or a public custom domain.
2. Create an R2 API token restricted to this bucket with Object Read and Object Write permissions. Do not use an account-wide administrator token.
3. In the bucket's **Settings → Object Lifecycle Rules**, create a rule for the `daily/` prefix that deletes objects after **30 days**. This is the retention policy; confirm it is active in the dashboard.

R2's Standard tier currently includes 10 GB-month storage and has no egress charge. Usage beyond the free allowance is billed separately. See [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

## 2. Create the encryption identity

On a trusted computer, install age and run:

```sh
age-keygen -o bitaqati-age-identity.txt
```

The output contains a public recipient beginning with `age1...` and a private identity beginning with `AGE-SECRET-KEY-1...`.

- Keep the **private identity** in an offline password manager or encrypted removable backup. Never commit it.
- Add only the **public recipient** as the GitHub repository secret `AGE_RECIPIENT`.
- For the manual restore drill, the private identity is needed in the protected GitHub Environment secret `AGE_IDENTITY`. Enable required reviewers for the `backup-restore-test` environment where your GitHub plan supports it. Otherwise decrypt and restore manually on a trusted computer instead of storing the private identity in GitHub.

The archive is encrypted locally on the GitHub runner before it is uploaded to R2. R2 stores only the encrypted `.tar.gz.age` file and its checksum.

## 3. Enable Supabase Storage S3 access

In the live Supabase dashboard:

1. Open **Storage → Configuration → S3** and enable the S3 protocol.
2. Generate an Access Key ID and Secret Access Key. Copy them when shown.
3. The source endpoint used by the workflow is `https://esetgqfftbgoavyihfiv.storage.supabase.co/storage/v1/s3`, region `eu-central-1`.

Supabase documents that S3 access keys can perform operations across all Storage buckets and bypass Storage RLS. Use them only as GitHub Actions secrets, rotate them if exposed, and never place them in browser code.

## 4. Add GitHub repository secrets

In the private GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value |
|---|---|
| `SUPABASE_DB_URL` | The live project's PostgreSQL **Session pooler** connection string from Supabase → Connect. Include the database password and SSL mode. Percent-encode special characters in the password. |
| `SUPABASE_S3_ACCESS_KEY_ID` | Source Supabase Storage S3 Access Key ID |
| `SUPABASE_S3_SECRET_ACCESS_KEY` | Source Supabase Storage S3 Secret Access Key |
| `AGE_RECIPIENT` | The public `age1...` recipient |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_BUCKET` | Private R2 bucket name, e.g. `bitaqati-backups` |
| `R2_ACCESS_KEY_ID` | Bucket-scoped R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Bucket-scoped R2 Secret Access Key |

Do not paste any of these values into chat, issues, or source code.

## 5. Run and monitor the daily backup

1. Open GitHub **Actions → Daily encrypted off-site backup**.
2. Select **Run workflow** on `main` once to create the first backup.
3. Confirm the run succeeds and its summary says the encrypted archive was uploaded and the downloaded copy passed a byte-for-byte SHA-256 check.
4. The scheduled run is **04:00 UTC daily** (05:00 in Algeria, UTC+1). GitHub scheduled jobs can occasionally start late, so review failed or delayed runs in Actions.

Each backup includes:
- Supabase roles, schema, application data, and migration history exported with the Supabase CLI;
- a separate inventory of Storage bucket settings and a download of every S3 bucket, including empty buckets;
- the full Git repository history as a Git bundle;
- a manifest, storage file hashes, and an encrypted archive.

The source database URL is used only during the run. Plaintext files are kept in the temporary GitHub runner workspace and removed when the job ends.

## 6. Restore rehearsal on a separate project

Do not use the live project as the restore destination.

Create a **new, empty Supabase project** for testing in the same PostgreSQL major version (17) and preferably the same region (`eu-central-1`). Enable Storage S3 on that test project and generate test-only S3 credentials. Never reuse the live project's service-role key or S3 keys.

Create a GitHub Environment named `backup-restore-test` and add these **environment secrets**:

| Secret | Value |
|---|---|
| `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | The same private R2 destination values |
| `AGE_IDENTITY` | The complete private age identity, including its `AGE-SECRET-KEY-1...` line |
| `SUPABASE_TEST_PROJECT_REF` | The new test project's reference; must not be `esetgqfftbgoavyihfiv` |
| `SUPABASE_TEST_URL` | `https://<test-project-ref>.supabase.co` |
| `SUPABASE_TEST_DB_URL` | The test project's Session pooler connection string |
| `SUPABASE_TEST_SERVICE_ROLE_KEY` | The test project's service-role key, used only to create missing test buckets |
| `SUPABASE_TEST_S3_ACCESS_KEY_ID`, `SUPABASE_TEST_S3_SECRET_ACCESS_KEY` | The test project's Storage S3 credentials |
| `SUPABASE_TEST_S3_REGION` | The test project's region |

Then:

1. Open **Actions → Manual backup restore drill (test project only)**.
2. Choose **Run workflow**. Leave `backup_key` empty to use the newest backup, or provide a specific key from the R2 `daily/` prefix.
3. The workflow downloads and decrypts the archive, verifies the Git bundle, restores the database into the test project's connection string, creates missing Storage buckets, and uploads the backed-up objects through the test project's S3 endpoint.
4. It checks that the Auth user count and Storage object counts match the backup manifest. The workflow has an explicit guard against the production project reference and refuses a non-empty target.
5. Review the test project's Database and Storage dashboards. Keep the test project until you have finished inspecting it; delete it only when you no longer need it.

This rehearsal has **not** been run yet: it requires the R2/Supabase secrets above and a separate test project. The workflow is deliberately manual and never targets Production.

## 7. Manual restore procedure

For a manual recovery, use a new Supabase project first:

1. Download the selected `.tar.gz.age` object from the private R2 bucket.
2. Decrypt it locally using the private age identity:

   ```sh
   age --decrypt --identity bitaqati-age-identity.txt \
     --output bitaqati-backup.tar.gz bitaqati-backup.tar.gz.age
   tar -xzf bitaqati-backup.tar.gz
   ```

3. Create a new Supabase project with PostgreSQL 17, then copy its Session pooler connection string into `NEW_DB_URL`.
4. Restore the SQL files into that new database:

   ```sh
   psql "$NEW_DB_URL" \
     --single-transaction \
     --variable ON_ERROR_STOP=1 \
     --file roles.sql \
     --file schema.sql \
     --command 'SET session_replication_role = replica' \
     --file data.sql
   ```

5. If preserving CLI migration history, restore `history_schema.sql` and `history_data.sql` in a separate transaction.
6. Enable S3 on the new Supabase project, generate **new** Storage S3 keys, and create any buckets that are not already present using the saved `storage-buckets.json` settings.
7. Upload each local bucket folder to the matching bucket on the new project's S3 endpoint. Do not use the live project's endpoint:

   ```sh
   aws --endpoint-url "$NEW_SUPABASE_S3_ENDPOINT" --region "$NEW_SUPABASE_S3_REGION" \
     s3 sync "./storage/landing-logos/" "s3://landing-logos/" --no-progress
   ```

   Repeat for `landing-logos-staging` and `store-products` (and any additional buckets listed in the manifest).

8. Verify Auth users, key application tables, Storage bucket visibility, object counts, and that public/private bucket access behaves as expected. Also compare the saved `storage.sha256` inventory with the downloaded files.
9. Reconfigure settings that are not database contents: Supabase Auth redirect URLs, SMTP/OAuth providers, newly generated API/JWT keys, Vercel environment variables, cron credentials, and any external integrations. Existing JWT sessions from the old project will not be valid in a new project; users may need to sign in again.
10. Only after the new project and a separate test deployment work, plan a controlled Production cutover. Never point the live site at an unverified restored database.

## 8. Firewall recommendation

The Vercel project currently has no custom Firewall configuration. Prefer **Vercel Firewall** rather than placing Cloudflare as a reverse proxy in front of Vercel: this keeps Vercel's client-IP signal consistent with the application's existing IP-based rate limits.

Recommended staged configuration:

- Enable the Bot Protection Managed Ruleset in **Log** mode for 24–48 hours, inspect false positives, then change to **Challenge** for clearly unwanted browser-like automation. Keep API calls under observation; a browser challenge can break programmatic clients.
- Add one rate-limit rule for `/api/auth/` (login, signup, forgot-password, reset-password, password) at about **10 requests per 10 seconds per IP** as a burst limiter. The application already has a stricter 5-attempt/15-minute IP-and-account limit for sign-in/recovery.
- Keep the existing `/api/orders` application limit (2 orders per 10 minutes per IP); do not add a conflicting rule until logs show a need.
- Do not rate-limit the `GET /login` page itself; protect the authentication POST API routes.
- Start in Log mode before denying or challenging legitimate traffic. Vercel rate-limit rule quotas depend on plan; Hobby currently has one rate-limit rule per project.

No firewall rules or DNS changes are applied by this runbook. See [Vercel Bot Protection](https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets), [Vercel rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), and [Vercel custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules).
