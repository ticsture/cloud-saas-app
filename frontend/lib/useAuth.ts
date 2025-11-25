"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  userEmail: string | null;
  logout: () => void;
}

export default function useAuth(): AuthContextType {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authToken = localStorage.getItem("authToken");
      const email = localStorage.getItem("userEmail");
      
      if (authToken) {
        setIsAuthenticated(true);
        setToken(authToken);
        setUserEmail(email);
      } else {
        setIsAuthenticated(false);
        setToken(null);
        setUserEmail(null);
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userEmail");
    }
    setIsAuthenticated(false);
    setToken(null);
    setUserEmail(null);
    router.push("/");
  };

  return {
    isAuthenticated,
    isLoading,
    token,
    userEmail,
    logout,
  };
}