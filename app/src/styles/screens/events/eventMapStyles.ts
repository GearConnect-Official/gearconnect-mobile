import { StyleSheet } from 'react-native';
import theme from '../../config/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },

  // Map
  map: {
    flex: 1,
  },

  // Top Bar overlay
  topBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  searchBarContainer: {
    flex: 1,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.md,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body2,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
    height: 44,
  },

  // Filter button (replaces category carousel)
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary.main,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.primary.main,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  // Filter modal / panel
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: 'flex-end',
  },
  filterOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  filterPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing.lg,
    maxHeight: '80%',
  },
  filterPanelDragZone: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  filterPanelHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.grey[200],
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  filterPanelTitle: {
    ...theme.typography.h4,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  filterResetText: {
    ...theme.typography.body2,
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  filterSectionTitle: {
    ...theme.typography.subtitle2,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.grey[50],
    borderWidth: 1.5,
    borderColor: theme.colors.grey[200],
    gap: 6,
  },
  filterChipSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  filterChipText: {
    ...theme.typography.body2,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  // Custom marker
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...theme.shadows.md,
  },
  markerBubbleJoined: {
    borderColor: theme.colors.status.success,
    borderWidth: 3,
  },
  markerBubbleSelected: {
    borderColor: theme.colors.grey[900],
    borderWidth: 3.5,
    ...theme.shadows.lg,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },

  // Locate me button
  locateButton: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: 32,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },

  // Bottom card (selected event)
  bottomCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  bottomCardHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.grey[200],
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  bottomCardHeaderLeft: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  bottomCardCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  bottomCardCategoryText: {
    ...theme.typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomCardTitle: {
    ...theme.typography.h5,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  bottomCardPrice: {
    ...theme.typography.subtitle1,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  bottomCardInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  bottomCardInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomCardInfoText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  bottomCardDescription: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  bottomCardActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailButton: {
    flex: 1,
    backgroundColor: theme.colors.primary.main,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonText: {
    ...theme.typography.button,
    color: '#fff',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
  },
  joinButtonJoined: {
    borderColor: theme.colors.status.success,
    backgroundColor: theme.colors.status.success,
  },
  joinButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary.main,
  },
  joinButtonTextJoined: {
    color: '#fff',
  },

  // Events count badge
  eventCountBadge: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(30, 35, 44, 0.85)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 5,
  },
  eventCountText: {
    ...theme.typography.caption,
    color: '#fff',
    fontWeight: '600',
  },

});

export default styles;
