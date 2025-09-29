import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUserStorage } from "@/lib/hooks/use-user-storage";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { data: storageData, isLoading: isLoadingStorage } = useUserStorage();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/sign-in" as any);
          } catch (error) {
            console.error("Sign out error:", error);
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };

  const typedStorage = storageData as any;

  const settingsItems = [
    {
      title: "Storage",
      items: [
        {
          label: "Storage Usage",
          value: isLoadingStorage
            ? "Loading..."
            : `${Math.round(typedStorage?.usagePercentage || 0)}% used`,
          description: isLoadingStorage
            ? "Loading storage information..."
            : `${typedStorage?.storageUsedFormatted || "0 Bytes"} of ${typedStorage?.storageLimitFormatted || "15 GB"} used`,
          onPress: () =>
            Alert.alert("Storage", "Storage management coming soon"),
        },
        {
          label: "Storage Details",
          value: isLoadingStorage
            ? "..."
            : `${typedStorage?.storageLimitFormatted || "15 GB"} available`,
          description: isLoadingStorage
            ? "Loading item statistics..."
            : `${typedStorage?.itemCount || 0} total items (${typedStorage?.fileCount || 0} files, ${typedStorage?.folderCount || 0} folders)`,
          onPress: () =>
            Alert.alert("Details", "Detailed storage analytics coming soon"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Help & Support",
          value: "Get help",
          onPress: () =>
            Alert.alert("Support", "Help documentation coming soon"),
        },
        {
          label: "Privacy Policy",
          value: "View policy",
          onPress: () => Alert.alert("Privacy", "Privacy policy coming soon"),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Settings
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Monitor storage usage and manage account settings
          </ThemedText>
        </View>

        {settingsItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingItemContent}>
                    <View style={styles.settingLeft}>
                      <ThemedText style={styles.settingLabel}>
                        {item.label}
                      </ThemedText>
                      {(item as any).description && (
                        <ThemedText style={styles.settingDescription}>
                          {(item as any).description}
                        </ThemedText>
                      )}
                    </View>
                    <ThemedText style={styles.settingValue}>
                      {item.value}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    marginHorizontal: 24,
  },
  sectionContent: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  settingLeft: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.6,
    lineHeight: 18,
  },
  settingValue: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "right",
    fontWeight: "500",
    minWidth: 80,
  },
  signOutButton: {
    backgroundColor: "#dc2626",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
