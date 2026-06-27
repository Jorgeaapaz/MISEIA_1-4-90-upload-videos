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

const clientConfig = (endpoint: string) => ({
  endpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
  },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED' as const,
  responseChecksumValidation: 'WHEN_REQUIRED' as const,
  // RustFS does not reliably support HTTP/1.1 keep-alive: force a fresh
  // connection per request to avoid ECONNRESET on reused sockets.
  requestHandler: new NodeHttpHandler({
    httpAgent: new HttpAgent({ keepAlive: false }),
    httpsAgent: new HttpsAgent({ keepAlive: false }),
  }),
});

// Internal client — used for server-side ops (getObject, headObject, delete, bucket init).
export const s3Client = new S3Client(clientConfig(process.env.RUSTFS_ENDPOINT!));

// Public client — used only for presigned URL generation so the signed URL
// contains the browser-reachable HTTPS hostname instead of the internal one.
const publicEndpoint = process.env.RUSTFS_PUBLIC_ENDPOINT ?? process.env.RUSTFS_ENDPOINT!;
const s3PublicClient = new S3Client(clientConfig(publicEndpoint));

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
  return getSignedUrl(s3PublicClient, command, { expiresIn: 3600 });
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3PublicClient, command, { expiresIn: 3600 });
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
