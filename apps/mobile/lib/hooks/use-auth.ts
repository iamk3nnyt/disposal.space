import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { useEffect } from "react";

export function useAuth() {
  const { getToken, isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user } = useUser();

  // Set the token globally for the API service
  useEffect(() => {
    const setGlobalToken = async () => {
      if (isLoaded && isSignedIn) {
        try {
          const token = await getToken();
          (global as any).__clerkToken = token;
        } catch (error) {
          console.error("Failed to get auth token:", error);
          (global as any).__clerkToken = null;
        }
      } else {
        (global as any).__clerkToken = null;
      }
    };

    setGlobalToken();
  }, [isLoaded, isSignedIn, getToken]);

  return {
    isLoaded,
    isSignedIn,
    user,
    signOut,
    getToken,
  };
}
