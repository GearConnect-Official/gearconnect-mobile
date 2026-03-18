import { MessageType, MessageConfig, ConfirmationConfig } from '@/types/message.types';

/**
 * Centralized service for all application messages
 * Enables consistent management and easy translation
 */
export class MessageService {

  // ===== SUCCESS MESSAGES =====
  static readonly SUCCESS = {
    PROFILE_UPDATED: {
      type: MessageType.SUCCESS,
      message: "Votre profil est bien à jour",
      duration: 3000
    } as MessageConfig,

    PROFILE_PICTURE_UPDATED: {
      type: MessageType.SUCCESS,
      message: "Photo de profil mise à jour avec succès",
      duration: 3000
    } as MessageConfig,

    POST_SHARED: {
      type: MessageType.SUCCESS,
      message: "Post partagé avec succès !",
      duration: 3000
    } as MessageConfig,

    PRODUCT_ADDED: {
      type: MessageType.SUCCESS,
      message: "Produit ajouté avec succès !",
      duration: 3000
    } as MessageConfig,

    EVENT_UPDATED: {
      type: MessageType.SUCCESS,
      message: "Événement mis à jour avec succès !",
      duration: 3000
    } as MessageConfig,

    POST_REMOVED_FROM_FAVORITES: {
      type: MessageType.SUCCESS,
      message: "Post retiré des favoris",
      duration: 3000
    } as MessageConfig,

    PASSWORD_RESET_SENT: {
      type: MessageType.SUCCESS,
      message: "Code de réinitialisation envoyé par email",
      duration: 5000
    } as MessageConfig,

    PASSWORD_RESET_SUCCESS: {
      type: MessageType.SUCCESS,
      message: "Votre mot de passe a été réinitialisé avec succès !",
      duration: 5000
    } as MessageConfig,

    CONTENT_COPIED: {
      type: MessageType.SUCCESS,
      message: "Content copied to clipboard",
      duration: 2000,
      customBackgroundColor: '#E10600',
    } as MessageConfig,
  };

  // ===== ERROR MESSAGES =====
  static readonly ERROR = {
    LOGIN_REQUIRED: {
      type: MessageType.ERROR,
      message: "Vous devez être connecté pour effectuer cette action",
      duration: 4000
    } as MessageConfig,

    LOGOUT_FAILED: {
      type: MessageType.ERROR,
      message: "Échec de la déconnexion. Veuillez réessayer.",
      duration: 4000
    } as MessageConfig,

    PRODUCT_NAME_REQUIRED: {
      type: MessageType.ERROR,
      message: "Le nom du produit est requis",
      duration: 4000
    } as MessageConfig,

    PRODUCT_PRICE_REQUIRED: {
      type: MessageType.ERROR,
      message: "Le prix du produit est requis",
      duration: 4000
    } as MessageConfig,

    INVALID_PRICE: {
      type: MessageType.ERROR,
      message: "Veuillez entrer un prix valide supérieur à 0",
      duration: 4000
    } as MessageConfig,

    INVALID_EVENT_ID: {
      type: MessageType.ERROR,
      message: "ID d'événement invalide",
      duration: 4000
    } as MessageConfig,

    IMAGE_AND_TITLE_REQUIRED: {
      type: MessageType.ERROR,
      message: "Veuillez ajouter une image et un titre",
      duration: 4000
    } as MessageConfig,

    SELECT_IMAGE_FIRST: {
      type: MessageType.ERROR,
      message: "Veuillez d'abord sélectionner une image",
      duration: 4000
    } as MessageConfig,

    PROFILE_UPDATE_FAILED: {
      type: MessageType.ERROR,
      message: "Échec de la mise à jour du profil",
      duration: 4000
    } as MessageConfig,

    PROFILE_PICTURE_UPLOAD_FAILED: {
      type: MessageType.ERROR,
      message: "Échec de l'upload de la photo de profil",
      duration: 4000
    } as MessageConfig,

    CONFIGURATION_ERROR: {
      type: MessageType.ERROR,
      message: "Erreur de configuration",
      duration: 4000
    } as MessageConfig,

    FAILED_TO_LOAD_COMMENTS: {
      type: MessageType.ERROR,
      message: "Impossible de charger les commentaires",
      duration: 4000
    } as MessageConfig,

    FAILED_TO_ADD_COMMENT: {
      type: MessageType.ERROR,
      message: "Impossible d'ajouter le commentaire",
      duration: 4000
    } as MessageConfig,

    FAILED_TO_EDIT_COMMENT: {
      type: MessageType.ERROR,
      message: "Impossible de modifier le commentaire",
      duration: 4000
    } as MessageConfig,

    FAILED_TO_DELETE_COMMENT: {
      type: MessageType.ERROR,
      message: "Impossible de supprimer le commentaire",
      duration: 4000
    } as MessageConfig,

    FAILED_TO_LIKE: {
      type: MessageType.ERROR,
      message: "Impossible d'ajouter un like pour le moment",
      duration: 4000
    } as MessageConfig,

    FAILED_TO_SAVE_POST: {
      type: MessageType.ERROR,
      message: "Impossible de sauvegarder ce post pour le moment",
      duration: 4000
    } as MessageConfig,

    FAILED_TO_SHARE_POST: {
      type: MessageType.ERROR,
      message: "Impossible de partager ce post",
      duration: 4000
    } as MessageConfig,

    SHARING_NOT_AVAILABLE: {
      type: MessageType.ERROR,
      message: "Le partage n'est pas disponible sur cet appareil",
      duration: 4000
    } as MessageConfig,

    FAILED_TO_LOAD_POST: {
      type: MessageType.ERROR,
      message: "Impossible de charger le post",
      duration: 4000
    } as MessageConfig,

    FAILED_TO_REMOVE_FROM_FAVORITES: {
      type: MessageType.ERROR,
      message: "Impossible de retirer ce post des favoris",
      duration: 4000
    } as MessageConfig,

    UPLOAD_ERROR: {
      type: MessageType.ERROR,
      message: "Erreur d'upload",
      duration: 4000
    } as MessageConfig,

    CROP_ERROR: {
      type: MessageType.ERROR,
      message: "Impossible de recadrer l'image",
      duration: 4000
    } as MessageConfig,

    FAILED_TO_SAVE_PERFORMANCE: {
      type: MessageType.ERROR,
      message: "Échec de l'enregistrement de la performance",
      duration: 4000
    } as MessageConfig,

    GENERIC_ERROR: {
      type: MessageType.ERROR,
      message: "Une erreur inattendue s'est produite",
      duration: 4000
    } as MessageConfig,
  };

  // ===== INFO MESSAGES =====
  static readonly INFO = {
    COMING_SOON: {
      type: MessageType.INFO,
      message: "Cette fonctionnalité sera disponible dans la prochaine mise à jour",
      duration: 4000
    } as MessageConfig,

    SUPPORT_CONTACT: {
      type: MessageType.INFO,
      message: "Veuillez contacter support@gearconnect.com pour obtenir de l'aide",
      duration: 6000
    } as MessageConfig,

    TERMS_CONDITIONS: {
      type: MessageType.INFO,
      message: "Les conditions d'utilisation complètes seront disponibles dans la prochaine mise à jour",
      duration: 5000
    } as MessageConfig,

    TWO_FA_REQUIRED: {
      type: MessageType.INFO,
      message: "L'authentification à deux facteurs est requise pour terminer la réinitialisation du mot de passe",
      duration: 6000
    } as MessageConfig,
  };

  // ===== WARNING MESSAGES =====
  static readonly WARNING = {
  };

  // ===== CONFIRMATIONS =====
  static readonly CONFIRMATIONS = {
    LOGOUT: {
      title: "Se déconnecter",
      message: "Êtes-vous sûr de vouloir vous déconnecter ?",
      confirmText: "Se déconnecter",
      cancelText: "Annuler",
      destructive: true,
      type: 'warning' as const,
      onConfirm: () => {}
    },

    DELETE_ACCOUNT: {
      title: "Supprimer le compte",
      message: "Cette action est irréversible. Votre compte sera définitivement supprimé.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      destructive: true,
      type: 'danger' as const,
      onConfirm: () => {}
    },

    DELETE_POST: {
      title: "Supprimer le post",
      message: "Êtes-vous sûr de vouloir supprimer ce post ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      destructive: true,
      type: 'danger' as const,
      onConfirm: () => {}
    },

    UNSAVED_CHANGES: {
      title: "Modifications non sauvegardées",
      message: "Vous avez des modifications non sauvegardées. Voulez-vous quitter sans enregistrer ?",
      confirmText: "Quitter",
      cancelText: "Continuer",
      destructive: false,
      type: 'warning' as const,
      onConfirm: () => {}
    }
  } as const;

  /**
   * Utility method to create a custom message
   */
  static createCustomMessage(type: MessageType, message: string, duration = 4000): MessageConfig {
    return {
      type,
      message,
      duration
    };
  }

  /**
   * Utility method to create a custom confirmation
   */
  static createCustomConfirmation(
    title: string,
    message: string,
    onConfirm: () => void,
    options?: Partial<ConfirmationConfig>
  ): ConfirmationConfig {
    return {
      title,
      message,
      confirmText: options?.confirmText || "Confirmer",
      cancelText: options?.cancelText || "Annuler",
      destructive: options?.destructive || false,
      onConfirm,
      onCancel: options?.onCancel
    };
  }
}

export default MessageService;
