import { StyleSheet } from "react-native";
import theme from "../../config/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "center",
  },
  nextButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  nextButtonActive: {
    backgroundColor: "#E10600",
    borderRadius: 20,
  },
  nextButtonText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  nextButtonTextActive: {
    color: "white",
  },
  placeholderRight: {
    width: 40,
    height: 40,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.input,
    borderRadius: 25,
    paddingHorizontal: theme.spacing.md,
    height: 45,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  groupOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  groupOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  selectedUsersContainer: {
    backgroundColor: theme.colors.background.paper,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  selectedUsersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  selectedUsersList: {
    paddingHorizontal: theme.spacing.md,
  },
  selectedUserChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.input,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    maxWidth: 120,
  },
  chipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: theme.spacing.xs,
  },
  defaultChipAvatar: {
    backgroundColor: theme.colors.background.default,
    justifyContent: "center",
    alignItems: "center",
  },
  chipName: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
  usersList: {
    paddingVertical: theme.spacing.sm,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
  },
  selectedUserItem: {
    backgroundColor: "#FFF5F5",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.md,
  },
  defaultAvatar: {
    backgroundColor: theme.colors.background.input,
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  verifyIcon: {
    marginLeft: theme.spacing.xs,
  },
  userUsername: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  userDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 12,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text.primary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  participantsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    marginRight: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  createButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    marginLeft: theme.spacing.sm,
    borderRadius: 8,
    backgroundColor: "#E10600",
  },
  createButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  // Styles pour les demandes de discussion
  requestUserInfo: {
    marginBottom: theme.spacing.md,
  },
  requestUserText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  requestInfoText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  requestMessageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Styles pour le statut de suivi
  followStatus: {
    marginTop: theme.spacing.xs,
  },
  canMessageText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  requestOnlyText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
});

export default styles;
