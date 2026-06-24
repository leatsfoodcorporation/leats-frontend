export interface Address {
  id: string;
  label: string; // "Home", "Office", "Other"
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district?: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'employee';
  isVerified: boolean;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  image?: string;

  // Employee-specific fields
  employeeId?: string;
  permissions?: { module: string; actions: string[] }[];
  roleName?: string;
  
  // Additional profile fields (available for both admin and user)
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  dateOfBirth?: string;
  
  // Multiple addresses support
  addresses?: Address[];
  
  // Admin-specific fields
  currency?: string; // Currency code (e.g., 'USD', 'EUR', 'INR')
  companyName?: string; // Company/Business name
  gstNumber?: string; // GST/Tax identification number
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface GoogleAuthData {
  googleId: string;
  email: string;
  name: string;
}