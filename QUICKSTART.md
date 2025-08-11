# 🚀 Quick Start Guide

Get the iPee bathroom finder app running in under 5 minutes!

## ⚡ Super Quick Start

1. **Run the installation script:**
   ```bash
   ./install.sh
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Scan the QR code with Expo Go app on your phone**

That's it! 🎉

## 📱 Alternative Quick Start

### Option 1: Manual Installation
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Install project dependencies
npm install

# Start the app
npm start
```

### Option 2: Using Yarn
```bash
# Install Expo CLI globally
yarn global add @expo/cli

# Install project dependencies
yarn install

# Start the app
yarn start
```

## 🔧 What You'll Need

- **Phone**: Install [Expo Go](https://expo.dev/client) app
- **Computer**: Node.js v16+ and npm/yarn
- **Internet**: For dependency installation

## 🚨 Troubleshooting

### "Command not found: expo"
```bash
npm install -g @expo/cli
```

### "Metro bundler error"
```bash
# Clear cache and restart
npx expo start --clear
```

### "Location permission denied"
- Make sure to allow location access when prompted
- Check your device's location settings

### "Cannot connect to development server"
- Ensure your phone and computer are on the same WiFi network
- Try using a tunnel connection: `npx expo start --tunnel`

## 📱 Testing on Simulators

### iOS Simulator (Mac only)
```bash
# Press 'i' in the terminal, or run:
npx expo start --ios
```

### Android Emulator
```bash
# Press 'a' in the terminal, or run:
npx expo start --android
```

## 🎯 Next Steps

1. **Explore the app** - Navigate through all screens
2. **Test features** - Try searching, filtering, and route planning
3. **Customize** - Modify colors, add new features
4. **Deploy** - Build for production when ready

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Guide](https://reactnative.dev/docs/getting-started)
- [Project README](./README.md)

---

**Need help?** Check the main README or create an issue in the repository! 🚽✨
