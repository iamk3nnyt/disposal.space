import { FileList } from "@/components/file-list";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/lib/hooks/use-auth";
import { FileItem } from "@/lib/types";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper function to get user initials
function getUserInitials(user: any): string {
  if (!user) return "DS";

  const firstName = user.firstName || "";
  const lastName = user.lastName || "";

  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  } else if (firstName) {
    return firstName.charAt(0).toUpperCase();
  } else if (user.fullName) {
    const nameParts = user.fullName.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
    }
    return nameParts[0].charAt(0).toUpperCase();
  } else if (user.emailAddresses?.[0]?.emailAddress) {
    return user.emailAddresses[0].emailAddress.charAt(0).toUpperCase();
  }

  return "DS";
}

// Helper function to get user display name
function getUserDisplayName(user: any): string {
  if (!user) return "Disposal Space";

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  } else if (user.fullName) {
    return user.fullName;
  } else if (user.firstName) {
    return user.firstName;
  }

  return "Disposal Space";
}

// Helper function to get user email
function getUserEmail(user: any): string {
  if (!user) return "Hidden Archive";

  return user.emailAddresses?.[0]?.emailAddress || "Hidden Archive";
}

export default function HomeScreen() {
  const { isLoaded, isSignedIn, isTokenReady, user } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in" as any);
    }
  }, [isLoaded, isSignedIn]);

  const handleItemPress = (item: FileItem) => {
    if (item.isFolder) {
      // TODO: Navigate to folder view
      Alert.alert("Folder Navigation", `Navigate to folder: ${item.name}`);
    } else {
      // TODO: Show file preview/actions
      Alert.alert("File Actions", `File: ${item.name}\nSize: ${item.size}`);
    }
  };

  const handleRefresh = () => {
    console.log("Refreshing file list...");
  };

  if (!isLoaded || !isTokenReady) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <ThemedText style={styles.loadingText}>
          {!isLoaded ? "Loading..." : "Preparing your disposal space..."}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!isSignedIn) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <ThemedText style={styles.loadingText}>Redirecting...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <View style={styles.brandIcon}>
              <ThemedText style={styles.brandIconText}>
                {getUserInitials(user)}
              </ThemedText>
            </View>
            <View>
              <ThemedText style={styles.brandTitle}>
                {getUserDisplayName(user)}
              </ThemedText>
              <ThemedText style={styles.brandSubtitle}>
                {getUserEmail(user)}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
      <FileList
        parentId={null} // Root level items
        onItemPress={handleItemPress}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    width: 32,
    height: 32,
    backgroundColor: "#16a34a",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  brandIconText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    lineHeight: 16,
  },
  brandSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 14,
    marginTop: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
});
