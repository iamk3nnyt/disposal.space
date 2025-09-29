import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";

export function useAuth() {
  const { getToken, isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user } = useUser();
  const [isTokenReady, setIsTokenReady] = useState(false);

  // Set the token globally for the API service
  useEffect(() => {
    const setGlobalToken = async () => {
      if (isLoaded && isSignedIn) {
        try {
          // Add a small delay to ensure Clerk is fully ready
          await new Promise((resolve) => setTimeout(resolve, 100));
          const token = await getToken();
          (global as any).__clerkToken = token;
          setIsTokenReady(true);
        } catch (error) {
          console.error("Failed to get auth token:", error);
          (global as any).__clerkToken = null;
          setIsTokenReady(false);
        }
      } else {
        (global as any).__clerkToken = null;
        setIsTokenReady(false);
      }
    };

    setGlobalToken();
  }, [isLoaded, isSignedIn, getToken]);

  return {
    isLoaded,
    isSignedIn,
    isTokenReady,
    user,
    signOut,
    getToken,
  };
}
