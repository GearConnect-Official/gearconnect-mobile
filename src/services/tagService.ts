import axios from "axios";
import { API_URL_TAGS } from "@/config";

export interface Tag {
  id?: string;
  name: string;
}

const tagService = {
  // Get all tags
  getAllTags: async () => {
    try {
      const response = await axios.get(API_URL_TAGS);
      return response.data;
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw error;
    }
  },
  // Get a tag by ID
  getTagById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL_TAGS}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching tag:", error);
      throw error;
    }
  },
  // Create a new tag

}

export default tagService;
