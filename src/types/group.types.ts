export interface GroupRole {
  id: number;
  name: string;
  color?: string;
  position: number;
}

export interface GroupUser {
  id: number;
  name: string;
  username: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  isVerify: boolean;
}

export interface GroupMember {
  id: number;
  user: GroupUser;
  nickname?: string;
  joinedAt: string;
  lastActiveAt: string;
  roles: {
    role: GroupRole;
  }[];
}

export interface GroupChannel {
  id: number;
  name: string;
  description?: string;
  type: "TEXT" | "VOICE" | "ANNOUNCEMENT";
  position: number;
  isPrivate: boolean;
  _count: {
    messages: number;
  };
}

export interface GroupCategory {
  id: number;
  name: string;
  position: number;
  channels: GroupChannel[];
}

export interface GroupDetails {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  iconPublicId?: string;
  isPublic: boolean;
  owner: GroupUser;
  members: GroupMember[];
  channels: GroupChannel[];
  categories: GroupCategory[];
  roles: GroupRole[];
  _count: {
    members: number;
  };
  createdAt: string;
}
