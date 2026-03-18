import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { useSignIn, useUser, useClerk } from "@clerk/clerk-expo";
import {
  signUp as authSignUp,
  signIn as authSignIn,
  getUserInfo,
} from "@/services/AuthService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackAuth } from "@/utils/mixpanelTracking";

// Define types for our context
interface User {
  id: string | number;
  username: string | null;
  name: string | null;
  email: string;
  photoURL?: string;
  description?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    username: string,
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Export the hook for using the context
export const useAuth = () => useContext(AuthContext);

// Constants for storage keys
const USER_STORAGE_KEY = '@user';
const AUTH_TOKEN_KEY = '@auth_token';
const SYNC_INTERVAL = 1000 * 60 * 60; // 1 heure en millisecondes

// The provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { signIn } = useSignIn();
  const { signOut } = useClerk();
  const clerk = useClerk();
  const { user: clerkUser, isLoaded: clerkIsLoaded } = useUser();

  // Fonction pour sauvegarder l'utilisateur dans le stockage local
  const saveUserToStorage = async (userData: User) => {
    try {
      const dataToSave = {
        user: userData,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('✅ Utilisateur sauvegardé dans le stockage local');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'utilisateur:', error);
    }
  };

  // Fonction pour récupérer l'utilisateur du stockage local
  const getUserFromStorage = async (): Promise<{ user: User | null, needsSync: boolean }> => {
    try {
      const userStr = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userStr) {
        const { user, timestamp } = JSON.parse(userStr);
        const needsSync = Date.now() - timestamp > SYNC_INTERVAL;
        console.log('✅ Utilisateur récupéré du stockage local', needsSync ? '(sync nécessaire)' : '(sync non nécessaire)');
        return { user, needsSync };
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
    }
    return { user: null, needsSync: true };
  };

  // Fonction pour effacer les données de l'utilisateur du stockage local
  const clearUserFromStorage = async () => {
    try {
      await AsyncStorage.multiRemove([USER_STORAGE_KEY, AUTH_TOKEN_KEY]);
      console.log('✅ Données utilisateur effacées du stockage local');
    } catch (error) {
      console.error('❌ Erreur lors de l\'effacement des données:', error);
    }
  };

  // Get current user details from backend
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      if (!clerkUser) return null;

      // Get the user's token from the active session
      let token;
      try {
        token = await clerk.session?.getToken();
      } catch (tokenError) {
        console.error("Error getting token:", tokenError);
        return null;
      }

      if (!token) {
        console.warn("No token available");
        return null;
      }

      try {
        // Get user details from backend
        const response = await getUserInfo(token);

        // Vérifier si la réponse indique un succès
        if (response.success === false) {
          console.warn("Erreur récupération utilisateur:", response.error);

          // Utiliser les données Clerk comme fallback
          if (clerkUser) {
            return {
              id: clerkUser.id,
              username: clerkUser.username || null,
              name: clerkUser.firstName || null,
              email: clerkUser.primaryEmailAddress?.emailAddress || "",
              photoURL: clerkUser.imageUrl || "",
            };
          }
          return null;
        }

        // Si c'est un succès ou si response.user existe
        if (response.user || response) {
          const userData = response.user || response;
          return {
            id: userData.id || clerkUser.id,
            username: userData.username || clerkUser.username || null,
            name: userData.name || clerkUser.firstName || null,
            email: userData.email || clerkUser.primaryEmailAddress?.emailAddress || "",
            photoURL: userData.imageUrl || userData.photoURL || clerkUser.imageUrl || "",
          };
        }
      } catch (apiError) {
        console.error("API Error getting user:", apiError);
        // Fall back to Clerk user data
        if (clerkUser) {
          return {
            id: clerkUser.id,
            username: clerkUser.username || null,
            name: clerkUser.firstName || null,
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            photoURL: clerkUser.imageUrl || "",
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Get Current User Error:", error);
      return null;
    }
  }, [clerkUser, clerk.session]);

  // Check user session on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted) return;

      try {
        setIsLoading(true);

        // First, try to get user from local storage
        const { user: storedUser, needsSync } = await getUserFromStorage();

        if (storedUser && mounted) {
          setUser(storedUser);
          setIsAuthenticated(true);
          console.log('✅ Session restaurée depuis le stockage local');

          // Si pas besoin de sync et pas de user Clerk, on peut s'arrêter là
          if (!needsSync && !clerkUser) {
            console.log('ℹ️ Pas de synchronisation nécessaire');
            setIsLoading(false);
            return;
          }
        }

        // Only sync with Clerk if needed
        if (mounted && clerkIsLoaded && (needsSync || !storedUser)) {
          if (clerkUser) {
            try {
              const userDetails = await getCurrentUser();
              if (userDetails && mounted) {
                const validUser: User = {
                  id: userDetails.id,
                  username: userDetails.username || null,
                  name: userDetails.name || null,
                  email: userDetails.email || '',
                  photoURL: userDetails.photoURL,
                  description: userDetails.description,
                };
                setUser(validUser);
                setIsAuthenticated(true);
                await saveUserToStorage(validUser);
                console.log('✅ Session Clerk synchronisée');
              } else if (mounted) {
                // Fallback to Clerk data if backend is not available
                const clerkUserData: User = {
                  id: clerkUser.id,
                  username: clerkUser.username || null,
                  name: clerkUser.firstName || null,
                  email: clerkUser.primaryEmailAddress?.emailAddress || '',
                  photoURL: clerkUser.imageUrl || undefined,
                  description: undefined,
                };
                setUser(clerkUserData);
                setIsAuthenticated(true);
                await saveUserToStorage(clerkUserData);
                console.log('⚠️ Utilisation des données Clerk par défaut');
              }
            } catch (error: any) {
              if (!mounted) return;

              console.error('❌ Erreur lors de la synchronisation:', error);
              if (error.message?.includes("user not found in Clerk")) {
                if (mounted) {
                  setUser(null);
                  setIsAuthenticated(false);
                  await clearUserFromStorage();
                }
                return;
              }
              // Keep stored user if sync fails
              if (storedUser && mounted) {
                setUser(storedUser);
                setIsAuthenticated(true);
              }
            }
          } else if (!storedUser && mounted) {
            // No Clerk user and no stored user, clear everything
            setIsAuthenticated(false);
            await clearUserFromStorage();
          }
        }
      } catch (error) {
        if (!mounted) return;
        console.error('❌ Erreur d\'initialisation auth:', error);
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [clerkUser, clerkIsLoaded, getCurrentUser]);

  // Register a new user
  const register = async (
    username: string,
    email: string,
    password: string,
    name: string
  ) => {
    try {
      setIsLoading(true);

      // Front-end validation
      if (!username || username.length < 3) {
        return {
          success: false,
          error: "Username must be at least 3 characters long",
        };
      }

      if (!name) {
        return {
          success: false,
          error: "Name is required",
        };
      }

      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return {
          success: false,
          error: "Please provide a valid email address",
        };
      }

      if (!password || password.length < 8) {
        return {
          success: false,
          error: "Password must be at least 8 characters long",
        };
      }

      // Check for strong password (at least one uppercase, one lowercase, one number)
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
      if (!passwordRegex.test(password)) {
        return {
          success: false,
          error:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        };
      }

      const backendResponse = await authSignUp(username, email, password, name);

      if (!backendResponse.success) {
        return {
          success: false,
          error: backendResponse.error || "Registration failed. Please try again.",
        };
      }

      if (backendResponse.user) {
        const userObj = {
          id: String(backendResponse.user.id),
          username: backendResponse.user.username || "",
          name: backendResponse.user.name || "",
          email: backendResponse.user.email,
          photoURL: backendResponse.user.photoURL || "",
        };
        setUser(userObj);
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message;
      if (typeof msg === "string" && msg) {
        return { success: false, error: msg };
      }
      if (typeof error?.message === "string" && !/^Request failed|^Network Error|status code/i.test(error.message)) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Login a user
  const login = async (email: string, password: string) => {
    if (!signIn) {
      throw new Error("Clerk signIn is not initialized");
    }

    try {
      setIsLoading(true);

      // Backend authentication
      const backendResponse = await authSignIn(email, password);

      if (!backendResponse.success) {
        return {
          success: false,
          error: backendResponse.error || "Erreur lors de la connexion",
        };
      }

      // Clerk authentication
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        const userDetails = backendResponse.user || await getCurrentUser();
        if (userDetails) {
          const validUser: User = {
            id: userDetails.id,
            username: userDetails.username || null,
            name: userDetails.name || null,
            email: userDetails.email || '',
            photoURL: userDetails.photoURL,
            description: userDetails.description,
          };
          setUser(validUser);
          setIsAuthenticated(true);
          await saveUserToStorage(validUser);
        }
        return { success: true };
      }
      return {
        success: false,
        error: "Login could not be completed. Please try again.",
      };
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message;
      if (typeof msg === "string" && msg) {
        return { success: false, error: msg };
      }
      if (typeof error?.message === "string" && !/^Request failed|^Network Error|status code/i.test(error.message)) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: "Login failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout the user
  const logout = async () => {
    try {
      setIsLoading(true);
      trackAuth.logout();
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      await clearUserFromStorage();
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        getCurrentUser,
        signIn: login,
        signOut: logout,
        updateUser: (userData) => {
          if (user) {
            const updatedUser = { ...user, ...userData };
            setUser(updatedUser);
            saveUserToStorage(updatedUser);
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
