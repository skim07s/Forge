import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { useFonts } from "@expo-google-fonts/inter/useFonts";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { ThemeProvider, useTheme } from "./src/context/themeContext";
import { getThemeById, DEFAULT_THEME_ID } from "./src/utils/themes";
import Home from "./src/pages/home";

const defaultTheme = getThemeById(DEFAULT_THEME_ID);

function AppShell() {
  const { theme } = useTheme();

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(theme.surface);
      NavigationBar.setButtonStyleAsync("light");
    }
  }, [theme.surface]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={[styles.root, { backgroundColor: theme.background }]}>
        <Home />
        <StatusBar style="light" />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: defaultTheme.background }]}>
        <ActivityIndicator size="large" color={defaultTheme.accent} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
