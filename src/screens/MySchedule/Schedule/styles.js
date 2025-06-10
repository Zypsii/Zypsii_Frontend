import { StyleSheet } from 'react-native';
import { alignment, colors } from '../../../utils';
import { scale } from '../../../utils';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    ...alignment.PTsmall,
    zIndex: 2, // Place it above the protractorShape
    position: 'relative', // Adjust from absolute to prevent overlap
    width: '100%',
    ...alignment.Pmedium
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  header: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#333',
  },
  viewAll: {
    fontSize: scale(14),
    color: colors.btncolor,
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.lightpink,
    borderRadius: scale(20),
    padding: scale(10),
    marginBottom: scale(10),
    ...alignment.MBmedium,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    elevation: 4
  },
  image: {
    width: scale(100),
    height: scale(110),
    borderRadius: scale(25),
    marginRight: scale(10),
    marginTop: 4
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(5),
  },
  routeRow: {
    flexDirection: 'colum',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: scale(5),
  },
  routeItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  routeLabel: {
    fontSize: scale(12),
    color: '#555',
    fontWeight: 'bold',
  },
  routeText: {
    fontSize: scale(14),
    color: '#555',
    marginTop: scale(5),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dash: {
    fontSize: scale(12),
    color: '#555',
    alignSelf: 'center',
  },
  date: {
    fontSize: scale(12),
    color: '#777',
    marginTop: scale(5),
  },
  riders: {
    fontSize: scale(12),
    color: '#777',
    marginTop: scale(5),
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(5),
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: scale(4),
    fontSize: scale(14),
    color: colors.Zypsii_color,
  },
  nameText: {
    fontSize: scale(14),
    color: '#333',
    fontWeight: '500',
  },
  joinedButton: {
    backgroundColor: colors.btncolor,
    borderRadius: scale(30),
    paddingVertical: scale(5),
    paddingHorizontal: scale(15),
    marginTop: scale(90),
  },
  joinedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(20),
    width: scale(36),
    height: scale(36),
    position: 'absolute',
    right: scale(10),
    top: scale(10),
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  moreButton: {
    position: 'absolute',
    right: scale(10),
    top: scale(10),
    zIndex: 1,
    padding: scale(5),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: scale(10),
    padding: scale(10),
    width: scale(200),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: scale(8),
  },
  menuText: {
    marginLeft: scale(10),
    fontSize: scale(16),
    color: '#333',
  },
  deleteMenuItem: {
    marginTop: scale(5),
  },
  deleteMenuText: {
    color: '#FF3B30',
  },
});
