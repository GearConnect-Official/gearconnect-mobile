import { StyleSheet } from "react-native";
// Racing theme colors
export const THEME_COLORS = {
  // Primary racing colors
  RACING_RED: "#E10600",
  RACING_BLUE: "#003DA5",
  SPEED_ORANGE: "#FF6B1A",
  VICTORY_GOLD: "#FFD700",

  // Performance colors
  POLE_POSITION: "#FFD700",
  PODIUM_SILVER: "#C0C0C0",
  PODIUM_BRONZE: "#CD7F32",
  FASTEST_LAP: "#FF1493",

  // UI colors
  PRIMARY: "#E10600",
  BACKGROUND: "#FFFFFF",
  TAB_BACKGROUND: "#c9c9c9ff",
  CARD_BACKGROUND: "#FFFFFF",
  BORDER: "#E1E8ED",
  TEXT_PRIMARY: "#14171A",
  TEXT_SECONDARY: "#657786",
  TEXT_MUTED: "#AAB8C2",
  TEXT_WHITE: "#FFFFFF",

  // Status colors
  SUCCESS: "#10B981",
  WARNING: "#F59E0B",
  ERROR: "#EF4444",
  INFO: "#3B82F6",

  // Gradient colors
  GRADIENT_START: "#E10600",
  GRADIENT_END: "#B71C1C",
  RACING_GRADIENT_START: "#FF6B1A",
  RACING_GRADIENT_END: "#E10600",
};



// Animation and layout constants
export const LAYOUT = {
  BORDER_RADIUS: 12,
  CARD_BORDER_RADIUS: 16,
  BUTTON_BORDER_RADIUS: 25,
  SPACING_XS: 4,
  SPACING_SM: 8,
  SPACING_MD: 16,
  SPACING_LG: 24,
  SPACING_XL: 32,

  // Performance specific
  CARD_HEIGHT: 120,
  STATS_CARD_HEIGHT: 80,
  HERO_HEIGHT: 200,
};

// Typography scales
export const TYPOGRAPHY = {
  // Headers
  HERO_TITLE: 28,
  SECTION_TITLE: 20,
  CARD_TITLE: 18,
  SUBTITLE: 16,

  // Body text
  BODY_LARGE: 16,
  BODY: 14,
  BODY_SMALL: 12,
  CAPTION: 10,

  // Weights
  WEIGHT_LIGHT: "300" as any,
  WEIGHT_REGULAR: "400" as any,
  WEIGHT_MEDIUM: "500" as any,
  WEIGHT_SEMIBOLD: "600" as any,
  WEIGHT_BOLD: "700" as any,
  WEIGHT_BLACK: "900" as any,
};

export const performanceStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: LAYOUT.SPACING_XL,
  },

  // Header styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: LAYOUT.SPACING_MD,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 0,
    height: 56,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.SECTION_TITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: THEME_COLORS.TEXT_PRIMARY,
    flex: 1,
    textAlign: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME_COLORS.BACKGROUND,
  },

  // Hero section styles
  heroSection: {
    margin: LAYOUT.SPACING_MD,
    borderRadius: LAYOUT.CARD_BORDER_RADIUS,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  heroGradient: {
    padding: LAYOUT.SPACING_LG,
    minHeight: LAYOUT.HERO_HEIGHT,
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.HERO_TITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_BLACK,
    color: "#FFFFFF",
    marginBottom: LAYOUT.SPACING_SM,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 22,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  heroStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: LAYOUT.SPACING_MD,
  },
  heroStatItem: {
    alignItems: "center",
    flex: 1,
  },
  heroStatValue: {
    fontSize: TYPOGRAPHY.CARD_TITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: "#FFFFFF",
    marginBottom: LAYOUT.SPACING_XS,
  },
  heroStatLabel: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },

  // Stats section styles
  statsContainer: {
    margin: LAYOUT.SPACING_MD,
    marginTop: 0,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -LAYOUT.SPACING_XS,
  },
  statsCard: {
    flex: 1,
    backgroundColor: THEME_COLORS.CARD_BACKGROUND,
    borderRadius: LAYOUT.BORDER_RADIUS,
    padding: LAYOUT.SPACING_MD,
    margin: LAYOUT.SPACING_XS,
    minHeight: LAYOUT.STATS_CARD_HEIGHT,
    borderWidth: 1,
    borderColor: THEME_COLORS.BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsIcon: {
    marginBottom: LAYOUT.SPACING_XS,
  },
  statsValue: {
    fontSize: TYPOGRAPHY.CARD_TITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: LAYOUT.SPACING_XS,
  },
  statsLabel: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: THEME_COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },

  // Filter styles
  filtersContainer: {
    paddingHorizontal: LAYOUT.SPACING_MD,
    marginBottom: LAYOUT.SPACING_MD,
  },
  filtersList: {
    paddingHorizontal: LAYOUT.SPACING_XS,
  },
  filterChip: {
    paddingHorizontal: LAYOUT.SPACING_MD,
    paddingVertical: LAYOUT.SPACING_SM,
    marginRight: LAYOUT.SPACING_SM,
    backgroundColor: THEME_COLORS.TAB_BACKGROUND,
    borderRadius: LAYOUT.BUTTON_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: THEME_COLORS.BORDER,
  },
  filterChipActive: {
    backgroundColor: THEME_COLORS.PRIMARY,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.BODY,
    color: THEME_COLORS.TEXT_WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },

  // Performance card styles
  performanceCard: {
    backgroundColor: THEME_COLORS.CARD_BACKGROUND,
    borderRadius: LAYOUT.CARD_BORDER_RADIUS,
    padding: LAYOUT.SPACING_MD,
    marginHorizontal: LAYOUT.SPACING_MD,
    marginBottom: LAYOUT.SPACING_MD,
    borderWidth: 1,
    borderColor: THEME_COLORS.BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  performanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: LAYOUT.SPACING_MD,
  },
  performanceTitle: {
    fontSize: TYPOGRAPHY.CARD_TITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: THEME_COLORS.TEXT_PRIMARY,
    flex: 1,
    marginRight: LAYOUT.SPACING_SM,
  },
  performanceDate: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: THEME_COLORS.TEXT_SECONDARY,
    marginTop: LAYOUT.SPACING_XS,
  },
  performanceActions: {
    flexDirection: "row",
    gap: LAYOUT.SPACING_SM,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME_COLORS.BACKGROUND,
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },

  // Performance details
  performanceDetails: {
    gap: LAYOUT.SPACING_MD,
  },
  performanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  performanceMetric: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: LAYOUT.SPACING_SM,
  },
  metricIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.BODY,
    color: THEME_COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: THEME_COLORS.TEXT_PRIMARY,
  },
  positionValue: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  lapTimeValue: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: THEME_COLORS.PRIMARY,
    fontFamily: "monospace",
  },

  // Notes section
  notesContainer: {
    paddingTop: LAYOUT.SPACING_MD,
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.BORDER,
    marginTop: LAYOUT.SPACING_SM,
  },
  notesText: {
    fontSize: TYPOGRAPHY.BODY,
    color: THEME_COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    fontStyle: "italic",
  },

  // Empty state styles
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: LAYOUT.SPACING_XL,
    minHeight: 300,
  },
  emptyIcon: {
    marginBottom: LAYOUT.SPACING_LG,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SECTION_TITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: THEME_COLORS.TEXT_PRIMARY,
    textAlign: "center",
    marginBottom: LAYOUT.SPACING_SM,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.BODY,
    color: THEME_COLORS.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: LAYOUT.SPACING_LG,
    maxWidth: 280,
  },

  // Button styles
  primaryButton: {
    backgroundColor: THEME_COLORS.PRIMARY,
    borderRadius: LAYOUT.BUTTON_BORDER_RADIUS,
    paddingVertical: LAYOUT.SPACING_MD,
    paddingHorizontal: LAYOUT.SPACING_LG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: LAYOUT.SPACING_SM,
    shadowColor: THEME_COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },
  secondaryButton: {
    backgroundColor: THEME_COLORS.BACKGROUND,
    borderRadius: LAYOUT.BUTTON_BORDER_RADIUS,
    paddingVertical: LAYOUT.SPACING_MD,
    paddingHorizontal: LAYOUT.SPACING_LG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: LAYOUT.SPACING_SM,
    borderWidth: 1,
    borderColor: THEME_COLORS.BORDER,
  },
  secondaryButtonText: {
    color: THEME_COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME_COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: LAYOUT.SPACING_MD,
    fontSize: TYPOGRAPHY.SUBTITLE,
    color: THEME_COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },

  // Form styles
  formContainer: {
    padding: LAYOUT.SPACING_MD,
  },
  inputGroup: {
    marginBottom: LAYOUT.SPACING_LG,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: LAYOUT.SPACING_SM,
  },
  textInput: {
    borderWidth: 1,
    borderColor: THEME_COLORS.BORDER,
    borderRadius: LAYOUT.BORDER_RADIUS,
    paddingHorizontal: LAYOUT.SPACING_MD,
    paddingVertical: LAYOUT.SPACING_MD,
    fontSize: TYPOGRAPHY.BODY,
    backgroundColor: THEME_COLORS.CARD_BACKGROUND,
    color: THEME_COLORS.TEXT_PRIMARY,
  },
  textInputFocused: {
    borderColor: THEME_COLORS.PRIMARY,
    shadowColor: THEME_COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  textInputError: {
    borderColor: THEME_COLORS.ERROR,
  },
  errorText: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: THEME_COLORS.ERROR,
    marginTop: LAYOUT.SPACING_XS,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },

  // Chart styles
  chartContainer: {
    backgroundColor: THEME_COLORS.CARD_BACKGROUND,
    margin: LAYOUT.SPACING_MD,
    borderRadius: LAYOUT.CARD_BORDER_RADIUS,
    padding: LAYOUT.SPACING_MD,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.CARD_TITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: THEME_COLORS.TEXT_PRIMARY,
    marginBottom: LAYOUT.SPACING_MD,
    textAlign: "center",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: LAYOUT.SPACING_MD,
  },
  modalContent: {
    backgroundColor: THEME_COLORS.CARD_BACKGROUND,
    borderRadius: LAYOUT.CARD_BORDER_RADIUS,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: LAYOUT.SPACING_MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.BORDER,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.CARD_TITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: THEME_COLORS.TEXT_PRIMARY,
  },
  modalList: {
    maxHeight: 300,
    padding: LAYOUT.SPACING_MD,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: LAYOUT.SPACING_MD,
    borderRadius: LAYOUT.BORDER_RADIUS,
    marginBottom: LAYOUT.SPACING_SM,
    backgroundColor: THEME_COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: THEME_COLORS.BORDER,
  },
  modalItemSelected: {
    backgroundColor: `${THEME_COLORS.PRIMARY}20`,
    borderColor: THEME_COLORS.PRIMARY,
    borderWidth: 2,
  },
  modalItemEmoji: {
    fontSize: 24,
    marginRight: LAYOUT.SPACING_MD,
  },
  modalItemText: {
    fontSize: TYPOGRAPHY.BODY,
    color: THEME_COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
    flex: 1,
  },
  modalItemTextSelected: {
    color: THEME_COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },
});

export default performanceStyles;
