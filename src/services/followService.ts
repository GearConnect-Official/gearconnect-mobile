import axios from "axios";
import { API_URL_USERS } from "@/config";
import {
  FollowersResponse,
  FollowingResponse,
  FollowActionResponse,
  FollowStats,
} from "@/types/follow.types";

// Temporary test configuration
const TEST_TOKEN = 'test_mock_token_follow_2024';

const getTestAuthHeaders = () => ({
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
});

const followService = {
  getFollowers: async (userId: number): Promise<FollowersResponse> => {
    try {
      const followersIdsResponse = await axios.get(`${API_URL_USERS}/${userId}/followers`);
      const followerIds = followersIdsResponse.data || [];

      if (followerIds.length === 0) {
        return {
          success: true,
          data: {
            followers: [],
            totalCount: 0,
          },
        };
      }

      const followersDetails = await Promise.all(
        followerIds.map(async (followerId: number) => {
          try {
            const userResponse = await axios.get(`${API_URL_USERS}/${followerId}`);
            const user = userResponse.data;

            return {
              id: user.id,
              username: user.username,
              name: user.name,
              profilePicture: user.profilePicture,
              profilePicturePublicId: user.profilePicturePublicId,
              isFollowing: false,
            };
          } catch (error) {
            console.warn(`Could not fetch details for user ${followerId}:`, error);
            return null;
          }
        })
      );

      const validFollowers = followersDetails.filter(user => user !== null);

      return {
        success: true,
        data: {
          followers: validFollowers,
          totalCount: validFollowers.length,
        },
      };
    } catch (error: any) {
      console.error("❌ followService: Error fetching followers:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch followers",
      };
    }
  },

  getFollowing: async (userId: number): Promise<FollowingResponse> => {
    try {
      const followingIdsResponse = await axios.get(`${API_URL_USERS}/${userId}/follows`);
      const followingIds = followingIdsResponse.data || [];

      if (followingIds.length === 0) {
        return {
          success: true,
          data: {
            following: [],
            totalCount: 0,
          },
        };
      }

      const followingDetails = await Promise.all(
        followingIds.map(async (followingId: number) => {
          try {
            const userResponse = await axios.get(`${API_URL_USERS}/${followingId}`);
            const user = userResponse.data;

            return {
              id: user.id,
              username: user.username,
              name: user.name,
              profilePicture: user.profilePicture,
              profilePicturePublicId: user.profilePicturePublicId,
              isFollowing: true,
            };
          } catch (error) {
            console.warn(`Could not fetch details for user ${followingId}:`, error);
            return null;
          }
        })
      );

      const validFollowing = followingDetails.filter(user => user !== null);

      return {
        success: true,
        data: {
          following: validFollowing,
          totalCount: validFollowing.length,
        },
      };
    } catch (error: any) {
      console.error("❌ followService: Error fetching following:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch following",
      };
    }
  },

  followUser: async (targetUserId: number, currentUserId: number): Promise<FollowActionResponse> => {
    try {
      if (!currentUserId) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      console.log('🧪 Using test follow route with mock token');
      const response = await axios.post(`${API_URL_USERS}/test/follow`, {
        followerId: currentUserId,
        followingId: targetUserId,
      }, {
        headers: getTestAuthHeaders()
      });

      return {
        success: true,
        data: {
          isFollowing: true,
          followersCount: response.data.followersCount || 0,
          followingCount: response.data.followingCount || 0,
        },
        message: "User followed successfully",
      };
    } catch (error: any) {
      console.error("Error following user:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to follow user",
      };
    }
  },

  unfollowUser: async (targetUserId: number, currentUserId: number): Promise<FollowActionResponse> => {
    try {
      if (!currentUserId) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      console.log('🧪 Using test unfollow route with mock token');
      const response = await axios.post(`${API_URL_USERS}/test/unfollow`, {
        followerId: currentUserId,
        followingId: targetUserId,
      }, {
        headers: getTestAuthHeaders()
      });

      return {
        success: true,
        data: {
          isFollowing: false,
          followersCount: response.data.followersCount || 0,
          followingCount: response.data.followingCount || 0,
        },
        message: "User unfollowed successfully",
      };
    } catch (error: any) {
      console.error("Error unfollowing user:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to unfollow user",
      };
    }
  },

  getFollowStats: async (userId: number, currentUserId?: number): Promise<{ success: boolean; data?: FollowStats; error?: string }> => {
    try {
      const [followersResponse, followingResponse] = await Promise.all([
        axios.get(`${API_URL_USERS}/${userId}/followers`),
        axios.get(`${API_URL_USERS}/${userId}/follows`),
      ]);

      let isFollowing = false;
      let isFollowedBy = false;

      if (currentUserId && currentUserId !== userId) {
        try {
          const currentUserFollowingResponse = await axios.get(`${API_URL_USERS}/${currentUserId}/follows`);
          const followingIds = currentUserFollowingResponse.data || [];
          isFollowing = followingIds.includes(userId);
        } catch (error) {
          console.warn("Could not check following status:", error);
        }

        const userFollowingIds = followingResponse.data || [];
        isFollowedBy = userFollowingIds.includes(currentUserId);
      }

      return {
        success: true,
        data: {
          followersCount: followersResponse.data?.length || 0,
          followingCount: followingResponse.data?.length || 0,
          isFollowing,
          isFollowedBy,
        },
      };
    } catch (error: any) {
      console.error("❌ followService: Error fetching follow stats:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch follow stats",
      };
    }
  },

  checkIfFollowing: async (targetUserId: number): Promise<{ success: boolean; data?: { isFollowing: boolean }; error?: string }> => {
    try {
      return {
        success: true,
        data: {
          isFollowing: false,
        },
      };
    } catch (error: any) {
      console.error("Error checking follow status:", error);
      return {
        success: false,
        error: "Failed to check follow status - method needs current user ID",
      };
    }
  },

  searchUsers: async (query: string, limit: number = 10, page: number = 1): Promise<{
    success: boolean;
    data?: {
      users: Array<{
        id: number;
        username: string;
        name?: string;
        profilePicture?: string;
        profilePicturePublicId?: string;
        isVerify: boolean;
      }>;
      pagination: {
        totalCount: number;
        currentPage: number;
        totalPages: number;
        hasMore: boolean;
      };
    };
    error?: string;
  }> => {
    try {
      const response = await axios.get(`${API_URL_USERS}/search`, {
        params: { query, limit, page },
      });

      if (response.data.success) {
        return {
          success: true,
          data: {
            users: response.data.users || [],
            pagination: response.data.pagination || {
              totalCount: 0,
              currentPage: 1,
              totalPages: 0,
              hasMore: false,
            },
          },
        };
      } else {
        return {
          success: false,
          error: response.data.error || "Failed to search users",
        };
      }
    } catch (error: any) {
      console.error("Error searching users:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to search users",
      };
    }
  },

  checkFollowingStatus: async (userIds: number[], currentUserId: number): Promise<{ success: boolean; data?: number[]; error?: string }> => {
    try {
      if (!currentUserId || userIds.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      const followingResponse = await axios.get(`${API_URL_USERS}/${currentUserId}/follows`);
      const followingIds = followingResponse.data || [];
      const followedUsers = userIds.filter(userId => followingIds.includes(userId));

      return {
        success: true,
        data: followedUsers,
      };
    } catch (error: any) {
      console.error("Error checking following status:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.response?.data?.error || "Failed to check following status",
      };
    }
  },
};

export default followService;
