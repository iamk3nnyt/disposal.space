# Disposal Space Mobile App 📱

A React Native mobile app built with Expo for the Disposal Space platform.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Run on specific platforms:
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
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

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Code Style

This project uses:

- TypeScript for type safety
- Expo Router for navigation
- Themed components for consistent styling

## 📱 Platform Support

- ✅ iOS
- ✅ Android
- ✅ Web (PWA)

## 🤝 Contributing

This mobile app is designed to work seamlessly with the Disposal Space web application. When implementing features, ensure consistency with the web app's design and functionality.
