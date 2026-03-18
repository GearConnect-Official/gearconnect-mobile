import axios from "axios";
import { API_URL_USERS } from "@/config";

// Types
export interface UserProfile {
  id: number;
  username?: string;
  name?: string;
  description?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  isVerify?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  message?: string;
}

export interface UpdateUserProfileData {
  username?: string;
  name?: string;
  description?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

const userService = {
  getProfile: async (userId: number): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await axios.get(`${API_URL_USERS}/${userId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch profile",
      };
    }
  },

  updateProfile: async (
    userId: number,
    userData: UpdateUserProfileData
  ): Promise<ApiResponse<UserProfile>> => {
    try {
      console.log(
        "Updating profile with data:",
        JSON.stringify(userData, null, 2)
      );

      const response = await axios.put(`${API_URL_USERS}/${userId}`, userData);
      console.log("Update response:", response.status);

      return {
        success: true,
        data: response.data,
        message: "Profile updated successfully",
      };
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update profile",
      };
    }
  },

  uploadProfilePicture: async (
    userId: number,
    imageUri: string
  ): Promise<ApiResponse<{ profilePicture: string }>> => {
    try {
      const extractFilename = (uri: string): string => {
        if (!uri) return "";
        const parts = uri.split("/");
        return parts[parts.length - 1];
      };

      const formData = new FormData();
      formData.append("profilePicture", {
        uri: imageUri,
        type: "image/jpeg",
        name: extractFilename(imageUri) || "profile-picture.jpg",
      } as any);

      console.log("Uploading profile picture...");

      const response = await axios.post(
        `${API_URL_USERS}/${userId}/profile-picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload response:", response.status);

      return {
        success: true,
        data: response.data,
        message: "Profile picture uploaded successfully",
      };
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to upload profile picture",
      };
    }
  },

  updateProfilePictureCloudinary: async (
    userId: number,
    cloudinaryUrl: string,
    publicId: string
  ): Promise<ApiResponse<UserProfile>> => {
    try {
      console.log("Updating profile picture with Cloudinary data:", {
        cloudinaryUrl,
        publicId,
        userId
      });

      const updateData: UpdateUserProfileData = {
        profilePicture: cloudinaryUrl,
        profilePicturePublicId: publicId,
      };

      const response = await userService.updateProfile(userId, updateData);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: "Profile picture updated successfully with Cloudinary",
        };
      } else {
        return response;
      }
    } catch (error: any) {
      console.error("Error updating profile picture with Cloudinary:", error);
      return {
        success: false,
        error: error.message || "Failed to update profile picture",
      };
    }
  },

  getJoinedEvents: async (
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<{
    events: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>> => {
    try {
      const response = await axios.get(
        `${API_URL_USERS}/${userId}/joined-events`,
        {
          params: { page, limit },
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error("Error fetching joined events:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch joined events",
      };
    }
  },

  getNextEventTag: async (userId: number): Promise<ApiResponse<{
    event: {
      id: number;
      name: string;
      date: string;
    } | null;
    tag: {
      text: string;
      color: string;
      isOrganizer?: boolean;
    } | null;
  }>> => {
    try {
      const response = await axios.get(
        `${API_URL_USERS}/${userId}/next-event-tag`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error("Error fetching next event tag:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch next event tag",
      };
    }
  },
};

export default userService;
