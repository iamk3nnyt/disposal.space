# Disposal Space Mobile App Setup

## Environment Variables

Create a `.env` file in the mobile app root with the following variables:

```bash
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# API Configuration (optional, defaults to production)
EXPO_PUBLIC_API_URL=https://untitled-monorepo-untitled.vercel.app
```

## Getting Your Clerk Publishable Key

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your project (should be the same one used for the web app)
3. Go to **Developers** → **API Keys**
4. Copy the **Publishable key** (starts with `pk_test_` or `pk_live_`)
5. Paste it in your `.env` file

## Running the App

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm start
   ```

3. Scan the QR code with the Expo Go app on your device

## Features

- ✅ **Authentication**: Sign in/up with Clerk
- ✅ **File Management**: View, upload, and manage files
- ✅ **Storage Tracking**: Real-time storage usage display
- ✅ **Offline Support**: React Query caching
- ✅ **SSE Upload Progress**: Real-time upload progress tracking

## Architecture

The mobile app uses the **REST API approach**, connecting directly to your Next.js backend at `https://untitled-monorepo-untitled.vercel.app`. This ensures:

- **Consistent Business Logic**: Same validation and processing as web app
- **Security**: Authentication handled by Clerk with proper token management
- **Real-time Features**: SSE support for upload progress
- **Scalability**: Leverages existing infrastructure

## Authentication Flow

1. User opens app → redirected to sign-in if not authenticated
2. Sign in/up with Clerk → token stored securely
3. Token automatically included in all API requests
4. Real-time token refresh handled by Clerk SDK
