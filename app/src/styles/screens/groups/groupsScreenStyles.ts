import { StyleSheet } from "react-native";
import theme from "../../config/theme";

const styles = StyleSheet.create({
  container: {
    ...theme.common.container,
  },
  loadingContainer: {
    ...theme.common.centerContent,
    flex: 1,
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  header: {
    ...theme.common.spaceBetween,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 0,
    backgroundColor: '#fff',
    height: 56,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    ...theme.common.row,
    gap: theme.spacing.sm,
  },
  headerButton: {
    padding: theme.spacing.xs,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  groupItem: {
    ...theme.common.card,
    marginBottom: theme.spacing.md,
  },
  groupHeader: {
    ...theme.common.row,
    marginBottom: theme.spacing.sm,
  },
  groupIconContainer: {
    position: "relative",
    marginRight: theme.spacing.sm,
  },
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultGroupIcon: {
    backgroundColor: theme.colors.grey[100],
    ...theme.common.centerContent,
  },
  publicBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.status.success,
    ...theme.common.centerContent,
    borderWidth: 2,
    borderColor: theme.colors.common.white,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xxs,
  },
  groupDescription: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  groupMeta: {
    ...theme.common.row,
    gap: theme.spacing.md,
  },
  metaItem: {
    ...theme.common.row,
    gap: theme.spacing.xxs,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  groupActions: {
    ...theme.common.centerContent,
    paddingLeft: theme.spacing.xs,
  },
  groupChannels: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing.sm,
    gap: 6,
  },
  channelPreview: {
    ...theme.common.row,
    gap: theme.spacing.xs,
  },
  channelName: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  messageCount: {
    fontSize: 11,
    color: theme.colors.grey[400],
    backgroundColor: theme.colors.grey[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: "center",
  },
  moreChannels: {
    ...theme.typography.caption,
    color: theme.colors.grey[400],
    fontStyle: "italic",
  },
  emptyContainer: {
    ...theme.common.centerContent,
    flex: 1,
    paddingVertical: 60,
  },
  emptyTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyDescription: {
    ...theme.typography.body2,
    color: theme.colors.grey[400],
    textAlign: "center",
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
  },
  modalHeader: {
    ...theme.common.spaceBetween,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
  },
  modalAction: {
    ...theme.typography.subtitle1,
    color: theme.colors.primary.main,
  },
  modalActionDisabled: {
    color: theme.colors.grey[400],
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.subtitle1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  inputHint: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xxs,
  },
  checkboxGroup: {
    ...theme.common.row,
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    borderRadius: theme.borders.radius.xs,
    ...theme.common.centerContent,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  checkboxLabel: {
    flex: 1,
  },
  checkboxText: {
    ...theme.typography.body1,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  checkboxDescription: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
});

export default styles;
