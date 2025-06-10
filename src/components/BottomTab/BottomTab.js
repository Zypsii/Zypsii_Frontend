import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import styles from './styles';
import { scale, colors } from '../../utils';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

function BottomTab({ screen }) {
  const navigation = useNavigation();
  const [showUploadModal, setShowUploadModal] = useState(false);
 
  const getIconColor = (currentScreen) => {
    return screen === currentScreen ? colors.greenColor : colors.darkGrayText;
  };

  const getTextStyle = (currentScreen) => {
    return screen === currentScreen ? styles.activeText : styles.inactiveText;
  };

  const handleUploadPress = () => {
    setShowUploadModal(true);
  };

  const handleCreateReel = () => {
    setShowUploadModal(false);
    navigation.navigate('ShortsUpload');
  };

  const handleCreatePost = () => {
    setShowUploadModal(false);
    navigation.navigate('CreatePost');
  };

  return (
    <View style={styles.footerContainer}>
      {/* Home Icon */}
      <TouchableOpacity
        onPress={() => navigation.navigate('MainLanding')}
        style={styles.footerBtnContainer}
      >
        <MaterialCommunityIcons
          name="home"
          size={scale(20)}
          color={getIconColor('HOME')}
        />
        <Text style={getTextStyle('HOME')}>Home</Text>
      </TouchableOpacity>

      {/* Location Icon */}
      <TouchableOpacity
        onPress={() => navigation.navigate('WhereToGo')}
        style={styles.footerBtnContainer}
      >
        <View style={styles.imgContainer}>
          <SimpleLineIcons
            name="location-pin"
            size={scale(20)}
            color={getIconColor('WhereToGo')}
          />
        </View>
        <Text style={getTextStyle('WhereToGo')}>Where to Go</Text>
      </TouchableOpacity>

      {/* Upload Icon */}
      <TouchableOpacity
        onPress={handleUploadPress}
        style={styles.footerBtnContainer}
      >
        <MaterialCommunityIcons
          name="hexagon-outline"
          size={scale(20)}
          color={getIconColor('FAVOURITES')}
        />
        <Text style={getTextStyle('FAVOURITES')}>Upload</Text>
      </TouchableOpacity>

      {/* Split/Expense Calculator Icon */}
      <TouchableOpacity
        onPress={() => navigation.navigate('SplitDashboard')}
        style={styles.footerBtnContainer}
      >
        <MaterialIcons
          name="attach-money"
          size={scale(20)}
          color={getIconColor('SPLIT')}
        />
        <Text style={getTextStyle('SPLIT')}>Split</Text>
      </TouchableOpacity>

      {/* Profile Icon */}
      <TouchableOpacity
        onPress={() => navigation.navigate('DummyScreen')}
        style={styles.footerBtnContainer}
      >
        <View style={styles.profileContainer}>
          <MaterialCommunityIcons
            name="menu"
            size={scale(20)}
            color={getIconColor('PROFILE')}
          />
        </View>
        <Text style={getTextStyle('PROFILE')}>Menu</Text>
      </TouchableOpacity>

      {/* Upload Options Modal */}
      <Modal
        visible={showUploadModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <TouchableOpacity 
          style={modalStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUploadModal(false)}
        >
          <View style={modalStyles.modalContent}>
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>Create New</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={modalStyles.optionButton}
              onPress={handleCreateReel}
            >
              <MaterialCommunityIcons name="video-plus" size={24} color={colors.Zypsii_color} />
              <Text style={modalStyles.optionText}>Create Reel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={modalStyles.optionButton}
              onPress={handleCreatePost}
            >
              <MaterialCommunityIcons name="image-plus" size={24} color={colors.Zypsii_color} />
              <Text style={modalStyles.optionText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
});

export default BottomTab;
