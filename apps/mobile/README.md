# Disposal Space Mobile App 📱

A React Native mobile app built with Expo for the Disposal Space platform.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (package manager)
- EAS CLI (`pnpm add -g eas-cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm start
   ```

3. Run on specific platforms:
   ```bash
   pnpm run ios     # iOS Simulator
   pnpm run android # Android Emulator
   pnpm run web     # Web browser
   ```

## 📁 Project Structure

```
├── app/                    # App screens (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home screen
│   │   └── explore.tsx    # Settings screen
│   ├── _layout.tsx        # Root layout
│   └── modal.tsx          # Upload modal
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── themed-text.tsx   # Themed text component
│   └── themed-view.tsx   # Themed view component
├── lib/                  # Utilities and types
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── services/            # API and external services
│   └── api.ts          # API service layer
├── constants/          # App constants and themes
├── assets/            # Images, fonts, and other assets
└── hooks/            # Global hooks
```

## 🎨 Features (Planned)

- [ ] File upload and management
- [ ] Folder navigation
- [ ] Search functionality
- [ ] User authentication
- [ ] Dark/light theme support
- [ ] Offline support
- [ ] Push notifications

## 🔧 Development

### Environment Variables

Environment variables are configured in `eas.json` for different build profiles:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3000"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_your_production_key",
        "EXPO_PUBLIC_API_URL": "https://untitled-monorepo-untitled.vercel.app"
      }
    }
  }
}
```

### Code Style

This project uses:

- TypeScript for type safety
- Expo Router for navigation
- Themed components for consistent styling

## 🚀 Production Deployment

### Prerequisites for App Store Submission

1. **Apple Developer Account** ($99/year)
   - Sign up at [Apple Developer Portal](https://developer.apple.com)

2. **App Store Connect Setup**
   - Bundle Identifier: `com.disposalspace.mobile`
   - App Name: "Disposal Space"

### Step-by-Step Deployment Process

#### 1. Install and Setup EAS CLI

```bash
# Install EAS CLI globally
pnpm add -g eas-cli

# Navigate to mobile app directory
cd apps/mobile

# Login to your Expo account
eas login
```

#### 2. Configure Credentials

```bash
# Set up Apple Developer credentials
eas credentials --platform ios
```

Follow the prompts:

- Select `production` build profile
- Choose "App Store Connect: Manage your API Key"
- Select "Set up your project to use an API Key for EAS Submit"

#### 3. Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in app details:
   - **Name**: "Disposal Space"
   - **Bundle ID**: `com.disposalspace.mobile`
   - **SKU**: `disposal-space-mobile`
   - **Language**: Your preferred language

#### 4. Get App Store Connect App ID

1. In App Store Connect, select your app
2. Go to "App Information" (left sidebar)
3. Copy the "Apple ID" number
4. Update `eas.json` with this ID:

```json
{
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID"
      }
    }
  }
}
```

#### 5. Update Environment Variables

Ensure your production environment variables are set in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_your_production_clerk_key",
        "EXPO_PUBLIC_API_URL": "https://untitled-monorepo-untitled.vercel.app"
      }
    }
  }
}
```

#### 6. Build and Submit

```bash
# Build and automatically submit to App Store
eas build --platform ios --profile production --auto-submit
```

Or build and submit separately:

```bash
# Build first
eas build --platform ios --profile production

# Then submit
eas submit --platform ios --profile production
```

#### 7. App Store Review Process

- **Build Processing**: 5-15 minutes
- **Apple Review**: 24-48 hours typically
- **Status Tracking**: Monitor in App Store Connect

### TestFlight Testing (Recommended)

After your build is processed, test your app in TestFlight before submitting for App Store review:

#### 1. Access TestFlight

1. **Download TestFlight** app from the App Store on your iPhone
2. **Sign in** with the same Apple ID used for your developer account
3. **Find "Disposal Space"** in TestFlight
4. **Install and test** your app thoroughly

#### 2. Testing Checklist

Before submitting for App Store review, verify:

- ✅ **Authentication**: Clerk login works properly
- ✅ **File Upload**: Upload functionality works
- ✅ **Navigation**: All screens and modals work
- ✅ **API Connectivity**: Backend integration functions
- ✅ **File Actions**: Download, share, rename, delete work
- ✅ **Folder Navigation**: Breadcrumbs and folder traversal
- ✅ **Settings**: Storage info displays correctly
- ✅ **No Crashes**: App is stable across all features

### App Store Submission

Once testing is complete, submit your app for App Store review:

#### 1. Complete App Store Listing

In [App Store Connect](https://appstoreconnect.apple.com):

1. **Navigate to Your App** → "App Store" tab
2. **Add Build**: Select your TestFlight build
3. **Complete Required Information**:

**App Information:**

- **Name**: "Disposal Space"
- **Subtitle**: "Your Digital Disposal Space - Hidden Cloud Storage"
- **Description**: See detailed description below
- **Keywords**: `cloud storage, file manager, hidden storage, digital organization, secure storage, file backup, document storage, folder management, file sync, digital declutter`
- **Support URL**: Your website or support page
- **Privacy Policy URL**: Required for data collection

**Screenshots Required:**

- **iPhone 6.7"** (1290 x 2796 pixels): iPhone 15 Pro Max
- **iPhone 6.1"** (1179 x 2556 pixels): iPhone 15 Pro
- **iPad Pro 12.9"** (2048 x 2732 pixels): If supporting iPad

**App Review Information:**

- **Contact Information**: Your email and phone
- **Demo Account**: Test credentials for reviewers
- **Notes**: Special instructions for Apple reviewers

#### 2. App Store Description

```
DISPOSAL SPACE - Your Digital Disposal Space

Store things you never want to see cluttering your life, but might need someday. A hidden cloud space for digital disposal and unexpected recovery when the time comes.

KEY FEATURES:

🔒 HIDDEN STORAGE
Store files, documents, and folders away from your daily view while keeping them safely accessible when needed.

📁 SMART ORGANIZATION
Upload files and folders with drag-and-drop simplicity. Navigate through your disposal space with intuitive folder structures.

🔍 POWERFUL SEARCH
Find anything instantly with comprehensive search across all your stored items, no matter how deep they're buried.

📱 SEAMLESS SYNC
Access your disposal space from anywhere. Your hidden files sync across all your devices automatically.

🗂️ FILE MANAGEMENT
• Upload files and entire folders
• Create custom folder structures
• Rename, move, and organize items
• Preview files without downloading
• Bulk operations for efficiency

💾 SECURE STORAGE
Your digital disposal space is protected with enterprise-grade security. Store sensitive documents, old projects, random thoughts, and digital clutter safely.

PERFECT FOR:
• Old projects you might reference later
• Documents you rarely need but can't delete
• Digital clutter that doesn't belong in your main storage
• Sensitive files you want to keep private
• Screenshots, downloads, and random files
• Archive materials and backup documents

WHY DISPOSAL SPACE?
Sometimes you need to keep things "just in case" without them cluttering your everyday digital life. Disposal Space gives you a dedicated hidden area for these items - out of sight, but never out of reach.

Download now and start decluttering your digital life while keeping everything safely stored for future recovery.
```

#### 3. Create Screenshots

**Method 1: From TestFlight**

- Install app from TestFlight
- Take screenshots of key screens:
  - Home screen with file list
  - Upload modal
  - File actions modal
  - Settings screen
  - Sign-in screen

**Method 2: Using iOS Simulator**

```bash
# Open iOS Simulator
open -a Simulator

# Take screenshots with Cmd+S or Device > Screenshot
```

#### 4. Submit for Review

1. **Complete all required fields** in App Store Connect
2. **Add screenshots** for all required device sizes
3. **Set pricing** (Free or Paid)
4. **Click "Submit for Review"**
5. **Answer any additional questions** from Apple

#### 5. Review Timeline

- **Submission Received**: Immediate
- **In Review**: Usually within 24-48 hours
- **Review Complete**:
  - ✅ **Approved**: App goes live immediately
  - ❌ **Rejected**: Feedback provided, can resubmit

### Demo Account for Reviewers

Since the app uses Clerk authentication, provide test credentials:

```
Email: reviewer@disposalspace.com
Password: [Create a simple test password]
Instructions: Use provided credentials to test the app functionality
```

### Common Review Issues to Avoid

- **Missing Privacy Policy**: Required if collecting user data
- **Broken Authentication**: Ensure Clerk login works in production
- **Missing Content**: App must have actual functionality beyond login
- **Crashes**: Test thoroughly in TestFlight first
- **Misleading Description**: Description must match actual functionality
- **Missing Screenshots**: All required device sizes must be provided
- **Demo Account Issues**: Ensure test credentials work properly

### Post-Submission Monitoring

#### Track Review Status

1. **App Store Connect Dashboard**
   - Monitor review status changes
   - Check for reviewer feedback
   - Respond to any questions promptly

2. **Email Notifications**
   - Apple sends status updates via email
   - Check spam folder if not receiving notifications
   - Notifications include: In Review, Approved, Rejected

#### If Rejected

1. **Read Feedback Carefully**
   - Apple provides specific reasons for rejection
   - Address each point mentioned in the feedback

2. **Fix Issues**
   - Update code if necessary
   - Rebuild and resubmit if code changes needed
   - Update metadata if only listing issues

3. **Resubmit**

   ```bash
   # If code changes needed
   eas build --platform ios --profile production --auto-submit

   # If only metadata changes needed
   # Update in App Store Connect and resubmit
   ```

#### After Approval

1. **App Goes Live**
   - App appears on App Store immediately after approval
   - Users can download and install

2. **Monitor Performance**
   - Check App Store Connect Analytics
   - Monitor crash reports and user feedback
   - Respond to user reviews

3. **Plan Updates**
   - Gather user feedback
   - Plan feature improvements
   - Prepare next version updates

### Environment Configuration

The app uses the following environment variables:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk authentication key
- `EXPO_PUBLIC_API_URL`: Backend API endpoint

**Important Notes:**

- `EXPO_PUBLIC_` variables are publicly visible in the app bundle
- Environment variables are baked into the build and require rebuilding when changed
- Use production Clerk keys for App Store releases

### Updating Production App

To push updates after initial submission:

1. Update version in `app.json`:

   ```json
   {
     "expo": {
       "version": "1.0.1"
     }
   }
   ```

2. Build and submit update:
   ```bash
   eas build --platform ios --profile production --auto-submit
   ```

### Troubleshooting

- **Build Failures**: Check environment variables and certificates
- **Submission Issues**: Verify App Store Connect App ID
- **Authentication Problems**: Ensure Clerk keys are correct

### References

- [Expo iOS Submission Guide](https://docs.expo.dev/submit/ios/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Apple Developer Portal](https://developer.apple.com)

## 📱 Platform Support

- ✅ iOS (App Store Ready)
- ✅ Android (Google Play Ready)
- ✅ Web (PWA)

## 🤝 Contributing

This mobile app is designed to work seamlessly with the Disposal Space web application. When implementing features, ensure consistency with the web app's design and functionality.

### Development Workflow

1. Create feature branch
2. Implement changes with proper TypeScript types
3. Test on iOS/Android simulators
4. Update environment variables if needed
5. Submit PR for review
