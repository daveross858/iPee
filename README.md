# iPee - GPS Bathroom Finder App 🚽📍

A modern, feature-rich GPS application that helps you find available bathrooms along your route. Built with React Native and Expo for cross-platform compatibility.

## ✨ Features

- **GPS Location Tracking** - Real-time location services with high accuracy
- **Interactive Map View** - Find bathrooms on an interactive map with custom markers
- **Route Planning** - Plan routes with bathroom stops along the way
- **Advanced Filtering** - Filter by distance, accessibility, free options, and more
- **Search & Browse** - Search and browse all available bathrooms in your area
- **Real-time Updates** - Get current bathroom status and availability
- **Accessibility Features** - Find accessible bathrooms and changing tables

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ipee-bathroom-finder.git
   cd ipee-bathroom-finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Run on your device/simulator**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## 📱 App Structure

```
src/
├── context/          # React Context for location management
├── screens/          # Main app screens
│   ├── HomeScreen.tsx        # Welcome screen with navigation
│   ├── MapScreen.tsx         # Interactive map with bathroom markers
│   ├── RouteScreen.tsx       # Route planning with bathroom stops
│   └── BathroomListScreen.tsx # Searchable bathroom list
├── services/         # API and business logic
│   └── bathroomService.ts    # Bathroom search and filtering
└── types/            # TypeScript type definitions
    └── bathroom.ts           # Bathroom and route interfaces
```

## 🗺️ Key Features Explained

### 1. Home Screen
- Beautiful gradient header with app branding
- Quick action buttons for main features
- Statistics overview of nearby bathrooms
- Feature highlights and accessibility information

### 2. Map Screen
- Interactive map showing bathroom locations
- Color-coded markers (Free, Paid, Accessible, etc.)
- Real-time filtering options
- Distance-based search (1km to 10km)
- Detailed bathroom information in callouts

### 3. Route Planning
- Enter start and end locations
- Automatic bathroom discovery along routes
- Route summary with distance and time estimates
- Bathroom stop recommendations

### 4. Bathroom List
- Comprehensive list of all nearby bathrooms
- Advanced search and filtering
- Rating-based sorting
- Pull-to-refresh functionality

## 🔧 Configuration

### Location Permissions
The app requires location permissions to function properly:

- **iOS**: `NSLocationWhenInUseUsageDescription` in Info.plist
- **Android**: `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION`

### API Integration
Currently uses mock data, but designed for easy integration with:

- Google Places API
- OpenStreetMap
- Refugerestrooms.org API
- Local government APIs

## 🎨 UI/UX Features

- **Modern Design** - Clean, intuitive interface with Material Design principles
- **Responsive Layout** - Optimized for all screen sizes
- **Accessibility** - Built with accessibility in mind
- **Dark Mode Ready** - Prepared for future dark mode implementation
- **Smooth Animations** - Fluid transitions and interactions

## 🚧 Development Notes

### Current Implementation
- Mock data for demonstration purposes
- Simulated API delays for realistic user experience
- Basic routing simulation

### Future Enhancements
- Real API integration
- Offline map support
- Push notifications for nearby bathrooms
- User reviews and ratings
- Favorite locations
- Social sharing features

## 📱 Platform Support

- ✅ iOS (iPhone, iPad)
- ✅ Android (Phone, Tablet)
- ✅ Web (Progressive Web App)

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **Maps**: React Native Maps
- **Location**: Expo Location
- **UI Components**: Custom components with React Native
- **Styling**: StyleSheet with modern design patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- React Native community for continuous improvements
- Open source contributors for inspiration and guidance

## 📞 Support

If you have any questions or need help:

- Create an issue in the GitHub repository
- Check the [Expo documentation](https://docs.expo.dev/)
- Review React Native troubleshooting guides

---

**Made with ❤️ for when nature calls!** 🚽✨