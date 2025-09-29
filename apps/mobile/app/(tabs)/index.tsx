import { FileList } from "@/components/file-list";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/lib/hooks/use-auth";
import { FileItem } from "@/lib/types";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
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
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(
    null
  );
  const [folderPath, setFolderPath] = React.useState<
    Array<{ id: string | null; name: string }>
  >([{ id: null, name: "Disposal Space" }]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in" as any);
    }
  }, [isLoaded, isSignedIn]);

  const handleItemPress = (item: FileItem) => {
    if (item.isFolder) {
      // Navigate into folder
      setCurrentFolderId(item.id);
      setFolderPath((prev) => [...prev, { id: item.id, name: item.name }]);
    } else {
      // TODO: Show file preview/actions
      Alert.alert("File Actions", `File: ${item.name}\nSize: ${item.size}`);
    }
  };

  const handleBreadcrumbPress = (targetIndex: number) => {
    const targetFolder = folderPath[targetIndex];
    setCurrentFolderId(targetFolder.id);
    setFolderPath((prev) => prev.slice(0, targetIndex + 1));
  };

  const handleRefresh = () => {
    console.log("Refreshing file list...");
  };

  const handleUploadPress = () => {
    router.push("/modal");
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
        {folderPath.length > 1 && (
          <View style={styles.breadcrumbContainer}>
            <View style={styles.breadcrumbs}>
              {folderPath.map((folder, index) => (
                <React.Fragment key={folder.id || "root"}>
                  <TouchableOpacity
                    onPress={() => handleBreadcrumbPress(index)}
                    style={styles.breadcrumbItem}
                  >
                    <ThemedText
                      style={[
                        styles.breadcrumbText,
                        index === folderPath.length - 1 &&
                          styles.breadcrumbActive,
                      ]}
                    >
                      {folder.name}
                    </ThemedText>
                  </TouchableOpacity>
                  {index < folderPath.length - 1 && (
                    <ThemedText style={styles.breadcrumbSeparator}>
                      ›
                    </ThemedText>
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}
      </View>
      <FileList
        parentId={currentFolderId}
        onItemPress={handleItemPress}
        onRefresh={handleRefresh}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleUploadPress}
        activeOpacity={0.8}
      >
        <IconSymbol name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>
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
  breadcrumbContainer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  breadcrumbs: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  breadcrumbItem: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  breadcrumbText: {
    fontSize: 14,
    color: "#6b7280",
  },
  breadcrumbActive: {
    color: "#111827",
    fontWeight: "500",
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: "#9ca3af",
    marginHorizontal: 8,
  },
  fab: {
    position: "absolute",
    bottom: 30, // Closer to tab navigation
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
