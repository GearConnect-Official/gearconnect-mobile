import axios from "axios";
import { API_URL_AUTH } from "@/config";

// Types
export interface AuthResponse {
  token?: string;
  userId?: string;
  message?: string;
  success?: boolean;
  error?: string;
  details?: string;
  user?: {
    id: string | number;
    username?: string;
    name?: string;
    email: string;
    photoURL?: string;
    description?: string;
  };
}

// Axios configuration for endpoints that need a manual token
const api = axios.create({
  baseURL: API_URL_AUTH,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000, // 10 second timeout
});

/**
 * This service is a wrapper around the API calls to the authentication endpoints.
 * The actual session management is handled by the AuthContext.
 */

/**
 * Make a direct API call to the backend auth signup endpoint
 */
export const signUp = async (
  username: string,
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/signup", {
      username,
      email,
      password,
      name,
    });

    return {
      ...response.data,
      success: true,
    };
  } catch (error: any) {
    if (error.response) {
      const msg =
        error.response.data?.error ||
        error.response.data?.message;
      return {
        success: false,
        error: typeof msg === "string" && msg ? msg : "Registration failed. Please try again.",
      };
    }
    if (error.request) {
      return {
        success: false,
        error: "Unable to connect to the server. Please check your connection.",
      };
    }
    return {
      success: false,
      error: "Registration failed. Please try again.",
    };
  }
};

/**
 * Make a direct API call to the backend auth login endpoint
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/login", {
      email,
      password,
    });

    return {
      ...response.data,
      success: true,
    };
  } catch (error: any) {
    if (error.response) {
      const data = error.response.data;

      if (data?.error === "User not found in Clerk") {
        return {
          success: false,
          error: "Your account has been deleted or deactivated",
        };
      }

      const msg = data?.error || data?.message;
      if (typeof msg === "string" && msg) {
        return { success: false, error: msg };
      }

      if (error.response.status === 401) {
        return { success: false, error: "Incorrect password" };
      }
      if (error.response.status === 404) {
        return { success: false, error: "Account not found" };
      }
      if (error.response.status >= 500) {
        return { success: false, error: "A server error occurred. Please try again later." };
      }

      return { success: false, error: "Login failed. Please try again." };
    }
    if (error.request) {
      return {
        success: false,
        error: "Unable to connect to the server. Please check your connection.",
      };
    }
    return {
      success: false,
      error: "Login failed. Please try again.",
    };
  }
};

/**
 * Get current user info from the backend
 */
export const getUserInfo = async (token: string): Promise<any> => {
  try {
    const response = await api.get("/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Get User Info Error:", error);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);

      if (error.response.status === 404) {
        return {
          success: false,
          error: "Utilisateur non trouvé",
          details:
            error.response.data.details ||
            "L'utilisateur n'existe pas dans Clerk",
        };
      }

      return {
        success: false,
        error:
          error.response.data.error ||
          "Erreur lors de la récupération de l'utilisateur",
        details: error.response.data.details,
      };
    } else if (error.request) {
      return {
        success: false,
        error: "Impossible de contacter le serveur. Vérifiez votre connexion.",
      };
    } else {
      return {
        success: false,
        error: "Erreur lors de la configuration de la requête",
      };
    }
  }
};

/**
 * Delete user account (soft delete)
 * EXACTLY like signUp - uses api instance without interceptors
 * The account is marked as deleted in the database but ALL data is preserved
 */
export const deleteAccount = async (
  email: string
): Promise<AuthResponse> => {
  try {
    console.log("Tentative de suppression de compte pour:", { email });

    const response = await api.post<AuthResponse>("/delete", {
      email,
    });

    console.log("Réponse de suppression:", response.data);
    return {
      ...response.data,
      success: true,
    };
  } catch (error: any) {
    console.error("Delete Account Error:", error);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
      return {
        success: false,
        error: error.response.data.error || "Erreur lors de la suppression du compte",
      };
    } else if (error.request) {
      console.error("Request error:", error.request);
      return {
        success: false,
        error: "Impossible de contacter le serveur. Vérifiez votre connexion.",
      };
    } else {
      console.error("Error setting up request:", error.message);
      return {
        success: false,
        error: "Erreur lors de la configuration de la requête",
      };
    }
  }
};

export default {};
