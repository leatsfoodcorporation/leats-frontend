"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { useAuthContext } from "@/components/providers/auth-provider";

export const DebugLogin = () => {
  const [email, setEmail] = useState("manoj@mntfuture.com");
  const [password, setPassword] = useState("Admin@123");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthContext();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      console.log("🔐 Attempting login...");
      const response = await axiosInstance.post("/api/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        console.log("✅ Login successful:", response.data);
        const { token, user } = response.data.data;
        
        // Use the auth context login method
        login(token, user);
        
        toast.success("Login successful!");
      }
    } catch (error: any) {
      console.error("❌ Login failed:", error);
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthState = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    console.log("🔍 Current Auth State:");
    console.log("- Token exists:", !!token);
    console.log("- User exists:", !!user);
    
    if (token) {
      console.log("- Token preview:", token.substring(0, 50) + "...");
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("- Token payload:", payload);
        console.log("- Token expires:", new Date(payload.exp * 1000));
        console.log("- Token is expired:", payload.exp <= Date.now() / 1000);
      } catch (e) {
        console.log("- Token parse error:", e);
      }
    }
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log("- User data:", userData);
      } catch (e) {
        console.log("- User parse error:", e);
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Debug Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleLogin} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          <Button 
            onClick={checkAuthState} 
            variant="outline"
          >
            Check Auth
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};