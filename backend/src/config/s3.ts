// src/config/s3.ts

import { S3Client } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION;

if (!region) {
  throw new Error('AWS_REGION is not set in environment variables');
}

export const s3Client = new S3Client({
  region,
  // credentials will be read automatically from env:
  // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
});
