import axios from 'axios';
import { API_URL_EVENTS, API_URL_EVENTTAGS, API_URL_EVENTREVIEWS, API_URL_RELATEDPRODUCTS } from '@/config';

export interface Event {
  id?: string;
  name: string;
  creatorId: number;
  creators: string;
  location: string;
  date: Date;
  sponsors: string;
  website: string;
  rankings: string;
  logo?: string;
  images?: string[];
  description?: string;
  logoPublicId?: string;
  imagePublicIds?: string[];
  participantsCount?: number;
  viewCount?: number;
  reviewsCount?: number;
  meteo?: {
    trackCondition?: 'dry' | 'wet' | 'mixed' | 'damp' | 'slippery' | 'drying';
    circuitName?: string;
    expectedParticipants?: number;
    eventResultsLink?: string;
    seasonResultsLink?: string;
    [key: string]: any;
  };
  finished?: boolean;
  participationTagText?: string;
  participationTagColor?: string;
  organizers?: Array<{ userId: number | null; name: string }>;
}

const eventService = {
  getAllEvents: async () => {
    try {
      const response = await axios.get(API_URL_EVENTS);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEventById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL_EVENTS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createEvent: async (eventData: Event) => {
    console.log('Données envoyées au backend:', eventData);

    try {
      const processedData = {
        ...eventData,
        creatorId: eventData.creators
          ? parseInt(eventData.creators)
          : undefined,
        creators: undefined,
        date: eventData.date
          ? new Date(eventData.date).toISOString()
          : new Date().toISOString(),
        logo: eventData.logo || '',
        logoPublicId: eventData.logoPublicId || undefined,
        images: eventData.images && Array.isArray(eventData.images) ? eventData.images : [],
        imagePublicIds: eventData.imagePublicIds && Array.isArray(eventData.imagePublicIds) ? eventData.imagePublicIds : [],
      };
      try {
        const response = await axios.post(API_URL_EVENTS, processedData);
        return response.data;
      } catch (axiosError: any) {
        console.error('Erreur axios détaillée:', axiosError.message);
        throw axiosError;
      }
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  updateEvent: async (id: string, eventData: Partial<Event>) => {
    console.log('🔄 Updating event with ID:', id);
    console.log('📝 Event data to update:', eventData);

    try {
      const formattedEvent = {
        ...eventData,
        date: eventData.date
          ? new Date(eventData.date).toISOString()
          : undefined,
        logo: eventData.logo,
        logoPublicId: eventData.logoPublicId,
        images: eventData.images,
        imagePublicIds: eventData.imagePublicIds,
      };

      console.log('📤 Formatted event data:', formattedEvent);

      try {
        const response = await axios.patch(
          `${API_URL_EVENTS}/${id}`,
          formattedEvent
        );
        console.log('✅ Event updated successfully:', response.data);
        return response.data;
      } catch (axiosError: any) {
        console.error('❌ Update request failed:', axiosError.message);
        console.error('📋 Full axios error:', axiosError.response?.data);
        throw axiosError;
      }
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  },

  deleteEvent: async (id: string) => {
    try {
      try {
        const response = await axios.delete(`${API_URL_EVENTS}/${id}`);
        return response.data;      } catch (axiosError: any) {
        console.error('Delete request failed:', axiosError.message);
        throw axiosError;
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  getEventTagsByEventId: async (eventId: string) => {
    try {
      const response = await axios.get(`${API_URL_EVENTTAGS}/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event tags:', error);
      throw error;
    }
  },

  createEventReview: async (reviewData: any) => {
    try {
      const response = await axios.post(`${API_URL_EVENTREVIEWS}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  getEventReviews: async (eventId: number) => {
    try {
      const response = await axios.get(`${API_URL_EVENTREVIEWS}/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event reviews:', error);
      throw error;
    }
  },

  getEventReviewById: async (eventId: number, userId: number) => {
    try {
      const response = await axios.get(`${API_URL_EVENTREVIEWS}/${eventId}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event review:', error);
      throw error;
    }
  },

  updateEventReview: async (eventId: number, userId: number, reviewData: any) => {
    try {
      const response = await axios.put(`${API_URL_EVENTREVIEWS}/${eventId}/${userId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating event review:', error);
      throw error;
    }
  },

  deleteEventReview: async (eventId: number, userId: number) => {
    try {
      const response = await axios.delete(`${API_URL_EVENTREVIEWS}/${eventId}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting event review:', error);
      throw error;
    }
  },

  getRelatedProductsByEventId: async (eventId: string) => {
    try {
      const response = await axios.get(`${API_URL_RELATEDPRODUCTS}/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching related products:', error);
      throw error;
    }
  },

  joinEvent: async (eventId: number, userId: number) => {
    try {
      const response = await axios.post(`${API_URL_EVENTS}/${eventId}/join`, {
        userId: userId,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error joining event:', error);
      throw error;
    }
  },

  leaveEvent: async (eventId: number, userId: number) => {
    try {
      const response = await axios.post(`${API_URL_EVENTS}/${eventId}/leave`, {
        userId: userId,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error leaving event:', error);
      throw error;
    }
  },

  getEventsByUserId: async (userId: string, page: number = 1, limit: number = 100) => {
    try {
      const response = await axios.get(`${API_URL_EVENTS}/user/${userId}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching events by user ID:', error);
      throw error;
    }
  },
};

export default eventService;
