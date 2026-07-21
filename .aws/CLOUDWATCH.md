# CloudWatch explainer — IT training

This document explains the CloudWatch setup that ships with `.aws/cloudformation/gem-photobooth.yml`, in plain terms, for IT staff.

## What is CloudWatch?

Amazon CloudWatch is AWS's monitoring and observability service. For our photobooth stack, it does three things:

1. **Collects logs** from API Gateway, Lambda functions, and any other AWS service that emits logs.
2. **Stores metrics** (numbers) about how the system is performing — request counts, error rates, latency, throttling.
3. **Alarms** that watch a metric and notify you when it crosses a threshold (e.g. "more than 5 errors in 5 minutes").

You don't install anything. AWS services automatically send logs and metrics to CloudWatch. We just decide **what to keep, for how long, and what to alert on.**

## What this stack creates

| Resource | Logical ID | What it does |
|---|---|---|
| Access log group | `ApiAccessLogGroup` | Stores API Gateway access logs for 30 days (configurable) |
| IAM role | `ApiAccessLogRole` | Lets API Gateway write to the log group |
| SNS topic | `AlarmTopic` | Receives alarm notifications |
| SNS email subscription | `AlarmEmailSubscription` | Forwards alarms to your email (only if `AlarmEmail` parameter is set) |
| 5 CloudWatch alarms | `*ErrorsAlarm`, `ApiGateway5xxAlarm`, `DynamoDBThrottlesAlarm` | Watch for problems |
| Lambda log groups | (auto-created) | One per Lambda function, `AWSLambdaBasicExecutionRole` writes here |

The IAM role `ApiAccessLogRole` is needed because API Gateway cannot write to CloudWatch Logs by itself — it must assume a role that has the `logs:CreateLogStream` and `logs:PutLogEvents` permissions. AWS provides a managed policy `AmazonAPIGatewayPushToCloudWatchLogs` that grants exactly these. We attach it.

## The logs

### Lambda log groups

Each Lambda function gets a log group at `/aws/lambda/<function-name>`. CloudWatch automatically creates these when the function first runs. The Lambda's IAM role (`AWSLambdaBasicExecutionRole`) grants the `logs:CreateLogStream` and `logs:PutLogEvents` permissions, so no extra setup is needed.

The format of each log line is JSON. A typical log entry from our `UploadLambda` looks like:

```
2026-07-21T12:34:56.789Z START RequestId: 8b2f0a4e-...
2026-07-21T12:34:57.012Z 2026/07/21 12:34:57 [INFO]  uploading kiosk=kiosk-01 filter=Galaxia
2026-07-21T12:34:57.234Z END RequestId: 8b2f0a4e-...
2026-07-21T12:34:57.234Z REPORT RequestId: 8b2f0a4e-... Duration: 445.23 ms Billed Duration: 446 ms Memory Size: 128 MB Max Memory Used: 84 MB
```

The `START`/`END`/`REPORT` lines are added automatically. Any `console.log` you write in your Lambda code appears between them.

Retention: Lambda log groups are kept **forever** by default. The stack does not set a retention policy on them, so logs accumulate. **This is intentional** because Lambda logs are cheap (~ $0.03/GB-month after the first 5 GB) and we want postmortem data for any incident.

If you want to cap retention, add the following to each Lambda in the template (CFN does not auto-create the LogGroup resource, so the simplest is to add it explicitly):

```yaml
UploadLambdaLogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: !Sub "/aws/lambda/${UploadLambda}"
    RetentionInDays: 30
```

### API Gateway access log group

The stack creates `/aws/apigateway/gem-photobooth-access` explicitly. Each request to the API Gateway produces a log line in JSON format. The format is configured in the `APIStage` resource's `AccessLogSettings.Format` field and looks like:

```json
{
  "requestId": "8b2f0a4e-...",
  "ip": "203.0.113.42",
  "requestTime": "21/Jul/2026:12:34:56 +00:00",
  "httpMethod": "POST",
  "routeKey": "POST /upload",
  "status": 200,
  "protocol": "HTTP/1.1",
  "responseLength": 87,
  "latencyMs": 445
}
```

This is **not** the same as the Lambda log groups. It records the API Gateway's view of the request — useful for spotting patterns like "many 4xx from a single IP" or "average latency is creeping up" without having to correlate Lambda logs.

Retention: configurable via the `AccessLogRetentionDays` parameter. Default is 30 days. Allowed values: 1, 3, 5, 7, 14, 30, 60, 90, 180, 365, 400, 545, 731, 1827, 3653.

## The metrics

CloudWatch automatically collects metrics from every AWS service. The ones we care about:

| Service | Metric | What it measures |
|---|---|---|
| Lambda | `Invocations` | Number of times the function ran |
| Lambda | `Errors` | Number of invocations that threw an exception |
| Lambda | `Throttles` | Number of invocations rejected because concurrency was full |
| Lambda | `Duration` | Time the function ran, in milliseconds |
| Lambda | `ConcurrentExecutions` | How many function instances are running simultaneously |
| API Gateway | `Count` | Total API requests |
| API Gateway | `4xx` | Client errors (e.g. 403, 404) |
| API Gateway | `5xx` | Server errors (e.g. 500) |
| API Gateway | `Latency` | Time from request received to response sent |
| DynamoDB | `ConsumedWriteCapacityUnits` | How much write throughput you're using |
| DynamoDB | `ThrottledRequests` | Requests rejected because capacity was full |

You can graph any of these in the CloudWatch console. To see them, go to:

**CloudWatch → Metrics → All metrics**

Then pick the namespace (e.g. `AWS/Lambda`) and the dimension (e.g. `FunctionName = UploadImageToS3`).

## The alarms

Alarms are user-defined thresholds on a metric. When the threshold is crossed, the alarm enters the `ALARM` state and (optionally) sends a notification.

We create **5 alarms** in the stack:

### 1. `gem-photobooth-upload-lambda-errors`

- **Namespace:** `AWS/Lambda`
- **Metric:** `Errors`
- **Statistic:** Sum over 5 minutes
- **Threshold:** greater than 0
- **Meaning:** if any `UploadLambda` invocation throws in a 5-minute window, alarm fires
- **Why it matters:** every error here is a lost photo for a visitor. The kiosk may be silently failing.

### 2. `gem-photobooth-getimage-lambda-errors`

- **Namespace:** `AWS/Lambda`
- **Metric:** `Errors`
- **Statistic:** Sum over 5 minutes
- **Threshold:** greater than 0
- **Meaning:** if any `GetImageLambda` invocation throws, alarm fires
- **Why it matters:** visitors would see a broken image on the page. Critical UX failure.

### 3. `gem-photobooth-saveemail-lambda-errors`

- **Namespace:** `AWS/Lambda`
- **Metric:** `Errors`
- **Statistic:** Sum over 5 minutes
- **Threshold:** greater than 0
- **Meaning:** if any `SaveEmailLambda` invocation throws, alarm fires
- **Why it matters:** the email capture (a key business function) is failing. The visitor's email is being lost.

### 4. `gem-photobooth-api-5xx`

- **Namespace:** `AWS/ApiGateway`
- **Metric:** `5xx`
- **Statistic:** Sum over 5 minutes
- **Threshold:** greater than 5
- **Meaning:** if API Gateway returns more than 5 server errors in a 5-minute window, alarm fires
- **Why it matters:** 5xx errors are the API Gateway's view of internal failures. A spike means something upstream (a Lambda, IAM, etc.) is broken.

### 5. `gem-photobooth-dynamodb-throttles`

- **Namespace:** `AWS/DynamoDB`
- **Metric:** `ThrottledRequests`
- **Statistic:** Sum over 5 minutes
- **Threshold:** greater than 0
- **Meaning:** if DynamoDB rejects any request because capacity is exhausted, alarm fires
- **Why it matters:** with on-demand mode, throttling should never happen unless you have a runaway loop. If it does, you have a bug or a DDoS.

### Notification flow

```
   ┌─────────────────┐
   │ CloudWatch      │
   │ Alarm           │
   │ (state: ALARM)  │
   └────────┬────────┘
            │ publishes to SNS topic
            ▼
   ┌─────────────────┐
   │ AlarmTopic      │  (gem-photobooth-alarms)
   └────────┬────────┘
            │ if AlarmEmail is set
            ▼
   ┌─────────────────┐
   │ Email           │  ops@example.com
   │ Subscription    │
   └─────────────────┘
```

If `AlarmEmail` is empty in the deploy parameters, the SNS topic is created but no email is wired. Alarms will still appear in the AWS console under **CloudWatch → Alarms**, just no email notification.

## How to investigate an alarm

When an alarm fires:

1. **Check the email** (if you set `AlarmEmail`) for the alarm name and timestamp.
2. **Open the CloudWatch console** → Alarms → click the alarm in `ALARM` state.
3. **Read the metric graph** at the bottom of the alarm detail page. It shows the last 24 hours of the metric.
4. **Open CloudWatch Logs Insights** (CloudWatch → Logs → Logs Insights) and query the relevant log group:
   - For Lambda errors: select `/aws/lambda/UploadImageToS3` and run `fields @timestamp, @message | filter @message like /Error/ | sort @timestamp desc | limit 50`
   - For API 5xx: select `/aws/apigateway/gem-photobooth-access` and run `fields @timestamp, routeKey, status, latencyMs | filter status >= 500 | sort @timestamp desc | limit 50`
5. **Read the recent deploys** in your changelog. If the alarm started right after a deploy, the deploy is the prime suspect.
6. **Roll back** if needed: redeploy the previous CloudFormation change set (CloudFormation → Stack → Change sets → Create change set → use the previous template version).

## How to add a new alarm

The pattern in the template is:

```yaml
MyNewAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: gem-photobooth-<descriptive-name>
    AlarmDescription: <one-line human explanation>
    Namespace: AWS/<service>
    MetricName: <metric>
    Statistic: Sum   # or Average, Max, Min, p99, etc.
    Period: 300       # 5 minutes, in seconds
    EvaluationPeriods: 1
    Threshold: <number>
    ComparisonOperator: GreaterThanThreshold  # or LessThanThreshold, etc.
    Dimensions:
      - Name: <DimensionName>
        Value: !Ref <ResourceName>  # or a literal
    AlarmActions:
      - !Ref AlarmTopic
    TreatMissingData: notBreaching  # treats "no data" as OK
    Tags:
      - Key: Project
        Value: gem-photobooth
      - Key: Environment
        Value: prod
```

Add it to the template and re-deploy. CloudFormation will create the new alarm without affecting the existing ones.

## Costs

CloudWatch pricing in `us-east-1`:

| Item | Cost |
|---|---|
| Log ingestion | $0.50/GB |
| Log storage | $0.03/GB-month |
| Custom metric (first 10K) | $0.30/metric-month |
| Standard resolution metric (first 10K) | free |
| Alarm (standard resolution) | $0.10/alarm-month |
| Alarm (high resolution) | $0.30/alarm-month |

At our scale (200K users/month), CloudWatch costs ~$1.50/month total. See `.aws/COST.md` for the full breakdown.

## Common operations

### "Where do I find logs for the upload Lambda?"

1. CloudWatch console → Logs → Log groups
2. Click `/aws/lambda/UploadImageToS3`
3. Click the most recent log stream (named after the request ID)
4. Use the search box at the top to filter

### "How do I tail logs in real time?"

Use the AWS CLI:

```bash
aws logs tail /aws/lambda/UploadImageToS3 --follow
```

Press `Ctrl+C` to stop.

### "How do I find all errors in the last hour?"

CloudWatch Logs Insights query:

```
fields @timestamp, @message
| filter @message like /ERROR/ or @message like /Error/
| stats count() by bin(5m)
```

### "How do I change the alarm email?"

The email is set at deploy time via the `AlarmEmail` parameter. To change it:

```bash
aws cloudformation deploy \
  --stack-name gem-photobooth \
  --template-file .aws/cloudformation/gem-photobooth.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides AlarmEmail=newops@example.com
```

CloudFormation will update the `AlarmEmailSubscription` resource to point at the new address. The old address stops receiving notifications.

### "How do I acknowledge an alarm without fixing it?"

In the CloudWatch console, click the alarm → Actions → "Disable" or "Delete". Disabling silences notifications but keeps the alarm definition; deleting removes it entirely. The recommended workflow is: disable, fix the underlying issue, then re-enable.

### "How do I test that an alarm actually fires?"

In the CloudWatch console, click the alarm → Actions → "Edit" → set the threshold to a number your metric is currently exceeding (e.g. `Threshold: 0`, `ComparisonOperator: LessThanThreshold` on a count metric). The alarm should go to `ALARM` immediately. Don't forget to set it back.

## TL;DR for IT

- **Logs:** every Lambda and the API Gateway has a log group. Look in CloudWatch → Logs.
- **Metrics:** every service auto-publishes. Graph in CloudWatch → Metrics.
- **Alarms:** 5 are pre-configured. They publish to an SNS topic; if you set `AlarmEmail`, you get an email.
- **Retention:** API logs default to 30 days. Lambda logs default to forever (cheap).
- **Costs:** under $2/month at our scale.
- **When an alarm fires:** read the metric, query the logs, check the changelog, roll back if needed.
