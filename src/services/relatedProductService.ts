import axios, { isAxiosError } from 'axios';
import { API_URL_RELATEDPRODUCTS } from '@/config';

export interface RelatedProduct {
  id?: string;
  name: string;
  price: number;
  link: string;
  eventId: number;
  createdAt?: string;
}

const relatedProductService = {
  getProductsByEventId: async (eventId: string) => {
    try {
      const response = await axios.get(`${API_URL_RELATEDPRODUCTS}/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for event ${eventId}:`, error);
      throw error;
    }
  },

  createProduct: async (productData: RelatedProduct) => {
    try {
      if (!productData.eventId) {
        throw new Error('Event ID is required to create a related product');
      }

      const response = await axios.post(API_URL_RELATEDPRODUCTS, productData);

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create product';
        return {
          success: false,
          error: errorMessage,
          status: error.response?.status
        };
      } else {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    }
  },

  createMultipleProducts: async (products: RelatedProduct[]) => {
    try {
      if (!products || products.length === 0) {
        return [];
      }

      const hasInvalidProducts = products.some(product => !product.eventId);
      if (hasInvalidProducts) {
        throw new Error('All products must have an event ID');
      }

      const results = [];
      const errors = [];

      for (const product of products) {
        try {
          const response = await axios.post(API_URL_RELATEDPRODUCTS, product);
          results.push(response.data);
        } catch (error) {
          if (isAxiosError(error)) {
            let errorMessage = error.response?.data?.message || 'API Error occurred';

            if (error.response?.data?.code === 'P2014' &&
                error.response?.data?.meta?.relation_name === 'EventToRelatedProduct') {
              errorMessage = `Invalid event ID: ${product.eventId}. The event does not exist.`;
            }

            const apiError = {
              message: errorMessage,
              status: error.response?.status,
              type: 'API',
              url: error.config?.url,
              product: product,
              prismaError: error.response?.data?.code === 'P2014',
              originalError: error
            };
            errors.push(apiError);
          } else {
            const genericError = {
              message: error instanceof Error ? error.message : 'Unknown error occurred',
              type: 'UNKNOWN',
              product: product,
              originalError: error
            };
            errors.push(genericError);
          }
        }
      }

      if (errors.length > 0) {
        console.error('Error creating multiple products:', errors);
        throw {
          message: `Failed to create ${errors.length} out of ${products.length} products`,
          failedProducts: errors,
          successfulProducts: results,
          type: 'BATCH_OPERATION_ERROR'
        };
      }

      return results;
    } catch (error) {
      console.error('Error creating multiple products:', error);
      throw error;
    }
  },

  updateProduct: async (id: string, productData: Partial<RelatedProduct>) => {
    try {
      const response = await axios.patch(`${API_URL_RELATEDPRODUCTS}/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    try {
      const response = await axios.delete(`${API_URL_RELATEDPRODUCTS}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  },

  deleteMultipleProducts: async (productIds: string[]) => {
    try {
      if (!productIds || productIds.length === 0) {
        return [];
      }

      const promises = productIds.map(id =>
        axios.delete(`${API_URL_RELATEDPRODUCTS}/${id}`)
      );

      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    } catch (error) {
      console.error('Error deleting multiple products:', error);
      throw error;
    }
  },

  deleteProductsByEventId: async (eventId: string) => {
    try {
      const response = await axios.delete(`${API_URL_RELATEDPRODUCTS}/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting products for event ${eventId}:`, error);
      throw error;
    }
  }
};

export default relatedProductService;
