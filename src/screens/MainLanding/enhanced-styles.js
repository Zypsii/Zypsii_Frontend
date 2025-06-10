import { StyleSheet, Dimensions } from 'react-native';
import { colors, scale, verticalScale } from '../../utils';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  // Base container styles
  flex: {
    flex: 1,
  },
  safeAreaStyle: {
    backgroundColor: colors.white || '#FFFFFF',
  },
  grayBackground: {
    backgroundColor: colors.backgroundColor || '#F8F9FA',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.backgroundColor || '#F8F9FA',
  },

  // Header styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.white || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor || '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  locationWrapper: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationImage: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    marginRight: scale(8),
  },
  locationText: {
    fontSize: scale(18),
    fontWeight: '700',
    color: colors.fontMainColor || '#1A1A1A',
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  notificationIconWrapper: {
    position: 'relative',
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: colors.lightGray || '#F5F5F5',
  },
  icon: {
    color: colors.fontMainColor || '#1A1A1A',
  },
  notificationIcon: {
    color: colors.fontMainColor || '#1A1A1A',
  },
  notificationBadge: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
    backgroundColor: colors.errorColor || '#FF4444',
    borderRadius: scale(10),
    minWidth: scale(18),
    height: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(4),
  },
  notificationText: {
    color: colors.white || '#FFFFFF',
    fontSize: scale(10),
    fontWeight: '600',
  },

  // Button container styles
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.white || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor || '#E5E5E5',
    gap: scale(8),
  },
  button: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
    backgroundColor: colors.lightGray || '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: scale(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedButton: {
    backgroundColor: colors.btncolor || '#007AFF',
    borderColor: colors.btncolor || '#007AFF',
    shadowColor: colors.btncolor || '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: scale(14),
    fontWeight: '500',
    color: colors.fontSecondColor || '#666666',
  },
  selectedButtonText: {
    color: colors.white || '#FFFFFF',
    fontWeight: '600',
  },

  // Section header styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.white || '#FFFFFF',
  },
  titleSpacer: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(12),
    backgroundColor: colors.backgroundColor || '#F8F9FA',
  },
  titleSpaceredge: {
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(12),
    backgroundColor: colors.backgroundColor || '#F8F9FA',
  },
  titleSpacerdesti: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(12),
    backgroundColor: colors.backgroundColor || '#F8F9FA',
    position: 'relative',
  },
  titleSpacernearest: {
    paddingHorizontal: scale(16),
    fontSize: scale(18),
    fontWeight: '700',
    marginBottom: verticalScale(8),
  },
  seeAllTextContainer: {
    position: 'absolute',
    top: verticalScale(20),
    right: scale(16),
    zIndex: 1,
  },
  seeAllText: {
    fontSize: scale(14),
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Schedule container styles
  scheduleContainer: {
    backgroundColor: colors.backgroundColor || '#F8F9FA',
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(12),
  },
  scheduleheadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(12),
  },

  // Category and product card styles
  categoryWrapper: {
    marginHorizontal: scale(6),
    alignItems: 'center',
  },
  itemCardContainer: {
    marginHorizontal: scale(8),
    marginVertical: verticalScale(4),
    borderRadius: scale(12),
    backgroundColor: colors.white || '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  // Shorts video styles
  shortsListContainer: {
    backgroundColor: colors.backgroundColor || '#F8F9FA',
  },
  shortItemContainer: {
    position: 'relative',
    backgroundColor: colors.black || '#000000',
    borderRadius: scale(12),
    marginHorizontal: scale(16),
    marginVertical: verticalScale(8),
    overflow: 'hidden',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoWrapper: {
    flex: 1,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  videoPlayer: {
    flex: 1,
    backgroundColor: colors.black || '#000000',
  },
  thumbnailImage: {
    width: '100%',
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    position: 'relative',
  },
  errorMessageContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: scale(8),
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // Video interaction styles
  interactionButtonsContainer: {
    position: 'absolute',
    right: scale(12),
    bottom: scale(80),
    alignItems: 'center',
    gap: verticalScale(16),
  },
  interactionButton: {
    alignItems: 'center',
    padding: scale(8),
  },
  interactionCount: {
    marginTop: verticalScale(4),
    fontSize: scale(12),
    textAlign: 'center',
    minWidth: scale(30),
  },

  // Video info overlay styles
  videoInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: scale(60),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
    paddingRight: scale(12),
  },
  videoTitle: {
    fontSize: scale(16),
    marginBottom: verticalScale(4),
    lineHeight: scale(20),
  },
  videoDescription: {
    fontSize: scale(14),
    opacity: 0.9,
    lineHeight: scale(18),
  },
  followButtonContainer: {
    alignSelf: 'flex-end',
  },

  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
    paddingHorizontal: scale(20),
  },

  // Bottom tab styles
  bottomTabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white || '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.borderColor || '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },

  // Loading skeleton styles
  skeletonContainer: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
  },
  skeletonCard: {
    backgroundColor: colors.lightGray || '#F5F5F5',
    borderRadius: scale(8),
    marginBottom: verticalScale(12),
    overflow: 'hidden',
  },
  skeletonShimmer: {
    backgroundColor: colors.white || '#FFFFFF',
    opacity: 0.7,
  },

  // Utility styles
  shadowCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  borderRadius: {
    borderRadius: scale(12),
  },
  marginHorizontal: {
    marginHorizontal: scale(16),
  },
  paddingHorizontal: {
    paddingHorizontal: scale(16),
  },
  paddingVertical: {
    paddingVertical: verticalScale(12),
  },
  centerAlign: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  flexRow: {
    flexDirection: 'row',
  },
  flexColumn: {
    flexDirection: 'column',
  },

  // Responsive design helpers
  smallScreen: {
    // Styles for screens < 350px width
    ...(width < 350 && {
      paddingHorizontal: scale(12),
      fontSize: scale(12),
    }),
  },
  largeScreen: {
    // Styles for screens > 400px width
    ...(width > 400 && {
      paddingHorizontal: scale(20),
      fontSize: scale(16),
    }),
  },

  // Animation and transition styles
  fadeIn: {
    opacity: 1,
  },
  fadeOut: {
    opacity: 0,
  },
  scaleUp: {
    transform: [{ scale: 1.05 }],
  },
  scaleNormal: {
    transform: [{ scale: 1 }],
  },

  // Accessibility styles
  accessibilityFocus: {
    borderWidth: 2,
    borderColor: colors.btncolor || '#007AFF',
  },
  accessibilityLabel: {
    fontSize: scale(16),
    color: colors.fontMainColor || '#1A1A1A',
    fontWeight: '500',
  },
});