import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
}

export function useAuth() {
  // Query to fetch the current user
  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      console.log("Fetching current user...");
      const result = await apiRequest<User | null>({
        url: "/api/auth/user",
        method: "GET",
        on401: "returnNull",
      });
      console.log("Current user result:", result);
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Function to log out
  const logout = useCallback(async () => {
    try {
      await apiRequest({
        url: "/api/auth/logout",
        method: "POST",
      });
      // Force a refetch to update the auth state
      refetch();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [refetch]);

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user,
    logout,
    refetch,
  };
}