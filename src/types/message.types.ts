export enum MessageType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  CONFIRMATION = 'confirmation'
}

export interface MessageConfig {
  title?: string;
  message: string;
  type: MessageType;
  duration?: number;
  actions?: MessageAction[];
  customBackgroundColor?: string;
}

export interface MessageAction {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  type?: 'success' | 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}
