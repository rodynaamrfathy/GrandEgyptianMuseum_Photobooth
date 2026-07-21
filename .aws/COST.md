# AWS cost estimate — 200,000 users/month

Calculated from the resources in `.aws/cloudformation/gem-photobooth.yml`.
Region: `us-east-1`. Currency: USD.

## Assumptions

- 200,000 unique visits/month
- ~5 MB static bundle downloaded per visit (HTML, JS, CSS, fonts)
- Average PNG upload: 500 KB
- 80% of visitors enter an email (160,000 email records)
- Static asset cache hit rate: 90% at the CloudFront edge
- No multi-region failover
- Pricing taken from the public `us-east-1` rate card; not including Savings Plans, Reserved Capacity, or EDP discounts

## Per-visit activity

| Action | Times per visit |
|---|---|
| Static page load (CloudFront) | 1 |
| Kiosk upload (Lambda + S3) | 1 |
| Image fetch (Lambda presigned URL) | 1 |
| Email capture (Lambda + DynamoDB) | 0.8 (80% of users) |

## Monthly totals

| Service | Cost | Breakdown |
|---|---:|---|
| S3 (UploadBucket) | **$28.76** | Storage: $27.60 · PUT: $1.00 · GET: $0.16 |
| Lambda | **$0.53** | Invocations: $0.00 (under 1M free) · Compute: $0.53 |
| API Gateway HTTP API | **$0.56** | 560K requests × $1/M |
| DynamoDB (on-demand) | **$1.43** | Writes: $0.20 · Storage: $1.23 |
| CloudFront | **$87.40** | Requests: $2.40 · Data transfer: $85.00 |
| CloudWatch + SNS | **$1.53** | Logs: $1.03 · Alarms: $0.50 · SNS: $0.00 |
| **Total** | **$120.21** | |

| Metric | Value |
|---|---:|
| Per user | $0.0006 |
| Per 1,000 users | $0.60 |
| Annual run rate | $1,443 |

## Where the money goes

```
CloudFront  ████████████████████████████████░░░░░░░  71%  ($85)
S3          ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  23%  ($28)
CloudWatch  █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   1%  ($1.5)
API GW      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.5% ($0.56)
Lambda      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.5% ($0.53)
DynamoDB    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.2% ($0.23)
```

## What is NOT going through CloudFront

The uploaded photos are served **directly from S3** via the 7-day presigned URL issued by the `GetImage` Lambda. The `UploadBucket` has a public `Principal: '*'` `GetObject` policy, and visitors' browsers fetch the photos from `*.s3.<region>.amazonaws.com`, not from CloudFront.

This is intentional: the static web app is global and benefits from edge caching; the photos are unique per visitor and only fetched once, so a CDN would just add cost without improving latency.

## Scaling

| Users/month | Estimated cost | Dominant driver |
|---|---:|---|
| 50,000 | ~$50 | CloudFront data transfer |
| 200,000 | ~$119 | CloudFront data transfer |
| 500,000 | ~$260 | CloudFront data transfer |
| 1,000,000 | ~$500 | CloudFront data transfer + S3 storage |
| 2,000,000 | ~$1,200 | CloudFront data transfer dominates |

At every scale, **CloudFront data transfer is the largest line item**.

> **Note on DynamoDB growth:** The `EmailTable` has no TTL, so email records accumulate indefinitely. At 160K writes/month and ~200 bytes per item, storage grows by ~30 GB/year. At 5 years that's ~150 GB, costing ~$38/month. Consider re-enabling a TTL or archiving old rows to S3 Glacier if retention is a concern.

## Cost-reduction levers (ranked by ROI)

| Lever | Effort | Monthly saving | Notes |
|---|---|---:|---|
| S3 Lifecycle rule: expire uploads after 90 days | 5 min | $25 | Reduces PII footprint, not just cost. ~25% off. |
| CloudFront cache TTLs for `/_next/static/*` set to 1 year | 10 min | $30-50 | Content-hashed files are safe to cache forever. |
| S3 Intelligent-Tiering on UploadBucket | 5 min | $10 | For access patterns older than 30 days. |
| CloudFront PriceClass_200 (add Asia/South America) | already in | $0 | Current setting is PriceClass_100 (cheaper tier). |
| CloudFront PriceClass_All (add all edges) | 1 line | -$10 to -$30 | Better latency for distant visitors; **costs more**, not less. |
| Drop the 7-day presigned URL, use CloudFront for images too | 1 hour | -$5 (S3 GET) + ~$50 (more CF egress) | **Net loss** for this access pattern. Skip. |
| Move API to Lambda URLs (skip API Gateway) | 1 hour | $0.56 (small) | Not worth the auth complexity at this scale. |
| Provisioned Concurrency on the GetImage Lambda | 1 hour | -$1 (faster cold starts, but more $$) | Not worth it; current cold-start is fine. |

**Best two changes** (apply together): S3 Lifecycle + CloudFront cache TTL tweaks. Combined savings: ~$50-75/month, bringing 200K-user cost to **~$50/month** ($600/year).

## Comparison with alternatives

| Architecture | Monthly @ 200K users | Notes |
|---|---:|---|
| **This template (S3 + CloudFront + Lambda)** | **$119** | Self-contained, no vendor lock-in beyond AWS. |
| Vercel Pro + Lambda | $250 | Vercel Pro is $20/seat/month; $240/year minimum. |
| EC2 t3.small (24/7) + ALB + RDS | $150+ | Add devops time, RDS backups, OS patching. |
| Firebase (Auth + Firestore + Storage) | $250-400 | Higher at this scale; complex egress rules. |
| Cloudflare Pages + Workers + R2 | $5-30 | Cheapest, but Workers have 10ms CPU limits; R2 has different pricing. |

## How to verify in production

After deploy, turn on **AWS Cost Explorer** and tag everything with `Project: gem-photobooth` (the template does this for taggable resources; for the rest, use stack-level tags at deploy time):

```bash
aws cloudformation deploy \
  --stack-name gem-photobooth \
  --template-file .aws/cloudformation/gem-photobooth.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --tags Project=gem-photobooth Environment=prod
```

In Cost Explorer, group by `Tag: Project` to see only this stack's costs.

## Refresh cadence

Re-run this estimate every 6 months. AWS pricing changes, your traffic mix will change, and S3 Intelligent-Tiering / CloudFront price-class shifts can swing the bill 20-30%.
