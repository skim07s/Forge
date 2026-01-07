# 🔨 Forge - Habit Tracker

A high-performance React Native habit tracking app built with Expo. Track your daily habits, visualize your progress with an interactive calendar, and build lasting streaks.

## ✨ Features

- **The Anvil Dashboard** - Clean, intuitive interface for managing your habits
- **Interactive Calendar** - Track completions with month navigation and visual indicators
- **Streak Tracking** - Monitor your consistency with automatic streak calculations
- **Habit Details** - Deep dive into each habit's statistics and history
- **Smooth Animations** - Built with React Native Reanimated for buttery-smooth UI
- **Dark Theme** - Eye-friendly interface with ember (#FF6B35) and forge (#FFB800) accent colors

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Expo Go** app on your mobile device (iOS/Android) - [Download from App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

Optional:

- **Git** - [Download here](https://git-scm.com/)

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/GopikChenth/Forge.git
   cd Forge
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npx expo start
   ```

4. **Run on your device**
   - Scan the QR code with the **Expo Go** app (Android) or Camera app (iOS)
   - Or press `a` for Android emulator, `i` for iOS simulator

## 🛠️ Tech Stack

- **React Native** 0.81.5 - Cross-platform mobile framework
- **Expo SDK** 54 - Development platform and tooling
- **React** 19.1.0 - UI library
- **Zustand** - Lightweight state management
- **React Native MMKV** - Fast, efficient storage
- **React Native Reanimated** - Smooth, performant animations
- **React Native Gesture Handler** - Touch gesture system
- **Lucide React Native** - Beautiful icon library
- **Expo Google Fonts (Inter)** - Modern typography

## 📁 Project Structure

```
Forge/
├── App.js                      # Entry point with font loading
├── src/
│   ├── pages/
│   │   └── anvil.jsx           # Main dashboard/habit tracker
│   ├── components/
│   │   ├── HabitCard.jsx       # Individual habit tile
│   │   ├── HabitSheet.jsx      # Habit details modal
│   │   └── Calendar.jsx        # Interactive calendar view
│   └── assets/                 # Images and icons
├── package.json
└── README.md
```

## 📱 Usage

### Adding a Habit

1. Type your habit name in the input field at the top
2. Press "Add Habit" button
3. Your new habit appears in the list

### Tracking Completions

- Tap the checkbox on any habit card to mark it complete for today
- View your streak and total completions on the card

### Viewing History

1. Tap the expand button (→) on any habit card
2. View detailed stats and an interactive calendar
3. Tap any date to toggle completion (retroactive tracking)
4. Navigate between months with arrow buttons

### Deleting a Habit

- Long-press on any habit card to delete it

## ⚠️ Known Issues

- **Persistence**: Currently, data is stored in memory only. Closing the app will reset all habits. (MMKV storage integration coming soon)
- **New Habit Bug**: Newly added habits may cause an error when tracking. Fix in progress.

## 🔮 Roadmap

- [ ] Implement persistent storage with Zustand + MMKV
- [ ] Add haptic feedback for interactions
- [ ] Custom habit colors and icons
- [ ] Weekly/monthly statistics view
- [ ] Export habit data
- [ ] Reminder notifications
- [ ] Swipe gestures for quick actions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**GopikChenth**

- GitHub: [@GopikChenth](https://github.com/GopikChenth)

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Icons by [Lucide](https://lucide.dev/)
- Font: [Inter](https://fonts.google.com/specimen/Inter) by Rasmus Andersson

---

**Forge** - Build lasting habits, one day at a time. 🔥
