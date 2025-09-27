import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export interface AWSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  userSalt: string;
}

export const awsConfig: AWSConfig = {
  region: process.env.AWS_REGION || "eu-north-1", // Stockholm region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  bucketName: process.env.AWS_S3_BUCKET_NAME!,
  userSalt: process.env.USER_SALT || "default-salt-change-in-production",
};

// Validate required environment variables
export function validateConfig(): void {
  const required = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME",
    "USER_SALT",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required AWS environment variables: ${missing.join(", ")}`
    );
  }
}
