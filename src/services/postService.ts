import axios from "axios";
import { API_URL_POSTS, API_URL_TAGS, API_URL_INTERACTIONS } from "@/config";

// Utility function to display request details
const logRequestDetails = (endpoint: string, method: string, data?: any) => {
  console.log(`\n====== API REQUEST DETAILS ======`);
  console.log(`URL: ${endpoint}`);
  console.log(`Method: ${method}`);
  if (data) {
    console.log(`Data sent:`);
    console.log(JSON.stringify(data, null, 2));
  }
  console.log(`======================================\n`);
};

export interface PostTag {
  id?: string;
  name: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email?: string;
  imageUrl?: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface PostTagRelation {
  id: number;
  tag: Tag;
}

export interface Image {
  id: number;
  image: string;
}

export interface Interaction {
  postId: number;
  userId: number;
  like: boolean;
  share: boolean;
  comment?: string | null;
  createdAt: Date;
  user?: User;
}

export interface Comment {
  id: string;
  postId: number;
  userId: number;
  content: string;
  createdAt: Date;
  user?: User;
}

export interface Post {
  id?: number;
  title: string;
  body: string;
  userId: number;
  imageId?: number;
  image?: Image;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  imageMetadata?: string;
  user?: User;
  tags?: PostTagRelation[];
  interactions?: Interaction[];
  createdAt?: Date;
}

export interface InteractionInput {
  type: "like" | "comment" | "share";
  userId: number;
  content?: string;
}

const postService = {
  getAllPosts: async (userId?: number) => {
    const endpoint = `${API_URL_POSTS}`;
    const params = userId ? { userId } : {};
    logRequestDetails(endpoint, "GET", params);
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.log("⚠️ To implement this route on the backend: GET /api/posts");
      throw error;
    }
  },

  getPosts: async (page: number = 1, limit: number = 10, userId?: number) => {
    const endpoint = `${API_URL_POSTS}`;
    const params: any = { page, limit };
    if (userId) {
      params.userId = userId;
    }
    logRequestDetails(endpoint, "GET", params);
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.log("⚠️ To implement this route on the backend: GET /api/posts");
      throw error;
    }
  },

  getFollowedPosts: async (
    userId: number,
    page: number = 1,
    limit: number = 10
  ) => {
    const endpoint = `${API_URL_POSTS}/followed/${userId}`;
    const params = { page, limit };
    logRequestDetails(endpoint, "GET", params);
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.log(
        "⚠️ To implement this route on the backend: GET /api/posts/followed/:userId"
      );
      throw error;
    }
  },

  getPostById: async (id: number, userId?: number) => {
    const endpoint = `${API_URL_POSTS}/${id}`;
    const params = userId ? { userId } : {};
    logRequestDetails(endpoint, "GET", params);
    try {
      const response = await axios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.log(
        `⚠️ To implement this route on the backend: GET /api/posts/${id}`
      );
      throw error;
    }
  },

  createPost: async (postData: Post) => {
    const endpoint = `${API_URL_POSTS}`;
    logRequestDetails(endpoint, "POST", postData);
    try {
      const formattedPostData = {
        title: postData.title,
        body: postData.body,
        userId: postData.userId,
        ...(postData.imageId ? { imageId: postData.imageId } : {}),
        ...(postData.cloudinaryUrl
          ? {
              cloudinaryUrl: postData.cloudinaryUrl,
              cloudinaryPublicId: postData.cloudinaryPublicId,
              imageMetadata: postData.imageMetadata,
            }
          : {}),
      };

      const response = await axios.post(endpoint, formattedPostData);
      return response.data;
    } catch (error) {
      console.error("Error creating post:", error);
      console.log("⚠️ To implement this route on the backend: POST /api/posts");
      console.log("Expected structure in the body:", {
        title: "string (required)",
        body: "string (required)",
        userId: "number (required)",
        imageId: "number (optional)",
        cloudinaryUrl: "string (optional)",
        cloudinaryPublicId: "string (optional)",
        imageMetadata: "string (optional, JSON)",
      });
      throw error;
    }
  },

  updatePost: async (id: number, postData: Partial<Post>) => {
    const endpoint = `${API_URL_POSTS}/${id}`;
    logRequestDetails(endpoint, "PATCH", postData);
    try {
      const response = await axios.patch(endpoint, postData);
      return response.data;
    } catch (error) {
      console.error("Error updating post:", error);
      console.log(
        `⚠️ To implement this route on the backend: PATCH /api/posts/${id}`
      );
      console.log("Expected structure in the body (all fields are optional):", {
        title: "string",
        body: "string",
        imageId: "number",
        image: "string base64",
      });
      throw error;
    }
  },

  deletePost: async (id: number) => {
    const endpoint = `${API_URL_POSTS}/${id}`;
    logRequestDetails(endpoint, "DELETE");
    try {
      const response = await axios.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error("Error deleting post:", error);
      console.log(
        `⚠️ To implement this route on the backend: DELETE /api/posts/${id}`
      );
      throw error;
    }
  },

  addInteraction: async (postId: number, interaction: InteractionInput) => {
    const endpoint = `${API_URL_INTERACTIONS}`;
    const interactionData = {
      postId,
      userId: interaction.userId,
      like: interaction.type === "like",
      share: interaction.type === "share",
      comment: interaction.type === "comment" ? interaction.content : null,
    };
    logRequestDetails(endpoint, "POST", interactionData);
    try {
      const response = await axios.post(endpoint, interactionData);
      return response.data;
    } catch (error: any) {
      console.error("Error adding interaction:", error);
      console.log(
        `⚠️ To implement this route on the backend: POST /api/interactions`
      );
      console.log("Expected structure in the body:", {
        postId: "number",
        userId: "number",
        like: "boolean",
        share: "boolean",
        comment: "string | null",
      });
      throw error;
    }
  },

  toggleLike: async (postId: number, userId: number) => {
    const endpoint = `${API_URL_INTERACTIONS}/toggle-like`;
    const interactionData = {
      postId,
      userId,
    };
    logRequestDetails(endpoint, "POST", interactionData);
    try {
      const response = await axios.post(endpoint, interactionData);
      return response.data;
    } catch (error: any) {
      console.error("Error toggling like:", error);
      throw error;
    }
  },

  addComment: async (postId: number, userId: number, comment: string) => {
    const endpoint = `${API_URL_INTERACTIONS}`;
    const interactionData = {
      postId,
      userId,
      comment,
      like: false,
      share: false,
    };
    logRequestDetails(endpoint, "PATCH", interactionData);
    try {
      const response = await axios.patch(endpoint, interactionData);
      return response.data;
    } catch (error: any) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  editComment: async (postId: number, userId: number, comment: string) => {
    const endpoint = `${API_URL_INTERACTIONS}`;
    const interactionData = {
      postId,
      userId,
      comment,
    };
    logRequestDetails(endpoint, "PATCH", interactionData);
    try {
      const response = await axios.patch(endpoint, interactionData);
      return response.data;
    } catch (error: any) {
      console.error("Error editing comment:", error);
      throw error;
    }
  },

  deleteComment: async (postId: number, userId: number) => {
    const endpoint = `${API_URL_INTERACTIONS}`;
    const interactionData = {
      postId,
      userId,
      comment: null,
    };
    logRequestDetails(endpoint, "PATCH", interactionData);
    try {
      const response = await axios.patch(endpoint, interactionData);
      return response.data;
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  },

  getComments: async (postId: number, page: number = 1, limit: number = 10) => {
    const endpoint = `${API_URL_INTERACTIONS}/post/${postId}?page=${page}&limit=${limit}`;
    logRequestDetails(endpoint, "GET");
    try {
      const response = await axios.get(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  sharePost: async (postId: number, userId: number) => {
    const endpoint = `${API_URL_INTERACTIONS}`;
    const interactionData = {
      postId,
      userId,
      share: true,
    };
    logRequestDetails(endpoint, "POST", interactionData);
    try {
      const response = await axios.post(endpoint, interactionData);
      return response.data;
    } catch (error: any) {
      console.error("Error sharing post:", error);
      throw error;
    }
  },

  updateInteraction: async (postId: number, interaction: InteractionInput) => {
    const endpoint = `${API_URL_INTERACTIONS}`;
    const interactionData = {
      postId,
      userId: interaction.userId,
      like: interaction.type === "like",
      share: interaction.type === "share",
      comment: interaction.type === "comment" ? interaction.content : null,
    };
    logRequestDetails(endpoint, "PATCH", interactionData);
    try {
      const response = await axios.patch(endpoint, interactionData);
      console.log("Interaction mise à jour avec succès:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating interaction:", error);
      console.log(
        `⚠️ To implement this route on the backend: PATCH /api/interactions`
      );
      console.log("Expected structure in the body:", {
        postId: "number",
        userId: "number",
        like: "boolean",
        share: "boolean",
        comment: "string | null",
      });
      throw error;
    }
  },

  getPostInteractions: async (postId: number) => {
    const endpoint = `${API_URL_INTERACTIONS}/post/${postId}`;
    logRequestDetails(endpoint, "GET");
    try {
      const response = await axios.get(endpoint);
      return response.data;
    } catch (error) {
      console.log(
        `⚠️ To implement this route on the backend: GET /api/interactions/post/${postId}`
      );
      throw error;
    }
  },

  getOrCreateTagByName: async (tagName: string) => {
    try {
      console.log(`Recherche du tag "${tagName}"...`);

      const tagsEndpoint = `${API_URL_TAGS}`;
      logRequestDetails(tagsEndpoint, "GET");

      let existingTag = null;

      try {
        const tagsResponse = await axios.get(tagsEndpoint);
        existingTag = tagsResponse.data.find(
          (tag: { name: string; id: number }) =>
            tag.name.toLowerCase() === tagName.toLowerCase()
        );

        if (existingTag) {
          console.log(
            `Tag existant trouvé: "${existingTag.name}" (ID: ${existingTag.id})`
          );
          return existingTag;
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des tags:", error);
      }

      if (!existingTag) {
        console.log(
          `Aucun tag existant trouvé pour "${tagName}", création d'un nouveau tag...`
        );

        const createEndpoint = `${API_URL_TAGS}`;
        logRequestDetails(createEndpoint, "POST", { name: tagName });

        const createResponse = await axios.post(createEndpoint, {
          name: tagName,
        });
        console.log(
          `Nouveau tag créé: "${tagName}" (ID: ${createResponse.data.id})`
        );
        return createResponse.data;
      }
    } catch (error) {
      console.error(
        `Erreur dans getOrCreateTagByName pour "${tagName}":`,
        error
      );
      throw error;
    }
  },

  addTagToPost: async (postId: number, tagId: number) => {
    const endpoint = `${API_URL_POSTS}/${postId}/tags/${tagId}`;
    logRequestDetails(endpoint, "POST");
    try {
      const response = await axios.post(endpoint);
      console.log(
        `Tag (ID: ${tagId}) associé avec succès au post (ID: ${postId})`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de l'association du tag (ID: ${tagId}) au post (ID: ${postId}):`,
        error
      );
      throw error;
    }
  },

  createPostWithTags: async (postData: Post, tagNames: string[]) => {
    try {
      console.log("Creating post with data:", postData);
      console.log("With tags:", tagNames);

      const post = await postService.createPost(postData);

      if (!post || !post.id) {
        throw new Error("Failed to create post or post ID is missing");
      }

      if (tagNames && tagNames.length > 0) {
        console.log("Post created successfully, now adding tags");
        for (const tagName of tagNames) {
          try {
            const tag = await postService.getOrCreateTagByName(tagName);

            if (!tag || !tag.id) {
              console.warn(
                `Impossible de créer/trouver le tag "${tagName}", ignorer`
              );
              continue;
            }

            await postService.addTagToPost(post.id, tag.id);
            console.log(`Added tag "${tagName}" to post ${post.id}`);
          } catch (error) {
            console.error(`Failed to process tag "${tagName}":`, error);
          }
        }
      }

      return post;
    } catch (error) {
      console.error("Error in createPostWithTags:", error);
      throw error;
    }
  },

  removeTagFromPost: async (postId: number, tagId: string) => {
    const endpoint = `${API_URL_POSTS}/${postId}/tags/${tagId}`;
    logRequestDetails(endpoint, "DELETE");
    try {
      const response = await axios.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error("Error removing tag from post:", error);
      console.log(
        `⚠️ To implement this route on the backend: DELETE /api/posts/${postId}/tags/${tagId}`
      );
      throw error;
    }
  },

  getUserPosts: async (userId: number) => {
    const endpoint = `${API_URL_POSTS}/user/${userId}`;
    logRequestDetails(endpoint, "GET");
    try {
      const response = await axios.get(endpoint);
      return Array.isArray(response.data)
        ? response.data
        : response.data.posts || [];
    } catch (error) {
      console.log(
        `⚠️ To implement this route on the backend: GET /api/posts/user/${userId}`
      );
      throw error;
    }
  },

  searchPosts: async (query: string) => {
    const endpoint = `${API_URL_POSTS}/search?q=${encodeURIComponent(query)}`;
    logRequestDetails(endpoint, "GET");
    try {
      const response = await axios.get(endpoint);
      return response.data;
    } catch (error) {
      console.error("Error searching posts:", error);
      console.log(
        `⚠️ To implement this route on the backend: GET /api/posts/search?q=${query}`
      );
      throw error;
    }
  },

  getPostsByTag: async (tagName: string) => {
    const endpoint = `${API_URL_POSTS}/tags/${encodeURIComponent(tagName)}`;
    logRequestDetails(endpoint, "GET");
    try {
      const response = await axios.get(endpoint);
      return response.data;
    } catch (error) {
      console.log(
        `⚠️ To implement this route on the backend: GET /api/posts/tags/${tagName}`
      );
      throw error;
    }
  },

  getLikedPosts: async (userId: number) => {
    const endpoint = `${API_URL_POSTS}/liked/${userId}`;
    logRequestDetails(endpoint, "GET");
    try {
      const response = await axios.get(endpoint);
      return Array.isArray(response.data)
        ? response.data
        : response.data.posts || [];
    } catch (error) {
      console.log(
        `⚠️ To implement this route on the backend: GET /api/posts/liked/${userId}`
      );
      throw error;
    }
  },

  getFavorites: async (userId: number) => {
    const endpoint = `${API_URL_POSTS}/favorites/${userId}`;
    logRequestDetails(endpoint, "GET");
    try {
      const response = await axios.get(endpoint);
      return Array.isArray(response.data)
        ? response.data
        : response.data.posts || [];
    } catch (error) {
      console.log(
        `⚠️ To implement this route on the backend: GET /api/posts/favorites/${userId}`
      );
      throw error;
    }
  },
};

export default postService;
