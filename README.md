# Grand Egyptian Museum Photobooth

Next.js web app + AWS backend for the Grand Egyptian Museum photobooth.
Visitors see their photo and a custom card, can share it, and their email
is captured for follow-up marketing.

## Repository layout

```
.
├── Webapp/                              # Next.js 14 app (App Router, TypeScript, Tailwind v4)
│   ├── src/                             # UI source
│   │   ├── app/                         # Pages, hooks, components, utils
│   │   └── lib/                         # i18n setup
│   ├── scripts/kiosk-upload.mjs         # Reference SigV4 signing script for the kiosk device
│   ├── scripts/package.json             # Standalone deps for the kiosk (not part of the Next.js build)
│   ├── .env.local.example               # Template for the env file (copy → .env.local)
│   └── public/                          # Static assets (fonts, backgrounds, logos)
├── .aws/cloudformation/
│   └── gem-photobooth.yml               # Backend stack: S3, Lambdas, API Gateway, DynamoDB, alarms
├── .github/workflows/
│   ├── ci.yml                           # Type-check, lint, test, build on every push
│   └── deploy.yml                       # Deploy to Vercel on push to main
└── README.md
```

## Quick start (web app)

```bash
cd Webapp
npm install
cp .env.local.example .env.local        # then fill in NEXT_PUBLIC_* URLs
npm run dev                              # http://localhost:3000
```

### Required environment variables (`Webapp/.env.local`)

| Variable | Required | Example | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_AWS_API_BASE_URL` | ✅ | `https://abc.execute-api.us-east-1.amazonaws.com/prod/images` | `GetImage` endpoint base (no trailing slash) |
| `NEXT_PUBLIC_AWS_REGION` | ❌ | `us-east-1` | Used by `next.config.js` for CSP and `images.remotePatterns`. Auto-derived from the API URL if unset, falls back to `us-east-1`. |
| `NEXT_PUBLIC_CARD_TEMPLATE_URL` | ✅ | `https://res.cloudinary.com/.../template.png` | PNG template for the back of the card |
| `NEXT_PUBLIC_SAVE_EMAIL_URL` | ✅ | `https://abc.execute-api.us-east-1.amazonaws.com/prod/save-email` | `SaveEmail` endpoint |

### Quality gates

```bash
cd Webapp
npm run type-check    # tsc --noEmit
npm run lint          # next lint
npm test              # jest (209 tests, 11 suites)
npm run build         # next build
```

All four run in CI on every push and PR (`.github/workflows/ci.yml`).

## Backend deployment (CloudFormation)

```bash
aws cloudformation deploy \
  --stack-name gem-photobooth \
  --template-file .aws/cloudformation/gem-photobooth.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --tags Project=gem-photobooth Environment=prod \
  --parameter-overrides \
      KioskTrustedAccountArns=arn:aws:iam::123456789012:root \
      AlarmEmail=ops@example.com
```

### Stack parameters

| Parameter | Default | Notes |
|---|---|---|
| `BucketNamePrefix` | `rodyna-v4` | Prefix for the S3 bucket name; account/region/stack suffix is appended for uniqueness |
| `EmailRetentionDays` | `90` | DynamoDB TTL for the email table |
| `AccessLogRetentionDays` | `30` | CloudWatch retention for API access logs |
| `LambdaReservedConcurrency` | `5` | Per-Lambda concurrency cap (protects account-wide limit) |
| `AlarmEmail` | `""` | Email that receives alarm notifications. Empty = no subscription, alarms still trigger in console |
| `KioskRoleName` | `KioskUploadRole` | IAM role the kiosk assumes |
| `KioskTrustedAccountArns` | `""` | Comma-separated account ARNs allowed to assume the role. **Must be set** for the role to be created |

### Stack outputs

| Output | Description |
|---|---|
| `UploadBucketName` | S3 bucket holding visitor photos (retained on stack delete) |
| `UploadAPIUrl` | Authenticated upload endpoint (requires SigV4) |
| `GetImageAPIUrl` | Public read endpoint (302 → 7-day presigned S3 URL) |
| `SaveEmailAPIUrl` | Public endpoint for capturing visitor emails |
| `ApiAccessLogGroupName` | CloudWatch log group with API access logs |
| `AlarmTopicArn` | SNS topic that receives CloudWatch alarm notifications |
| `KioskRoleArn` | ARN of the role the kiosk assumes (empty if `KioskTrustedAccountArns` is empty) |
| `FrontendBucketName` | S3 bucket for the exported static site (private, CloudFront-fronted) |
| `CloudFrontDomain` | Public URL of the static site, e.g. `d111.cloudfront.net` |
| `CloudFrontDistributionId` | Distribution ID (used to issue cache invalidations from CI) |

### CloudWatch alarms (created automatically)

| Alarm | Triggers when |
|---|---|
| `gem-photobooth-upload-lambda-errors` | `Errors > 0` for `UploadImageToS3` in 5 min |
| `gem-photobooth-getimage-lambda-errors` | `Errors > 0` for `GetImageLambda` in 5 min |
| `gem-photobooth-saveemail-lambda-errors` | `Errors > 0` for `SaveEmailLambda` in 5 min |
| `gem-photobooth-api-5xx` | `5xx > 5` for the API Gateway stage in 5 min |
| `gem-photobooth-dynamodb-throttles` | `ThrottledRequests > 0` for the `GEMPhotoboothEmails` table in 5 min |

## Security model

| Endpoint | Auth | Caller |
|---|---|---|
| `POST /upload` | **AWS_IAM (SigV4)** | The kiosk capture device, after assuming `KioskRole` |
| `GET /images/{id}` | Public (returns 302 to a 7-day presigned S3 URL) | The browser (Next.js page) |
| `POST /save-email` | Public | The browser (email capture modal) |

The kiosk must never run in the browser. It is a separate backend process on the capture device.

### Why AWS_IAM and not an API key

- No long-lived secret in the kiosk firmware.
- Credentials auto-expire (1 hour via `DurationSeconds`).
- Access is scoped to a single API route via the role's `Resource` ARN.
- `sts:ExternalId = gem-photobooth-kiosk` prevents confused-deputy attacks.

## Kiosk signing script

Reference implementation: `Webapp/scripts/kiosk-upload.mjs`.

```bash
cd Webapp/scripts
npm install
KIOSK_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name gem-photobooth \
  --query 'Stacks[0].Outputs[?OutputKey==`KioskRoleArn`].OutputValue' --output text) \
API_BASE_URL=$(aws cloudformation describe-stacks --stack-name gem-photobooth \
  --query 'Stacks[0].Outputs[?OutputKey==`UploadAPIUrl`].OutputValue' --output text | sed 's|/upload$||') \
KIOSK_NAME=kiosk-01 \
FILTER_NAME=Galaxia \
node kiosk-upload.mjs /path/to/photo.png
```

The script:

1. Calls `sts:AssumeRole` with `ExternalId: gem-photobooth-kiosk` for 1-hour credentials.
2. SigV4-signs a `POST /upload` request with the image bytes.
3. Sends the request. API Gateway returns `403 Forbidden` if the signature is missing or invalid.

## Deploy workflow (AWS S3 + CloudFront)

Production hosting is **S3 + CloudFront**, not Vercel. The same stack
that runs the backend also provisions the static-site bucket, the
Origin Access Control, the distribution, and the security-headers
policy. Vercel is only used for local previews and PR previews.

`.github/workflows/deploy-frontend.yml` runs on every push to `main` and
on manual dispatch. It:

1. Runs type-check, lint, test.
2. Builds with `next build` (which emits `out/` because `next.config.js`
   has `output: 'export'`).
3. Assumes the deploy IAM role and syncs `out/` to the S3 bucket.
4. Issues a CloudFront cache invalidation for `/*`.

### GitHub repository secrets

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Vercel token (used by `deploy.yml` for PR previews) |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN that GitHub Actions assumes to call `s3 sync` and `cloudfront create-invalidation`. Trust policy must allow `token.actions.githubusercontent.com`. |

### GitHub repository variables

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_AWS_REGION` | `us-east-1` | Inlined into the static bundle at build time |
| `NEXT_PUBLIC_AWS_API_BASE_URL` | `https://abc.execute-api.us-east-1.amazonaws.com/prod/images` | Same |
| `NEXT_PUBLIC_CARD_TEMPLATE_URL` | `https://res.cloudinary.com/.../template.png` | Same |
| `NEXT_PUBLIC_SAVE_EMAIL_URL` | `https://abc.execute-api.us-east-1.amazonaws.com/prod/save-email` | Same |
| `AWS_REGION` | `us-east-1` | Region the deploy runs in (where the stack lives) |
| `STACK_NAME` | `gem-photobooth` | CFN stack name to look up outputs from |

The Vercel project is `gemui` (`prj_eBGNTjXYJsnExKKgLuI3qXzZQOGs`),
already linked via `Webapp/.vercel/project.json`. Keep Vercel Project
Settings → Environments empty for `NEXT_PUBLIC_*` to avoid drift.

### First-time setup

After running `aws cloudformation deploy` for the stack, the
`CloudFrontDomain` output gives you the public URL, e.g.
`https://d111111abcdef8.cloudfront.net`. Use that as the production URL.

## User flow

1. Visitor takes a photo at the kiosk. Kiosk software uploads the PNG to
   `POST /upload` (SigV4-signed), which writes it to S3.
2. Kiosk redirects the visitor to `/?image={kiosk}_{filter}_{timestamp}`.
3. The Next.js page fetches the image via `GET /images/{id}` and renders it.
4. `useCustomCard` fetches the Cloudinary template, draws the visitor's
   custom text + today's date on top, and returns a custom card Blob.
5. The visitor sees a flippable card. They can:
   - **Download** the photo and the custom card (local files).
   - **Share** via the native Web Share API (mobile only).
   - **Edit** the text on the card.
6. An `EmailPopup` modal blocks first paint on every visit. The visitor
   enters an email; the previous email (if any) is offered as a one-tap
   button. The submission goes to `POST /save-email` which writes to
   DynamoDB with a 90-day TTL.

## Tech stack

- **Frontend:** Next.js 14 (App Router, static export), React 18, TypeScript, Tailwind v4, lucide-react, i18next.
- **Hosting:** S3 (private) + CloudFront with OAC, custom security-headers policy.
- **Backend:** API Gateway HTTP API, Lambda (Node 20), S3, DynamoDB (on-demand), CloudWatch.
- **Static assets:** Cloudinary (card template).
- **CI/CD:** GitHub Actions → S3 + CloudFront invalidation (prod), Vercel (previews).

## Removed / historical

- `SendImageEmail` Lambda and `GetImageByEmail` button were removed in v2.2
  when the in-app "share by email" flow was retired. The CFN template
  intentionally does not define these resources.
- A Neon Postgres database was used in an earlier prototype. The current
  backend uses DynamoDB; any `DATABASE_URL` env var is dead config and
  should be removed from your local `.env.local`.

## License

See `LICENSE`.
