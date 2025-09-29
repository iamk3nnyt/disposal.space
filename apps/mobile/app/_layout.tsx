import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/lib/clerk-provider";
import { QueryProvider } from "@/lib/query-client";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="sign-in"
                options={{
                  title: "Sign In",
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="sign-up"
                options={{
                  title: "Sign Up",
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="modal"
                options={{
                  presentation: "modal",
                  title: "Upload Files",
                  headerStyle: {
                    backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                  },
                }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </QueryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
