# Meeting summary — gem-photobooth.yml (production stack)

**File:** `.aws/cloudformation/gem-photobooth.yml` (976 lines, 32 KB)
**Status:** Live in `us-east-1` as stack `gem`
**Last commit:** `0875680` (reserved concurrency removed)

## What the stack provisions

A complete photobooth backend + static frontend, all in one template.

### Storage (2 buckets)

| Bucket | Purpose | Public |
|---|---|---|
| `gem-upload-bucket-...-rodyna-v4` | Visitor photos (kiosk uploads) | Yes (wildcard `GetObject`) |
| `rodyna-v4-frontend-...-gem` | Static site bundle (`out/`) | No (CloudFront-only via OAC) |

Both have `DeletionPolicy: Retain` so they survive stack deletion.

### API backend (3 Lambdas + API Gateway HTTP API)

| Endpoint | Auth | Lambda |
|---|---|---|
| `POST /upload` | **AWS_IAM / SigV4** (kiosk only) | `UploadImageToS3` |
| `GET /images/{id}` | Public | `GetImageLambda` (issues 7-day presigned S3 URL) |
| `POST /save-email` | Public | `SaveEmailLambda` (writes to DynamoDB) |

API access logging goes to `/aws/apigateway/gem-photobooth-access` (30-day retention, configurable).

### Data layer (1 DynamoDB table)

`GEMPhotoboothEmails` (on-demand). **No TTL** — rows accumulate indefinitely. Stores `id`, `email`, `image_name`, `card_name`, `kiosk_name`, `filter_name`, `timestamp`.

### Static frontend (CloudFront)

- `FrontendOriginAccessControl` — sigv4, blocks public S3 access
- `FrontendSecurityHeadersPolicy` — X-Content-Type-Options, X-Frame-Options DENY, HSTS (1y preload), Referrer-Policy, XSS-Protection, Permissions-Policy, CSP
- `FrontendDistribution` — `PriceClass_100` (US+EU), `http2`, SPA fallback (403/404 → 200 + `index.html`)
- `FrontendBucketPolicy` — only `cloudfront.amazonaws.com` with `aws:SourceArn` locked to the distribution

### Observability (5 alarms + SNS)

All alarms fire to `gem-photobooth-alarms` SNS topic (email subscription optional via `AlarmEmail` parameter):

| Alarm | Metric | Threshold |
|---|---|---|
| `gem-photobooth-upload-lambda-errors` | Lambda Errors | > 0 in 5 min |
| `gem-photobooth-getimage-lambda-errors` | Lambda Errors | > 0 in 5 min |
| `gem-photobooth-saveemail-lambda-errors` | Lambda Errors | > 0 in 5 min |
| `gem-photobooth-api-5xx` | API Gateway 5xx | > 5 in 5 min |
| `gem-photobooth-dynamodb-throttles` | DynamoDB ThrottledRequests | > 0 in 5 min |

### Kiosk IAM (conditional)

`KioskUploadRole` is created only when `KioskTrustedAccountArns` is non-empty. Trust policy:
- Principal: any account ARN in the parameter
- ExternalId: `gem-photobooth-kiosk` (confused-deputy protection)
- Permission: `execute-api:Invoke` on `arn:aws:execute-api:...:POST/upload` only

### Parameters (12)

Defaults shown. All have working defaults — none required to be set except `KioskTrustedAccountArns` (kiosk needs it) and `AlarmEmail` (optional notifications).

| Parameter | Default | Purpose |
|---|---|---|
| `UploadLambdaName` | `UploadImageToS3` | Lambda function name |
| `GetImageLambdaName` | `GetImageLambda` | Lambda function name |
| `SaveEmailLambdaName` | `SaveEmailLambda` | Lambda function name |
| `UploadLambdaRoleName` | `UploadImageLambdaRole` | IAM role name |
| `GetImageLambdaRoleName` | `GetImageLambdaRole` | IAM role name |
| `SaveEmailLambdaRoleName` | `SaveEmailLambdaRole` | IAM role name |
| `EmailTableName` | `GEMPhotoboothEmails` | DynamoDB table name |
| `AccessLogRetentionDays` | `30` | CloudWatch log retention |
| `KioskRoleName` | `KioskUploadRole` | IAM role name |
| `KioskTrustedAccountArns` | _(empty)_ | Comma-separated account ARNs allowed to assume KioskRole |
| `AlarmEmail` | _(empty)_ | Email for alarm notifications |
| `BucketNamePrefix` | `rodyna-v4` | S3 name prefix; `<prefix>-<account>-<region>-<stack>` |

### Outputs (10)

| Output | Use |
|---|---|
| `UploadBucketName` | S3 bucket holding photos |
| `UploadAPIUrl` | `POST /upload` endpoint |
| `GetImageAPIUrl` | `GET /images/{id}` endpoint (kiosk + browser) |
| `SaveEmailAPIUrl` | `POST /save-email` endpoint (browser) |
| `ApiAccessLogGroupName` | CloudWatch log group for access logs |
| `KioskRoleArn` | IAM role ARN for the kiosk to assume |
| `AlarmTopicArn` | SNS topic for alarm notifications |
| `FrontendBucketName` | S3 bucket for the static site bundle |
| `CloudFrontDomain` | Public URL of the site |
| `CloudFrontDistributionId` | For cache invalidation |

## Current production state

- **Stack `gem`**: `CREATE_COMPLETE` in `us-east-1`
- **Live URL:** `https://d31p1uaum2yqud.cloudfront.net`
- **Backend tested:** `POST /save-email` works (200), `POST /upload` correctly returns 403 without SigV4
- **Frontend deployed:** 59 objects (HTML, JS, CSS, fonts, locales, images) in the `FrontendBucket`
- **CloudFront invalidation:** completed (cache fresh)
- **Old stack `GEM-booth-v4`:** still running, needs teardown after final sign-off

## Open questions for IT (for the meeting)

1. **How long to move existing photos from the old `GEM-booth-v4` bucket to the new bucket?**
   The old bucket has 18 visitor photos (~5.7 MB) from January 2026. The new bucket is empty. If we want to preserve them, we need an `aws s3 sync` from `gem-upload-bucket-<ACCOUNT_ID>-us-east-1-rodyna-v4` to a new prefix in `gem-upload-bucket-<ACCOUNT_ID>-us-east-1-rodyna-v4` (same bucket, different prefix). They share the same name so it's actually the same bucket. **Question: are the old photos worth preserving, or do we start fresh?**

2. **What to do with the `GEM-booth-v4` stack once `gem` is confirmed working?**
   It's still incurring cost (API Gateway, Lambdas, bucket). Tear down via `aws cloudformation delete-stack --stack-name GEM-booth-v4`. The upload bucket has `Retain` set so it will survive — need to manually empty and delete it afterward.

3. **Domain name + HTTPS — when?**
   Currently on `d31p1uaum2yqud.cloudfront.net` (the AWS-assigned domain). For a real production URL we need:
   - ACM certificate in `us-east-1` (CloudFront requires N. Virginia)
   - Route 53 hosted zone OR external DNS with a CNAME/ALIAS
   - CFN additions: `AWS::CertificateManager::Certificate`, `Aliases` block on distribution, `ViewerCertificate` block
   **Question: which domain, who owns the DNS zone, and is the certificate renewal handled?**

4. **DynamoDB table growth — is unbounded storage acceptable?**
   No TTL. At 160K writes/month with ~200 bytes/row, storage grows ~30 GB/year. At 5 years that's ~150 GB ($38/month). **Question: do we want to add a TTL back, archive old rows to S3 Glacier, or just accept the growth?**

5. **Kiosk — has anyone verified the Unity SigV4 client works end-to-end?**
   The IAM user `kiosk-uploader` is created with an access key (ID redacted — see credentials vault, not this doc) and a policy that allows `sts:AssumeRole` on `KioskUploadRole` with `ExternalId: gem-photobooth-kiosk`. The Node.js reference script in `Webapp/scripts/kiosk-upload.mjs` works. **Question: does the Unity client use the same flow, or does it do direct S3 PUT?** (I saw `GEM_UPLOAD_API_URL` in the C# env vars — needs clarification.)

6. **CloudWatch alarm email — confirmed?**
   `AlarmEmail=rodynaamr@icloud.com` is set on this deploy, but I haven't confirmed you received the AWS SNS subscription confirmation email. The alarm is silent until you click the confirmation link. **Question: did you confirm the SNS subscription?**

7. **Cost guardrails?**
   No budgets or billing alarms. At 200K users/month this is ~$119/month (per `.aws/COST.md`). **Question: do we want an AWS Budget alarm at e.g. $200/month with email notification?**

## Files of interest in the meeting

- **Template:** `.aws/cloudformation/gem-photobooth.yml`
- **Cost estimate:** `.aws/COST.md` ($119/month at 200K users)
- **Operations runbook:** `.aws/CLOUDWATCH.md` (IT training doc)
- **Webapp README:** `README.md` (env vars, deploy steps)
- **Kiosk reference script:** `Webapp/scripts/kiosk-upload.mjs`

## What's been deployed

| Item | Status | URL/ARN |
|---|---|---|
| Static site | ✅ Live | `https://d31p1uaum2yqud.cloudfront.net` |
| SaveEmail API | ✅ Working | `POST /prod/save-email` → 200 |
| Upload API (SigV4) | ✅ Working (403 without sig) | `POST /prod/upload` |
| GetImage API | ✅ Working (302 to presigned URL) | `GET /prod/images/{id}` |
| CloudWatch alarms | ✅ Created | 5 alarms → SNS topic |
| Kiosk IAM user | ✅ Created | `kiosk-uploader` |
| KioskRole | ✅ Created | `arn:aws:iam::<ACCOUNT_ID>:role/KioskUploadRole` |
| Alarm SNS subscription | ⚠️ Pending email confirmation | `rodynaamr@icloud.com` |
| Old stack teardown | ❌ Not done | `GEM-booth-v4` still running |
| Custom domain | ❌ Not done | On `*.cloudfront.net` |
