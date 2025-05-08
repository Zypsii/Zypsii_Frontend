import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Alert } from 'react-native';
import { styles } from './styles';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import Icon from 'react-native-vector-icons/Ionicons'; // Import vector icons
import { AntDesign } from '@expo/vector-icons'; // Import AntDesign icons
import { colors } from '../../../utils';// Import colors
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../../utils/base_url';

const AllSchedule = ({item}) => {
  const navigation = useNavigation(); // Access navigation object
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

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
  }, []);

  const handleCardPress = (item) => {
    navigation.navigate('TripDetail', { tripData: item }); // Navigate and pass data
  };

  const handleJoin = async () => {
    // Prevent joining if already joined or currently joining
    if (item.joined || isJoining) {
      return;
    }

    try {
      setIsJoining(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      // Get the current user's ID from AsyncStorage
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
        item.joined = true;
        Alert.alert('Success', 'Successfully joined the schedule');
      } else {
        // Handle specific error cases
        if (data.message === 'Internal Server Error') {
          Alert.alert('Error', 'Unable to join schedule. Please try again later.');
        } else {
          Alert.alert('Error', data.message || 'Failed to join schedule');
        }
      }
    } catch (error) {
      console.error('Join Error:', error);
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
            style={styles.card}
            onPress={() => handleCardPress(item)} // Navigate to TripDetail
          >
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={styles.cardContent}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.routeRow}>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>From</Text>
                  <View style={styles.locationRow}>
                    <Icon name="location-outline" size={16} color="#333" />
                    <Text style={styles.routeText}>
                    {item.from.length > 5 ? item.from.slice(0, 5) + '...' : item.from}
                  </Text>
                  </View>
                </View>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>To</Text>
                  <View style={styles.locationRow}>
                    <Icon name="location-outline" size={16} color="#333" />
                    <Text style={styles.routeText}>
                      {item.to.length > 5 ? item.to.slice(0, 5) + '...' : item.to}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.date}>📅 {item.date}</Text>
              <Text style={styles.riders}>🏍️ ({item.riders})</Text>
              {/* <View style={styles.ratingContainer}>
                <View style={styles.ratingStars}>
                  <AntDesign name="star" size={18} color={colors.Zypsii_color} />
                  <Text style={styles.ratingText}>{item.rating || '0.0'}</Text>
                </View>
                <Text style={styles.nameText}>{item.fullName}</Text>
              </View> */}
            </View>
            {!isScheduleCreator && (
              <TouchableOpacity 
                style={[styles.joinedButton, isJoining && styles.disabledButton]} 
                onPress={handleJoin}
                disabled={isJoining}
              >
                <Text style={styles.joinedText}>
                  {isJoining ? 'Joining...' : (item.joined ? 'Joined' : 'Join')}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
       
    </View>
  );
};

export default AllSchedule;
