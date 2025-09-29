import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/lib/clerk-provider";
import { QueryProvider } from "@/lib/query-client";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryProvider>
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
                  backgroundColor: "#fff",
                },
              }}
            />
            <Stack.Screen
              name="file-actions"
              options={{
                presentation: "modal",
                title: "File Actions",
                headerStyle: {
                  backgroundColor: "#fff",
                },
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </QueryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
