# PicklePro Mobile App

A React Native mobile application for pickleball training progression, built according to the PicklePro PRD specifications.

## 🎾 Features

- **DUPR Integration**: Syncs with official DUPR ratings (2.0-8.0)
- **Structured Training**: Tiered progression system (Beginner, Intermediate, Advanced)
- **Skill Tree View**: Visual progression through levels and exercises
- **Coach Discovery**: Find and connect with certified pickleball coaches
- **Badge System**: Unlock achievements as you complete levels
- **Clean UI/UX**: Modern design following best practices

## 🏗️ Architecture

### Screens
- **Authentication**: Mock sign-in with email/password
- **Training**: Skill tree with tier/level progression
- **Coach**: Directory with search and filters
- **Profile**: DUPR rating, badges, stats, and settings

### Navigation
- Bottom tab navigation (Training, Coach, Profile)
- Stack navigation for authentication flow

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (optional)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on device/simulator:
```bash
# iOS
npm run ios

# Android
npm run android

# Web (for testing)
npm run web
```

## 📱 App Structure

```
src/
├── screens/
│   ├── AuthScreen.js          # Login/authentication
│   ├── ExploreTrainingScreen.js # Explore programs and DUPR training
│   ├── CoachScreen.js         # Coach directory
│   └── ProfileScreen.js       # User profile and settings
├── navigation/
│   └── MainTabNavigator.js    # Bottom tab navigation
└── data/
    └── mockData.js            # Mock data for development
```

## 🎯 Current Implementation

This MVP includes:
- ✅ Authentication with mock sign-in
- ✅ Training screen with tier/level progression
- ✅ Coach finder with search and filters
- ✅ Profile with DUPR rating and badges
- ✅ Modern UI/UX design
- ✅ Mock data for all features

## 🔜 Next Steps

- Integrate with Supabase backend
- Add DUPR API integration
- Implement exercise detail screens
- Add real-time progress tracking
- Build coach booking system

## 🛠️ Tech Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **React Navigation**: Navigation library
- **Expo Linear Gradient**: Gradient backgrounds
- **Expo Vector Icons**: Icon library

## 📄 License

This project is part of the PicklePro MVP development.
