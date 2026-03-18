export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  DO_NOT_DISTURB = 'DO_NOT_DISTURB',
}

export type UserStatusType = UserStatus.ONLINE | UserStatus.OFFLINE | UserStatus.DO_NOT_DISTURB;

// UI display mapping
export const UserStatusDisplay: Record<UserStatus, { label: string; color: string }> = {
  [UserStatus.ONLINE]: {
    label: 'Online',
    color: '#25D366', // Green color for online status
  },
  [UserStatus.OFFLINE]: {
    label: 'Offline',
    color: '#E10600', // App red
  },
  [UserStatus.DO_NOT_DISTURB]: {
    label: 'Do not disturb',
    color: '#FF9500', // Orange
  },
};
