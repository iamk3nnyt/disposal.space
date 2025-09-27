# AWS Setup Guide

This guide will walk you through obtaining all the credentials and configuration needed for your `@ketryon/aws` package.

## Required Environment Variables

You need these 5 environment variables:

```bash
AWS_REGION=eu-north-1                    # AWS region (Stockholm)
AWS_ACCESS_KEY_ID=your_access_key        # AWS access key
AWS_SECRET_ACCESS_KEY=your_secret_key    # AWS secret key
AWS_S3_BUCKET_NAME=your-bucket-name      # S3 bucket name
USER_SALT=your-random-salt               # Random salt for security
```

---

## Step 1: Create AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click **"Create an AWS Account"**
3. Follow the registration process (requires credit card)
4. Complete email verification

---

## Step 2: Create IAM User (Recommended)

> **⚠️ Important**: Don't use your root AWS account for applications. Create a dedicated IAM user.

### 2.1 Access IAM Console

1. Sign in to [AWS Console](https://console.aws.amazon.com)
2. Search for **"IAM"** in the services search bar
3. Click on **"IAM"** service

### 2.2 Create New User

1. Click **"Users"** in the left sidebar
2. Click **"Create user"** button
3. Enter username: `disposal-space-app` (or your preferred name)
4. Click **"Next"**

### 2.3 Set Permissions

1. Select **"Attach policies directly"**
2. Search for and select: **`AmazonS3FullAccess`**
   - ✅ This gives full S3 access (upload, download, delete)
   - ⚠️ For production, consider creating a custom policy with limited permissions
3. Click **"Next"**
4. Click **"Create user"**

### 2.4 Create Access Keys

1. Click on your newly created user
2. Go to **"Security credentials"** tab
3. Scroll down to **"Access keys"** section
4. Click **"Create access key"**
5. Select **"Application running outside AWS"**
6. Click **"Next"**
7. Add description: `Disposal Space Application`
8. Click **"Create access key"**

### 2.5 Save Your Credentials

```bash
# ✅ Copy these values - you'll need them!
AWS_ACCESS_KEY_ID=AKIA...              # Access key ID
AWS_SECRET_ACCESS_KEY=wJalrXUt...      # Secret access key
```

> **🚨 CRITICAL**: Save these credentials immediately! AWS will only show the secret key once.

---

## Step 3: Create S3 Bucket

### 3.1 Access S3 Console

1. In AWS Console, search for **"S3"**
2. Click on **"S3"** service

### 3.2 Create Bucket

1. Click **"Create bucket"**
2. **Bucket name**: Choose a globally unique name
   ```bash
   # Examples (must be globally unique):
   disposal-space-files-prod-2024
   your-company-disposal-files
   myapp-storage-bucket-xyz123
   ```
3. **Region**: Select **"Europe (Stockholm) eu-north-1"**
   - ✅ This matches the default region in your config
4. **Block Public Access**: Keep all boxes ✅ checked (recommended for security)
5. **Bucket Versioning**: Disable (to save costs)
6. **Default encryption**:
   - Select **"Server-side encryption with Amazon S3 managed keys (SSE-S3)"**
   - ✅ This provides encryption at rest
7. Click **"Create bucket"**

### 3.3 Configure CORS (Optional)

If you plan to upload files directly from the browser:

1. Click on your bucket name
2. Go to **"Permissions"** tab
3. Scroll to **"Cross-origin resource sharing (CORS)"**
4. Click **"Edit"** and add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## Step 4: Generate USER_SALT

The `USER_SALT` is used to securely hash user IDs in file keys.

### Option 1: Using Node.js (Recommended)

```bash
node -e "console.log('USER_SALT=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: Using OpenSSL

```bash
openssl rand -hex 32
```

### Option 3: Online Generator

Visit [random.org/strings](https://www.random.org/strings/) and generate a 64-character hex string.

**Example output:**

```bash
USER_SALT=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

## Step 5: Set Up Environment Variables

Create a `.env.local` file in your Next.js app root:

```bash
# /Users/itsk3nny/Desktop/untitled-monorepo/apps/untitled/.env.local

# AWS Configuration
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=AKIA...your-access-key...
AWS_SECRET_ACCESS_KEY=wJalrXUt...your-secret-key...
AWS_S3_BUCKET_NAME=your-bucket-name
USER_SALT=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# Other existing variables...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
# etc...
```

---

## Step 6: Test Your Configuration

Create a simple test script to verify everything works:

```typescript
// test-aws.ts
import { fileProcessor } from "@ketryon/aws";

async function testAWS() {
  try {
    console.log("✅ AWS configuration loaded successfully");

    // Test with a small buffer
    const testBuffer = Buffer.from("Hello, AWS S3!");
    const result = await fileProcessor.uploadAndProcess(
      testBuffer,
      "test.txt",
      "test-user-123"
    );

    console.log("✅ Upload successful:", result);

    // Clean up test file
    await fileProcessor.deleteFile(result.key);
    console.log("✅ Cleanup successful");
  } catch (error) {
    console.error("❌ AWS test failed:", error.message);
  }
}

testAWS();
```

Run the test:

```bash
npx tsx test-aws.ts
```

---

## Security Best Practices

### ✅ Do's

- ✅ Use IAM users, not root account
- ✅ Enable S3 bucket encryption (SSE-S3)
- ✅ Block public access on S3 bucket
- ✅ Use environment variables for credentials
- ✅ Generate strong USER_SALT (32+ bytes)
- ✅ Regularly rotate access keys

### ❌ Don'ts

- ❌ Never commit credentials to git
- ❌ Don't use root AWS account for apps
- ❌ Don't make S3 bucket publicly readable
- ❌ Don't hardcode credentials in source code
- ❌ Don't share credentials in plain text

---

## Troubleshooting

### Error: "Missing required AWS environment variables"

- ✅ Check `.env.local` file exists and has correct variable names
- ✅ Restart your development server after adding variables

### Error: "Access Denied"

- ✅ Verify IAM user has `AmazonS3FullAccess` policy
- ✅ Check bucket name is correct
- ✅ Ensure credentials are valid and not expired

### Error: "Bucket does not exist"

- ✅ Verify bucket name matches exactly (case-sensitive)
- ✅ Check bucket is in the correct region (`eu-north-1`)

### Error: "Invalid region"

- ✅ Ensure `AWS_REGION=eu-north-1` in your environment variables
- ✅ Verify bucket was created in Stockholm region

---

## Cost Considerations

### S3 Pricing (Stockholm region - approximate)

- **Storage**: ~$0.023 per GB per month
- **PUT requests**: ~$0.005 per 1,000 requests
- **GET requests**: ~$0.0004 per 1,000 requests
- **Data transfer**: First 1GB free per month

### Example Monthly Costs

- **Small app** (1GB storage, 10K requests): ~$0.08/month
- **Medium app** (10GB storage, 100K requests): ~$0.80/month
- **Large app** (100GB storage, 1M requests): ~$8.00/month

---

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Test your configuration with the test script
3. ✅ Integrate the AWS package into your application
4. ✅ Set up monitoring and alerts (optional)
5. ✅ Consider setting up CloudFront CDN for better performance (optional)

Your AWS S3 setup is now complete and ready for production use! 🚀
