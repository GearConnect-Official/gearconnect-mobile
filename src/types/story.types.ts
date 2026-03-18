import { GroupUser } from '@/types/group.types';

export interface StoryMedia {
  id: number;
  type: "IMAGE" | "VIDEO";
  url: string;
  publicId: string;
  width: number;
  height: number;
  duration?: number;
}

export interface Story {
  id: number;
  user: GroupUser;
  media: StoryMedia;
  createdAt: string;
  expiresAt: string;
  viewers: number;
  isViewed: boolean;
}

export interface StoryGroup {
  user: GroupUser;
  stories: Story[];
  hasUnviewedStories: boolean;
}
