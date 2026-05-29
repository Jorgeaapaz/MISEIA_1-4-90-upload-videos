import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

const BUCKET = process.env.RUSTFS_BUCKET!;

// RustFS does not reliably support HTTP/1.1 keep-alive connection reuse: the
// server closes the socket after a response but the SDK reuses it for the next
// request, causing ECONNRESET. Force a fresh connection per request.
export const s3Client = new S3Client({
  endpoint: process.env.RUSTFS_ENDPOINT!,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
  },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  requestHandler: new NodeHttpHandler({
    httpAgent: new HttpAgent({ keepAlive: false }),
    httpsAgent: new HttpsAgent({ keepAlive: false }),
  }),
});

let bucketReady = false;

export async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }));
  }
  bucketReady = true;
}

export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  await ensureBucket();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function getObject(key: string, range?: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ...(range ? { Range: range } : {}),
  });
  return s3Client.send(command);
}

export async function headObject(key: string) {
  const command = new HeadObjectCommand({ Bucket: BUCKET, Key: key });
  return s3Client.send(command);
}

export async function deleteObject(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
