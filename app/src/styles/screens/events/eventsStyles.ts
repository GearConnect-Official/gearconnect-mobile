import { StyleSheet, Platform, StatusBar } from "react-native";
import theme from "../../config/theme";
import { THEME_COLORS } from "../user/performanceStyles";

const STATUSBAR_HEIGHT =
  Platform.OS === "ios" ? 44 : (StatusBar.currentHeight || 24) + 16;
const HEADER_HEIGHT = 56 + STATUSBAR_HEIGHT;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: THEME_COLORS.BACKGROUND,
    borderBottomWidth: 0,
    height: HEADER_HEIGHT,
    marginTop: Platform.OS === "ios" ? -STATUSBAR_HEIGHT : 0,
    paddingTop: STATUSBAR_HEIGHT,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  backButton: {
    marginRight: 15,
    padding: 8,
    position: "relative",
    zIndex: 20,
  },
  placeholderRight: {
    width: 40,
    height: 40,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  topBar: {
    backgroundColor: "#fff",
    minHeight: theme.spacing.height.toolbar,
    paddingTop: Platform.OS === "android" ? 8 : 0,
  },
  topBarContent: {
    ...theme.common.spaceBetween,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  topBarTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
  },
  topBarIcon: {
    width: 24,
    height: 24,
  },
  topBarIcons: {
    ...theme.common.row,
    gap: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
  },

  // Hero section
  heroSection: {
    padding: theme.spacing.lg,
    backgroundColor: "#f0f2f5",
    marginBottom: theme.spacing.md,
  },
  heroTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary.dark,
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
  },
  heroSubtitle: {
    ...theme.typography.subtitle1,
    color: theme.colors.text.secondary,
    maxWidth: "80%",
  },

  // Featured events section
  featuredSection: {
    marginBottom: theme.spacing.md,
  },
  featuredCard: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    ...theme.shadows.apply({}, "md"),
    marginBottom: theme.spacing.md,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  featuredGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
    justifyContent: "flex-end",
    padding: theme.spacing.md,
  },
  featuredDate: {
    color: "#fff",
    ...theme.typography.caption,
    fontWeight: "bold",
    textTransform: "uppercase",
    backgroundColor: "rgba(225, 6, 0, 0.7)", // Changed from blue to red
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  featuredTitle: {
    color: "#fff",
    ...theme.typography.h5,
    fontWeight: "bold",
    marginBottom: 4,
  },
  featuredLocation: {
    color: "#fff",
    ...theme.typography.body2,
    marginBottom: 12,
  },
  featuredActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  featuredButton: {
    backgroundColor: "#fff",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
  },
  featuredButtonText: {
    color: theme.colors.primary.main,
    fontWeight: "600",
  },
  featuredIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Map button
  mapButton: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.primary.main,
    backgroundColor: "#fff",
  },
  mapButtonText: {
    color: theme.colors.primary.main,
    fontWeight: "600",
    fontSize: 13,
  },

  // Create button
  createButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Search section
  searchSection: {
    padding: theme.spacing.md,
  },
  searchBar: {
    ...theme.common.row,
    ...theme.borders.apply(
      {},
      {
        width: 1,
        color: theme.colors.border.medium,
        radius: "sm",
      }
    ),
    padding: theme.spacing.xxs,
    backgroundColor: "#fff",
    ...theme.shadows.apply({}, "xs"),
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.xs + 4,
  },
  searchButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borders.radius.xs,
    padding: theme.spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  searchInfo: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xxs,
  },

  // Tabs section
  tabGroup: {
    ...theme.common.row,
    paddingHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: "column",
    ...theme.borders.apply(
      {},
      {
        width: 1,
        color: theme.colors.border.medium,
        radius: "sm",
      }
    ),
    paddingVertical: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xxs,
    backgroundColor: "#fff",
  },
  tabIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  tabText: {
    ...theme.typography.body2,
    textAlign: "center",
  },

  // Events list section
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
    fontWeight: "bold",
  },
  eventsContainer: {
    marginBottom: theme.spacing.lg,
  },
  eventItem: {
    ...theme.common.row,
    alignItems: "center",
    padding: theme.spacing.xs + 4,
    gap: theme.spacing.xs,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borders.radius.round,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    ...theme.typography.subtitle1,
    color: theme.colors.text.primary,
  },
  eventSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  eventDate: {
    ...theme.typography.body2,
    fontWeight: "500",
    color: theme.colors.text.primary,
    textAlign: "right",
  },
  emojiContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borders.radius.round,
    backgroundColor: theme.colors.grey[50],
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 20,
  },

  // CTA Section
  ctaSection: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: 16,
    overflow: "hidden",
    ...theme.shadows.apply({}, "md"),
  },
  ctaGradient: {
    padding: theme.spacing.lg,
  },
  ctaTitle: {
    ...theme.typography.h5,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
  },
  ctaText: {
    ...theme.typography.body1,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: theme.spacing.md,
  },
  ctaButton: {
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    alignSelf: "flex-start",
  },
  ctaButtonText: {
    color: theme.colors.primary.main,
    fontWeight: "bold",
  },

  // Empty state
  emptyContainer: {
    padding: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: theme.spacing.lg,
  },
  emptyText: {
    ...theme.typography.h6,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  createEventButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: theme.spacing.md,
  },
  createEventButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // State styles
  activeTab: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borders.radius.lg - 2,
  },
  activeTabText: {
    color: theme.colors.common.white,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    ...theme.common.centerContent,
    padding: theme.spacing.lg,
  },
  errorContainer: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  errorTitle: {
    ...theme.typography.h6,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    ...theme.typography.body1,
    color: theme.colors.status.error,
    marginBottom: theme.spacing.xs + 2,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.borders.radius.sm,
  },
  retryButtonText: {
    color: theme.colors.common.white,
    ...theme.typography.button,
  },
});

export default styles;
