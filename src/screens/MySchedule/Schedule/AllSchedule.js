import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { styles } from './styles';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import Icon from 'react-native-vector-icons/Ionicons'; // Import vector icons
import { AntDesign } from '@expo/vector-icons'; // Import AntDesign icons
import { colors } from '../../../utils';// Import colors
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../../utils/base_url';

const AllSchedule = ({item, isFromProfile}) => {
  const navigation = useNavigation(); // Access navigation object
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [fromPlace, setFromPlace] = useState('');
  const [toPlace, setToPlace] = useState('');
  const [isJoined, setIsJoined] = useState(item.joined || false);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        const parsedUser = user ? JSON.parse(user) : null;
        if (parsedUser && parsedUser._id) {
          setCurrentUserId(parsedUser._id);
        }
      } catch (error) {
        console.error('Error loading user ID:', error);
      }
    };
    loadUserId();

    // Set place names from locationDetails
    if (item.locationDetails && item.locationDetails.length >= 2) {
      setFromPlace(item.locationDetails[0].address || 'Unknown location');
      setToPlace(item.locationDetails[item.locationDetails.length - 1].address || 'Unknown location');
    }
  }, [item]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setShowMenu(false);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      // Log the entire item to see all available properties
      // Check if we have the required IDs
      if (!item.createdBy || !item.id) {
        Alert.alert('Error', 'Missing required schedule information');
        return;
      }


      const response = await fetch(`${base_url}/schedule/delete/descriptions/${item.id}/${item.createdBy}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Delete API Response:', data);

      if (response.ok && data.status) {
        console.log('Schedule deleted successfully');
        Alert.alert('Success', 'Schedule deleted successfully');
      } else {
        console.log('Delete failed:', data.message);
        Alert.alert('Error', data.message || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Delete Error Details:', {
        message: error.message,
        stack: error.stack,
        item: item
      });
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    navigation.navigate('EditSchedule', { scheduleData: item });
  };

  const handleCardPress = (item) => {
    navigation.navigate('TripDetail', { tripData: item }); // Navigate and pass data
  };

  const handleJoin = async () => {
    if (isJoining) {
      return;
    }

    try {
      setIsJoining(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      const user = await AsyncStorage.getItem('user');
      const parsedUser = user ? JSON.parse(user) : null;
      
      if (!parsedUser || !parsedUser._id) {
        Alert.alert('Error', 'User information not found');
        return;
      }

      const postData = {
        scheduleId: item.id,
        scheduleCreatedBy: parsedUser._id
      };

      const response = await fetch(`${base_url}/schedule/join-un-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });
      
      const data = await response.json();

      if (response.ok && data.status) {
        setIsJoined(!isJoined);
        Alert.alert('Success', isJoined ? 'Successfully unjoined the schedule' : 'Successfully joined the schedule');
      } else {
        if (data.message === 'Internal Server Error') {
          Alert.alert('Error', 'Unable to process request. Please try again later.');
        } else {
          Alert.alert('Error', data.message || 'Failed to process request');
        }
      }
    } catch (error) {
      console.error('Join/Unjoin Error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const isScheduleCreator = currentUserId === item.creatorId;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        key={item.id}
        style={[styles.card, { padding: 10 }]}
        onPress={() => handleCardPress(item)}
      >
        {isFromProfile &&  (
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => setShowMenu(true)}
          >
            <Icon name="ellipsis-vertical" size={20} color="#333" />
          </TouchableOpacity>
        )}
        <Image source={{ uri: item.imageUrl }} style={[styles.image, { height: 120 }]} />
        <View style={[styles.cardContent, { padding: 8 }]}>
          <Text style={[styles.title, { fontSize: 16, marginBottom: 4 }]}>{item.title}</Text>
          <View style={styles.routeRow}>
            <View style={styles.routeItem}>
              <Text style={[styles.routeLabel, { fontSize: 12 }]}>From</Text>
              <View style={styles.locationRow}>
                <Icon name="location-outline" size={14} color="#333" />
                <Text style={[styles.routeText, { fontSize: 13 }]}>
                  {fromPlace.length > 20 ? fromPlace.slice(0, 20) + '...' : fromPlace}
                </Text>
              </View>
            </View>
            <View style={[styles.routeItem, { marginTop: 4 }]}>
              <Text style={[styles.routeLabel, { fontSize: 12 }]}>To</Text>
              <View style={styles.locationRow}>
                <Icon name="location-outline" size={14} color="#333" />
                <Text style={[styles.routeText, { fontSize: 13 }]}>
                  {toPlace.length > 20 ? toPlace.slice(0, 20) + '...' : toPlace}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.date, { marginRight: 10, fontSize: 11 }]}>📅 {item.date}</Text>
            <Text style={[styles.riders, { fontSize: 11 }]}>🏍️ ({item.riders})</Text>
          </View>
        </View>
        {!isScheduleCreator && (
          <TouchableOpacity 
            style={[
              styles.joinedButton, 
              isJoining && styles.disabledButton,
              isJoined && styles.joinedButtonActive
            ]} 
            onPress={handleJoin}
            disabled={isJoining}
          >
            <Text style={styles.joinedText}>
              {isJoining ? 'Processing...' : (isJoined ? 'Joined' : 'Join')}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleEdit}
            >
              <Icon name="create-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <Icon name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.menuText, styles.deleteMenuText]}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default AllSchedule;
