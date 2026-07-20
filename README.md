# Grand Egyptian Museum Photobooth

Next.js web app + AWS backend for the GEM photobooth.

## Repository layout

```
.
├── Webapp/                         # Next.js 14 app (App Router, TypeScript, Tailwind v4)
│   ├── src/                        # UI source
│   ├── scripts/kiosk-upload.mjs   # Reference SigV4 signing script for the kiosk capture device
│   └── public/                     # Static assets (fonts, backgrounds, logos)
└── .aws/cloudformation/
    └── gem-photobooth.yml          # Backend stack (S3, Lambdas, API Gateway, DynamoDB)
```

## Quick start (web app)

```bash
cd Webapp
npm install
cp .env.local.example .env.local   # then fill in NEXT_PUBLIC_* URLs
npm run dev                         # http://localhost:3000
```

### Required environment variables (`Webapp/.env.local`)

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_AWS_API_BASE_URL` | `https://abc.execute-api.us-east-1.amazonaws.com/prod/images` | `GetImage` endpoint base (no trailing slash) |
| `NEXT_PUBLIC_CARD_TEMPLATE_URL` | `https://res.cloudinary.com/.../template.png` | PNG template for the back of the card |
| `NEXT_PUBLIC_SAVE_EMAIL_URL` | `https://abc.execute-api.us-east-1.amazonaws.com/prod/save-email` | `SaveEmail` endpoint |

## Backend deployment (CloudFormation)

```bash
aws cloudformation deploy \
  --stack-name gem-photobooth \
  --template-file .aws/cloudformation/gem-photobooth.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --tags Project=gem-photobooth Environment=prod \
  --parameter-overrides \
      KioskTrustedAccountArns=arn:aws:iam::123456789012:root
```

### Stack parameters

| Parameter | Default | Notes |
|---|---|---|
| `BucketNamePrefix` | `rodyna-v4` | Prefix for the S3 bucket name (uniqueness suffix is appended) |
| `EmailRetentionDays` | `90` | DynamoDB TTL for the email table |
| `AccessLogRetentionDays` | `30` | CloudWatch retention for API access logs |
| `KioskRoleName` | `KioskUploadRole` | IAM role the kiosk assumes |
| `KioskTrustedAccountArns` | `""` | Comma-separated account ARNs allowed to assume the role. **Required to be set** to a non-empty list before the role is created |

### Stack outputs

| Output | Description |
|---|---|
| `UploadBucketName` | S3 bucket holding visitor photos |
| `UploadAPIUrl` | Authenticated upload endpoint (requires SigV4) |
| `GetImageAPIUrl` | Public read endpoint (302 → presigned URL) |
| `SaveEmailAPIUrl` | Public endpoint for capturing visitor emails |
| `ApiAccessLogGroupName` | CloudWatch log group with API access logs |
| `KioskRoleArn` | ARN of the role to put in `KIOSK_ROLE_ARN` on the kiosk |

## Security model

| Endpoint | Auth | Caller |
|---|---|---|
| `POST /upload` | **AWS_IAM (SigV4)** | The kiosk capture device, after assuming `KioskRole` |
| `GET /images/{id}` | Public (returns 302 to a 7-day presigned S3 URL) | The browser (Next.js page) |
| `POST /save-email` | Public | The browser (email capture modal) |

The kiosk must never run in the browser. It is a separate backend process on the capture device.

## Kiosk signing script

Reference implementation: `Webapp/scripts/kiosk-upload.mjs`. See the file header
for required environment variables and dependencies.

```bash
cd Webapp/scripts
npm install
KIOSK_ROLE_ARN=arn:aws:iam::123456789012:role/KioskUploadRole \
  API_BASE_URL=https://abc.execute-api.us-east-1.amazonaws.com/prod \
  KIOSK_NAME=kiosk-01 \
  FILTER_NAME=Galaxia \
  node kiosk-upload.mjs /path/to/photo.png
```

The script:

1. Calls `sts:AssumeRole` with `ExternalId: gem-photobooth-kiosk` to get
   short-lived credentials.
2. SigV4-signs a `POST /upload` request with the image bytes.
3. Sends the request; API Gateway rejects it with `403 Forbidden` if the
   signature is missing/invalid.

## Quality gates

```bash
cd Webapp
npm run type-check   # tsc --noEmit
npm run lint         # next lint
npm test             # jest
npm run build        # next build
```

All four run in CI (`.github/workflows/ci.yml`).

## License

See `LICENSE`.
