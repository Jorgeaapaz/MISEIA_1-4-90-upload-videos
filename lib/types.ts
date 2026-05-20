import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
}

export interface VideoMetadata {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  description: string;
  tags: string[];
  metadata: Record<string, string>;
  fileName: string;
  s3Key: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalVideos: number;
  totalSize: number;
  recentVideos: VideoMetadata[];
  tagDistribution: { tag: string; count: number }[];
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}
