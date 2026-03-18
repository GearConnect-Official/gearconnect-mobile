import MessageService from '@/services/messageService';
import { MessageType } from '@/types/message.types';

/**
 * Utilities to simplify usage of centralized messages
 */

/**
 * Create a quick success message
 */
export const createSuccessMessage = (message: string, duration = 3000) => {
  return MessageService.createCustomMessage(MessageType.SUCCESS, message, duration);
};

/**
 * Create a quick error message
 */
export const createErrorMessage = (message: string, duration = 4000) => {
  return MessageService.createCustomMessage(MessageType.ERROR, message, duration);
};

/**
 * Create a quick info message
 */
export const createInfoMessage = (message: string, duration = 4000) => {
  return MessageService.createCustomMessage(MessageType.INFO, message, duration);
};

/**
 * Create a quick warning message
 */
export const createWarningMessage = (message: string, duration = 4000) => {
  return MessageService.createCustomMessage(MessageType.WARNING, message, duration);
};

/**
 * Create a quick confirmation
 */
export const createConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  options?: {
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onCancel?: () => void;
  }
) => {
  return MessageService.createCustomConfirmation(title, message, onConfirm, options);
};

/**
 * Frequently used messages - shortcuts
 */
export const QuickMessages = {
  // Success
  success: (message: string) => createSuccessMessage(message),
  profileUpdated: () => MessageService.SUCCESS.PROFILE_UPDATED,
  saved: () => createSuccessMessage("Enregistré avec succès"),
  deleted: () => createSuccessMessage("Supprimé avec succès"),

  // Errors
  error: (message: string) => createErrorMessage(message),
  loginRequired: () => MessageService.ERROR.LOGIN_REQUIRED,
  networkError: () => createErrorMessage("Problème de connexion. Vérifiez votre connexion internet."),
  serverError: () => createErrorMessage("Erreur serveur. Veuillez réessayer plus tard."),

  // Info
  info: (message: string) => createInfoMessage(message),
  comingSoon: () => MessageService.INFO.COMING_SOON,

  // Confirmations
  deleteConfirmation: (onConfirm: () => void) => createConfirmation(
    "Supprimer",
    "Êtes-vous sûr de vouloir supprimer cet élément ?",
    onConfirm,
    { destructive: true }
  ),

  logoutConfirmation: (onConfirm: () => void) => ({
    ...MessageService.CONFIRMATIONS.LOGOUT,
    onConfirm
  }),
};
