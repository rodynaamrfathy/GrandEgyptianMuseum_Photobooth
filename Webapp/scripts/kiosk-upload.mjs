#!/usr/bin/env node
/**
 * Reference signing script for the kiosk capture device.
 *
 * Demonstrates how to:
 *   1. Assume the KioskUploadRole via STS to obtain short-lived credentials.
 *   2. SigV4-sign a POST /upload request to the API Gateway HTTP API.
 *   3. Send the image bytes with the signed Authorization header.
 *
 * This file is run on the kiosk (a small backend service running Node.js),
 * NOT in the browser. The browser-hosted photobooth page never sees AWS
 * credentials.
 *
 * Prerequisites:
 *   - Node.js 20+
 *   - npm install @aws-sdk/client-sts @smithy/signature-v4 @smithy/protocol-http
 *           @aws-crypto/sha256-js
 *   - AWS credentials for an IAM principal that is allowed to assume the
 *     KioskUploadRole (configured via KioskTrustedAccountArns at deploy
 *     time). The role's trust policy requires sts:ExternalId =
 *     "gem-photobooth-kiosk".
 *   - Environment variables:
 *       AWS_REGION              e.g. us-east-1
 *       KIOSK_ROLE_ARN          Output of the CloudFormation stack
 *       API_BASE_URL            e.g. https://abc123.execute-api.us-east-1.amazonaws.com/prod
 *       KIOSK_NAME              e.g. kiosk-01
 *       FILTER_NAME             e.g. Galaxia
 *
 * Usage:
 *   node scripts/kiosk-upload.mjs ./photo.png
 */

import { readFile } from "node:fs/promises";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { SignatureV4 } from "@smithy/signature-v4";
import { HttpRequest } from "@smithy/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-js";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const {
  AWS_REGION = "us-east-1",
  KIOSK_ROLE_ARN,
  API_BASE_URL,
  KIOSK_NAME = "kiosk-01",
  FILTER_NAME = "default",
} = process.env;

if (!KIOSK_ROLE_ARN) {
  console.error("KIOSK_ROLE_ARN is required (CloudFormation output KioskRoleArn).");
  process.exit(1);
}
if (!API_BASE_URL) {
  console.error("API_BASE_URL is required (e.g. https://abc.execute-api.us-east-1.amazonaws.com/prod).");
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node kiosk-upload.mjs <path-to-image.png>");
  process.exit(1);
}

async function assumeKioskRole() {
  const sts = new STSClient({ region: AWS_REGION });
  const out = await sts.send(
    new AssumeRoleCommand({
      RoleArn: KIOSK_ROLE_ARN,
      RoleSessionName: `kiosk-${KIOSK_NAME}-${Date.now()}`,
      ExternalId: "gem-photobooth-kiosk",
      DurationSeconds: 3600,
    }),
  );
  return {
    accessKeyId: out.Credentials.AccessKeyId,
    secretAccessKey: out.Credentials.SecretAccessKey,
    sessionToken: out.Credentials.SessionToken,
  };
}

async function uploadImage(creds, pngBuffer) {
  const url = new URL(`${API_BASE_URL}/upload`);
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14); // YYYYMMDDhhmmss

  const signer = new SignatureV4({
    credentials: creds,
    region: AWS_REGION,
    service: "execute-api",
    sha256: Sha256,
  });

  const request = new HttpRequest({
    method: "POST",
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port ? Number(url.port) : undefined,
    path: url.pathname,
    headers: {
      "content-type": "image/png",
      "x-kiosk-name": KIOSK_NAME,
      "x-filter-name": FILTER_NAME,
      "x-timestamp": timestamp,
      host: url.hostname,
    },
    body: pngBuffer,
  });

  const signed = await signer.sign(request);

  const res = await fetch(url, {
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
  });

  return { status: res.status, body: await res.text() };
}

const png = await readFile(filePath);
const creds = await assumeKioskRole();
const result = await uploadImage(creds, png);
console.log(result);
if (result.status !== 200) process.exit(1);
