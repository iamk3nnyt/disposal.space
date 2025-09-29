import { Link } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Upload Files</ThemedText>
      <ThemedText style={styles.description}>
        File upload functionality will be implemented here
      </ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Close</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  description: {
    textAlign: "center",
    marginVertical: 20,
    opacity: 0.7,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
