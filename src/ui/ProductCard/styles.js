import { StyleSheet, Dimensions } from 'react-native'
import { alignment, colors, scale} from '../../utils'

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  cardContainer: {
    width: width * 0.4,
    backgroundColor: colors.white,
    borderRadius: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    margin: 5,
    overflow: 'visible',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  topCardContainer: {
    width: '100%',
    position: 'relative',
  },
  imgResponsive: {
    width: '100%',
    height: 200,
    resizeMode: 'cover'
  },
  botCardContainer: {
    padding: 10,
    backgroundColor: colors.white,
    paddingBottom: 5,
  },
  botSubCardContainer: {
    width: '100%',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: colors.fontThirdColor,
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: colors.fontMainColor,
    marginLeft: 4,
    fontWeight: '500',
  },
  aboutRestaurant: {
    width: '20%',
    justifyContent: 'center'
  },
  likeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 5,
  },
  offerContainer: {
    position: 'absolute', // Positioned relative to the parent container
    top: 0, // Distance from the top edge
    left: 0, // Distance from the left edge
    backgroundColor: colors.greenColor, // Green background color
    paddingHorizontal: 10, // Horizontal padding
    paddingVertical: 5, // Vertical padding
    borderRadius: 5, // Rounded corners
    zIndex: 1, // Ensure it appears above the image
  }, 
  font: {
    marginLeft: 2,
    backgroundColor: 'aqua',
    alignContent: 'center'
  },
  locationText: {
    fontSize: scale(12),
    color: colors.grayColor,
    marginTop: scale(4),
  },
});

export default styles;
