# PickleballPro

A comprehensive React Native app for pickleball training with personalized onboarding and structured workout plans.

## 🏓 Features

### 📱 Complete Onboarding System
- **Gender Selection**: Custom image-based selection with smooth animations
- **Rating Integration**: DUPR rating input with validation and beginner-friendly defaults
- **Personal Program Setup**: Name collection and user profile creation
- **Training Goals**: Choose from improving DUPR rating, learning basics, consistency, or tournament prep
- **Time Commitment**: Flexible scheduling from 1-2 hours to 5+ hours per week
- **3-Month Commitment Visualization**: Interactive progress visualization encouraging long-term commitment
- **Focus Areas**: Multi-select training focus areas (serves, volleys, footwork, etc.)
- **Intensity Selection**: Personalized training intensity based on lifestyle
- **Coaching Preferences**: Option to connect with qualified coaches

### 🎨 Modern UI Design
- Clean, consistent design across all screens
- Progress bars without text clutter for streamlined experience
- Phone status bar integration
- Card-based interface with shadows and animations
- Blue accent color scheme (#007AFF)
- Responsive layout for all screen sizes

### 📊 User Experience
- Smooth navigation flow between onboarding screens
- Visual feedback for selections
- Auto-proceed for certain selections
- Keyboard-avoiding views for input screens
- Data persistence throughout the onboarding process

## 🛠 Technical Stack

- **Framework**: React Native with Expo
- **Web Support**: React Native Web + React DOM
- **Navigation**: React Navigation v6
- **Backend**: Supabase (Auth, Database, Storage)
- **Context**: React Context for state management
- **UI Components**: Custom components with modern design
- **Icons**: Expo Vector Icons
- **Safe Areas**: React Native Safe Area Context
- **Platform**: iOS, Android, and Web support

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ModernIcon.js   # Custom icon component
│   ├── TabIcon.js      # Tab navigation icons
│   └── ...
├── context/            # React Context providers
│   ├── UserContext.js  # User data and onboarding state
│   └── LogbookContext.js
├── navigation/         # Navigation configuration
│   ├── MainTabNavigator.js
│   └── OnboardingNavigator.js
├── screens/           # Screen components
│   ├── IntroScreen.js
│   ├── GenderSelectionScreen.js
│   ├── RatingSelectionScreen.js
│   ├── PersonalProgramScreen.js
│   ├── TrainingGoalScreen.js
│   ├── TimeCommitmentScreen.js
│   ├── CommitmentVisualizationScreen.js
│   ├── FocusAreasScreen.js
│   ├── IntensitySelectionScreen.js
│   ├── CoachingPreferenceScreen.js
│   └── ...
└── data/              # Mock data and constants
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or later)
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/guillaumepanot/PickleballPro.git
cd PickleballPro
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on your preferred platform:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Press `w` for Web (browser)
   - Scan QR code with Expo Go app on your device

### 🌐 Web Deployment (NEW!)

Deploy your admin dashboard to the web without Expo or mobile app:

```bash
# Quick deploy in 3 commands
npm run build:web
npm install -g vercel
vercel
```

**📚 Detailed Guides:**
- **[Quick Start Guide](./QUICK_START.md)** - Deploy in 5 minutes
- **[Complete Deployment Guide](./ADMIN_WEB_DEPLOYMENT_GUIDE.md)** - All deployment options
- **[Web vs Mobile Comparison](./WEB_VS_MOBILE.md)** - Feature comparison

**Access your admin dashboard from any browser without installation!**

## 📱 Onboarding Flow

1. **Intro Screen**: Welcome and app introduction
2. **Gender Selection**: Visual selection with custom images
3. **Rating Selection**: DUPR rating input or beginner option
4. **Personal Program**: Name input and profile setup
5. **Training Goals**: Select primary training objectives
6. **Time Commitment**: Choose weekly training time
7. **Commitment Visualization**: 3-month progress motivation
8. **Focus Areas**: Multi-select training focus areas
9. **Intensity Selection**: Personalized training intensity
10. **Coaching Preference**: Optional coach matching
11. **Program Loading**: Generate personalized training plan

## 🎯 Key Components

### GenderSelectionScreen
- Custom image-based selection
- Text overlay on images
- Smooth animations and transitions

### RatingSelectionScreen
- DUPR rating input with validation
- Beginner-friendly default option
- Keyboard-avoiding layout

### CommitmentVisualizationScreen
- 3-month progress visualization
- Motivational messaging
- Simple commitment button

### FocusAreasScreen
- Multi-select grid layout
- Visual selection indicators
- Comprehensive training areas

## 🔧 Development

### Code Style
- Clean, modern React Native patterns
- Functional components with hooks
- Consistent styling with StyleSheet
- Proper error handling and validation

### State Management
- React Context for global state
- Local state for component-specific data
- Persistent storage for user preferences

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**PickleballPro** - Your personalized pickleball training companion! 🏓