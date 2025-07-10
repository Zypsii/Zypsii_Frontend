import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { BackHeader, BottomTab } from '../../components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { alignment, colors } from '../../utils';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

const TripDetail = ({ route, navigation }) => {
  const { tripData } = route.params || {};
  const [activeDay, setActiveDay] = useState(1);
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placeDescriptions, setPlaceDescriptions] = useState([]);
  const [isBackButtonLoading, setIsBackButtonLoading] = useState(false);
  
  // New state for members management
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null); // Track which request is being processed
  
  // Function to check if trip is expired
  const isTripExpired = () => {
    if (safeTripData.expired !== undefined) {
      return safeTripData.expired;
    }
    
    // Fallback: check if end date has passed
    if (safeTripData.Dates?.end) {
      const endDate = new Date(safeTripData.Dates.end);
      const currentDate = new Date();
      return endDate < currentDate;
    }
    
    // If no end date, check if the trip date has passed
    if (safeTripData.date) {
      const tripDate = new Date(safeTripData.date);
      const currentDate = new Date();
      return tripDate < currentDate;
    }
    
    return false;
  };

  // Get trip status text and color
  const getTripStatus = () => {
    const expired = isTripExpired();
    return {
      text: expired ? 'Completed' : 'Active',
      color: expired ? enhancedColors.success : enhancedColors.primary,
      backgroundColor: expired ? enhancedColors.success + '20' : enhancedColors.primary + '20',
      icon: expired ? 'flag-checkered' : 'flag',
      statusIcon: expired ? 'check-circle' : 'play-circle'
    };
  };

  // Default values if tripData is undefined
  const defaultTripData = {
    id: '',
    title: 'Trip',
    from: 'Starting Point',
    to: 'End Point',
    date: new Date().toISOString().split('T')[0],
    numberOfDays: '1',
    imageUrl: null,
    locationDetails: [],
    riders: '1',
    travelMode: 'Bike',
    visible: 'Public'
  };

  // Use tripData if available, otherwise use default values
  const safeTripData = tripData || defaultTripData;
  
  // Enhanced color scheme
  const enhancedColors = {
    primary: colors.btncolor || '#4A90E2',
    primaryDark: '#357ABD',
    primaryLight: '#E3F2FD',
    secondary: '#FF6B6B',
    accent: '#4ECDC4',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
    border: '#E1E8ED',
    shadow: 'rgba(0, 0, 0, 0.1)',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
  };
  
  const getFixedLocations = () => {
    const allLocations = safeTripData.locationDetails;
    return {
      from: allLocations[0]?.name || 'Starting Point',
      to: allLocations[allLocations.length - 1]?.name || 'End Point'
    };
  };

  console.log('TripDetail Debug Info:', {
    tripData: safeTripData,
    expired: safeTripData.expired,
    isTripExpired: isTripExpired(),
    tripStatus: getTripStatus(),
    endDate: safeTripData.Dates?.end,
    tripDate: safeTripData.date
  });

  useEffect(() => {
    getPlaceDescriptions();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        setCurrentUser(JSON.parse(user));
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const getPlaceDescriptions = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(
        `${base_url}/schedule/places/getNearest`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.data) {
        const descriptions = response.data.data.map(place => ({
          id: place._id,
          name: place.name,
          description: place.description || place.address,
          location: place.location
        }));
        setPlaceDescriptions(descriptions);
      }
    } catch (error) {
      console.error('Error fetching place descriptions:', error);
      setPlaceDescriptions([]);
    }
  };

  // Fetch joined members
  const fetchJoinedMembers = async () => {
    try {
      setLoadingMembers(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        console.error('Authentication required');
        return;
      }

      console.log('Fetching joined members...');
      console.log('API URL:', `${base_url}/schedule/listing/join-request/filter?accepted=true`);

      const response = await fetch(`${base_url}/schedule/listing/join-request/filter?accepted=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Joined members response status:', response.status);
      
      const data = await response.json();
      console.log('Joined members response data:', data);
      
      if (response.ok && data.status) {
        setMembersList(data.data || []);
        console.log('Joined members loaded:', data.data?.length || 0);
      } else {
        console.error('Failed to fetch joined members:', data.message);
      }
    } catch (error) {
      console.error('Error fetching joined members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch requested members
  const fetchRequestedMembers = async () => {
    try {
      setLoadingRequests(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        console.error('Authentication required');
        return;
      }

      console.log('Fetching requested members...');
      console.log('API URL:', `${base_url}/schedule/listing/join-requested/users-list`);

      const response = await fetch(`${base_url}/schedule/listing/join-requested/users-list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Requested members response status:', response.status);
      
      const data = await response.json();
      console.log('Requested members response data:', data);
      
      if (response.ok && data.status) {
        setRequestsList(data.data || []);
        console.log('Requested members loaded:', data.data?.length || 0);
      } else {
        console.error('Failed to fetch requested members:', data.message);
      }
    } catch (error) {
      console.error('Error fetching requested members:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Handle accept/reject request
  const handleAcceptRejectRequest = async (requestId, accept) => {
    try {
      console.log(`Processing ${accept ? 'accept' : 'reject'} request for ID:`, requestId);
      
      // Set loading state for this specific request
      setProcessingRequest(requestId);
      
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        console.error('Authentication required');
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      const requestBody = {
        requestId,
        accept
      };

      console.log('Request payload:', requestBody);
      console.log('API URL:', `${base_url}/schedule/join-request/accept-reject`);

      const response = await fetch(`${base_url}/schedule/join-request/accept-reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.status) {
        const action = accept ? 'accepted' : 'rejected';
        console.log(`Request ${action} successfully`);
        Alert.alert('Success', `Request ${action} successfully`);
        
        // Refresh the requests list
        await fetchRequestedMembers();
      } else {
        const errorMessage = data.message || 'Failed to process request';
        console.error('Failed to process request:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      // Clear loading state
      setProcessingRequest(null);
    }
  };

  const backPressed = () => {
    if (isBackButtonLoading) return;
    
    setIsBackButtonLoading(true);
    try {
      navigation.goBack();
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setTimeout(() => {
        setIsBackButtonLoading(false);
      }, 1000);
    }
  };

  const getLocationsForDay = (day) => {
    if (scheduleData && scheduleData.length > 0) {
      const dayData = scheduleData.find(item => item.day === day);
      if (dayData && dayData.locations && dayData.locations.length > 0) {
        return dayData.locations.map(location => {
          const placeInfo = placeDescriptions.find(place => place.id === location.id);
          return {
            ...location,
            description: placeInfo?.description || location.description
          };
        });
      }
    }
    
    const locationsPerDay = Math.ceil(safeTripData.locationDetails.length / parseInt(safeTripData.numberOfDays));
    const startIndex = (day - 1) * locationsPerDay;
    const endIndex = Math.min(startIndex + locationsPerDay, safeTripData.locationDetails.length);
    const locations = safeTripData.locationDetails.slice(startIndex, endIndex);
    
    return locations.map(location => {
      const placeInfo = placeDescriptions.find(place => place.id === location.id);
      return {
        ...location,
        description: placeInfo?.description || location.description
      };
    });
  };

  const getDayTitle = (day) => {
    if (scheduleData && scheduleData.length > 0) {
      const dayData = scheduleData.find(item => item.day === day);
      if (dayData && dayData.description) {
        return dayData.description;
      }
    }
    
    const dayLocations = getLocationsForDay(day);
    if (dayLocations.length > 0) {
      return dayLocations[0].name || `Day ${day}`;
    }
    return `Day ${day}`;
  };

  const daysWithLocations = Array.from(
    { length: parseInt(safeTripData.numberOfDays) }, 
    (_, i) => i + 1
  ).filter(day => getLocationsForDay(day).length > 0);

  const openMembersModal = () => {
    setShowMembersModal(true);
    fetchJoinedMembers();
  };

  const openRequestsModal = () => {
    setShowRequestsModal(true);
    fetchRequestedMembers();
  };

  // Render member item
  const renderMemberItem = ({ item }) => (
    <View style={styles.memberItem}>
      <Image
        source={{ 
          uri: item.requestUserId?.profilePicture || 'https://via.placeholder.com/50'
        }}
        style={styles.memberAvatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {item.requestUserId?.fullName || item.requestUserId?.userName || 'Unknown User'}
        </Text>
        <Text style={styles.memberUsername}>
          @{item.requestUserId?.userName || 'username'}
        </Text>
      </View>
      <View style={styles.memberStatus}>
        <Text style={styles.acceptedText}>✓ Accepted</Text>
      </View>
    </View>
  );

  // Render request item
  const renderRequestItem = ({ item }) => {
    const isProcessing = processingRequest === item._id;
    
    return (
      <View style={styles.memberItem}>
        <Image
          source={{ 
            uri: item.requestUserId?.avatar || 'https://via.placeholder.com/50'
          }}
          style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.requestUserId?.fullName || item.requestUserId?.userName || 'Unknown User'}
          </Text>
          <Text style={styles.memberUsername}>
            @{item.requestUserId?.userName || 'username'}
          </Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.acceptButton,
              isProcessing && styles.disabledButton
            ]}
            onPress={() => handleAcceptRejectRequest(item._id, true)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Accept</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.rejectButton,
              isProcessing && styles.disabledButton
            ]}
            onPress={() => handleAcceptRejectRequest(item._id, false)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Reject</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDayPlan = ({ item, index, arrayLength }) => (
    <View style={[styles.dayPlanItem, { borderColor: enhancedColors.border }]}>
      <View style={styles.iconAndLineContainer}>
        <View style={[styles.locationIconContainer, { backgroundColor: enhancedColors.primary }]}>
          <Icon name="map-marker" size={16} color={enhancedColors.surface} />
        </View>
        {index < arrayLength - 1 && (
          <View style={[styles.dottedLine, { backgroundColor: enhancedColors.border }]} />
        )}
      </View>
      <View style={styles.locationDetails}>
        <Text style={[styles.location, { color: enhancedColors.text }]}>{item.name}</Text>
        <Text style={[styles.locationAddress, { color: enhancedColors.textSecondary }]}>
          {item.address}
        </Text>
        {item.distanceInKilometer && (
          <View style={styles.distanceContainer}>
            <Icon name="road-variant" size={12} color={enhancedColors.accent} />
            <Text style={[styles.locationDistance, { color: enhancedColors.accent }]}>
              {item.distanceInKilometer}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Check if current user is the schedule creator
  const isScheduleCreator = currentUser && safeTripData.createdBy && 
    (currentUser._id === safeTripData.createdBy._id || currentUser._id === safeTripData.createdBy);

  // Debug logging
  console.log('TripDetail Debug Info:', {
    currentUser: currentUser,
    tripCreatedBy: safeTripData.createdBy,
    isScheduleCreator: isScheduleCreator,
    currentUserId: currentUser?._id,
    tripCreatorId: safeTripData.createdBy?._id || safeTripData.createdBy
  });

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: enhancedColors.background 
    },
    topSection: { 
      flexDirection: 'row', 
      paddingHorizontal: 20,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 60,
      zIndex: 3
    },
    maincontainer: {
      flex: 1,
      zIndex: 2
    },
    fromToSection: { 
      flex: 1, 
      flexDirection: 'column', 
      alignItems: 'flex-start',
      backgroundColor: enhancedColors.surface,
      padding: 20,
      borderRadius: 15,
      marginRight: 15,
      shadowColor: enhancedColors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    fromToHeading: {
      fontSize: 14,
      fontWeight: '600',
      color: enhancedColors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    locationInfo: { 
      flexDirection: 'row', 
      alignItems: 'center',
      marginVertical: 8,
      width: '100%'
    },
    locationText: { 
      fontSize: 16, 
      fontWeight: '700', 
      marginLeft: 8, 
      color: enhancedColors.text,
      flex: 1
    },
    verticalLine: {
      width: 2,
      height: 25,
      backgroundColor: enhancedColors.primary,
      marginLeft: 8,
      marginVertical: 8,
      borderRadius: 1,
    },
    image: { 
      width: 120, 
      height: 120, 
      borderRadius: 20,
      borderWidth: 3,
      borderColor: enhancedColors.surface,
      shadowColor: enhancedColors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    backgroundCurvedContainer: {
      backgroundColor: enhancedColors.primary,
      height: 250,
      width: '100%',
      position: 'absolute',
      top: 0,
      zIndex: 0,
    },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginHorizontal: 20,
      marginTop: 15,
      borderRadius: 25,
      gap: 8,
      shadowColor: enhancedColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 2,
    },
    statusBannerText: {
      fontSize: 16,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    protractorShape: {
      backgroundColor: enhancedColors.background,
      height: 600,
      width: 1200,
      borderTopLeftRadius: 600,
      borderTopRightRadius: 600,
      position: 'absolute',
      top: 120,
      alignSelf: 'center',
      zIndex: 1,
      overflow: 'hidden',
    },
    ridersDateContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 20,
      marginVertical: 20,
      backgroundColor: enhancedColors.surface,
      padding: 15,
      borderRadius: 12,
      shadowColor: enhancedColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 2,
    },
    statusAndRidersContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 15,
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    riders: { 
      fontSize: 15, 
      color: enhancedColors.text, 
      fontWeight: '600',
      backgroundColor: enhancedColors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    date: { 
      fontSize: 15, 
      color: enhancedColors.text, 
      fontWeight: '600',
      flexDirection: 'row',
      alignItems: 'center',
    },
    tripPlanSection: { 
      paddingHorizontal: 20,
      marginTop: 10,
      zIndex: 2,
    },
    sectionTitle: { 
      fontSize: 22, 
      fontWeight: '700', 
      marginBottom: 15, 
      textAlign: 'center',
      color: enhancedColors.text,
    },
    sectionTitleplan: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: enhancedColors.primary,
      borderRadius: 25,
      color: enhancedColors.surface,
      alignSelf: 'center',
      marginBottom: 20,
      shadowColor: enhancedColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    daysTabs: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      marginBottom: 20,
      backgroundColor: enhancedColors.surface,
      borderRadius: 15,
      padding: 5,
      shadowColor: enhancedColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    dayTab: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      minWidth: 80,
      alignItems: 'center',
    },
    activeTab: { 
      backgroundColor: enhancedColors.primary,
      shadowColor: enhancedColors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    dayTabText: { 
      fontSize: 14, 
      color: enhancedColors.textSecondary, 
      fontWeight: '600',
      textAlign: 'center',
    },
    activeTabText: { 
      color: enhancedColors.surface,
      fontWeight: '700',
    },
    dayPlanList: { 
      backgroundColor: enhancedColors.surface,
      borderRadius: 15,
      padding: 15,
      marginBottom: 100,
      shadowColor: enhancedColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    dayPlanItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: enhancedColors.border,
      marginHorizontal: 5,
    },
    iconAndLineContainer: {
      alignItems: 'center',
      marginRight: 15,
      paddingTop: 2,
    },
    locationIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: enhancedColors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    dottedLine: {
      width: 2,
      height: 30,
      marginVertical: 8,
      borderRadius: 1,
    },
    locationDetails: {
      flex: 1,
      paddingTop: 2,
    },
    location: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
      lineHeight: 22,
    },
    locationAddress: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 6,
    },
    distanceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    locationDistance: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    buttonContainer: { 
      flexDirection: 'row', 
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: enhancedColors.surface,
      borderTopWidth: 1,
      borderTopColor: enhancedColors.border,
      position: 'absolute',
      bottom: 60,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    button: { 
      flex: 1, 
      marginHorizontal: 5, 
      paddingVertical: 14,
      paddingHorizontal: 12,
      backgroundColor: enhancedColors.primary, 
      borderRadius: 12,
      shadowColor: enhancedColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    buttonText: { 
      textAlign: 'center', 
      color: enhancedColors.surface, 
      fontWeight: '700',
      fontSize: 14,
    },
    disabledButton: {
      opacity: 0.5,
      shadowOpacity: 0.1,
      elevation: 2,
    },
    BottomTab: {
      zIndex: 5,
    },
    // New styles for members management
    membersSection: {
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    membersButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    memberButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: enhancedColors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      elevation: 2,
      shadowColor: enhancedColors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    memberButtonText: {
      color: enhancedColors.surface,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: enhancedColors.surface,
      borderRadius: 12,
      width: '90%',
      maxHeight: '80%',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: enhancedColors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: enhancedColors.text,
    },
    closeButton: {
      padding: 4,
    },
    modalLoading: {
      padding: 40,
      alignItems: 'center',
    },
    modalList: {
      padding: 16,
    },
    // Member item styles
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: enhancedColors.surface,
      borderRadius: 8,
      marginBottom: 8,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: enhancedColors.text,
    },
    memberUsername: {
      fontSize: 14,
      color: enhancedColors.textSecondary,
      marginTop: 2,
    },
    memberStatus: {
      alignItems: 'flex-end',
    },
    acceptedText: {
      fontSize: 12,
      color: enhancedColors.success,
      fontWeight: '600',
    },
    requestActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      minWidth: 60,
      alignItems: 'center',
    },
    acceptButton: {
      backgroundColor: enhancedColors.success,
    },
    rejectButton: {
      backgroundColor: enhancedColors.error,
    },
    actionButtonText: {
      color: enhancedColors.surface,
      fontSize: 12,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: enhancedColors.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
    debugText: {
      fontSize: 12,
      color: enhancedColors.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.protractorShape} />
      <View style={styles.backgroundCurvedContainer} />
      <View style={styles.maincontainer}>
        
        <BackHeader 
          backPressed={backPressed}
          navigation={navigation}
          title="Trip Details"
          style={{ marginTop: 20, zIndex: 4 }}
        />

        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <View style={styles.fromToSection}>
              <Text style={styles.fromToHeading}>From</Text>
              <TouchableOpacity style={styles.locationInfo}>
                <Icon name="map-marker-outline" size={20} color={enhancedColors.primary} />
                <Text style={styles.locationText}>
                  {getFixedLocations().from}
                </Text>
              </TouchableOpacity>
              <View style={styles.verticalLine} />
              <Text style={styles.fromToHeading}>To</Text>
              <TouchableOpacity style={styles.locationInfo}>
                <Icon name="map-marker-outline" size={20} color={enhancedColors.primary} />
                <Text style={styles.locationText}>
                  {getFixedLocations().to}
                </Text>
              </TouchableOpacity>
            </View>

            <Image source={{ uri: safeTripData.imageUrl }} style={styles.image} />
          </View>

          {/* Trip Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: getTripStatus().backgroundColor }]}>
            <Icon 
              name={getTripStatus().icon} 
              size={20} 
              color={getTripStatus().color} 
            />
            <Text style={[styles.statusBannerText, { color: getTripStatus().color }]}>
              {getTripStatus().text} Trip
            </Text>
          </View>

          <View style={styles.ridersDateContainer}>
            <Text style={styles.date}>
              <Icon name="calendar-outline" size={18} color={enhancedColors.primary} /> 
              {' '}
              {scheduleData[activeDay - 1]?.date 
                ? new Date(scheduleData[activeDay - 1].date).toLocaleDateString() 
                : safeTripData.date}
            </Text>
            <View style={styles.statusAndRidersContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getTripStatus().backgroundColor }]}>
                <Icon 
                  name={getTripStatus().statusIcon} 
                  size={14} 
                  color={getTripStatus().color} 
                />
                <Text style={[styles.statusText, { color: getTripStatus().color }]}>
                  {getTripStatus().text}
                </Text>
              </View>
              <Text style={styles.riders}>
                🏍️ Riders: {safeTripData.riders}
              </Text>
            </View>
          </View>

          {/* Members Management Section - Always show for testing */}
          <View style={styles.membersSection}>
            
            <View style={styles.membersButtons}>
              <TouchableOpacity
                style={styles.memberButton}
                onPress={openMembersModal}
              >
                <Icon name="account-group" size={20} color={enhancedColors.surface} />
                <Text style={styles.memberButtonText}>View Joined Members</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.memberButton}
                onPress={openRequestsModal}
              >
                <Icon name="account-clock" size={20} color={enhancedColors.surface} />
                <Text style={styles.memberButtonText}>View Requests</Text>
              </TouchableOpacity>
            </View>
            
          </View>

          <View style={styles.tripPlanSection}>
            <View style={styles.daysTabs}>
              {daysWithLocations.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayTab, activeDay === day && styles.activeTab]}
                  onPress={() => setActiveDay(day)}
                >
                  <Text style={[styles.dayTabText, activeDay === day && styles.activeTabText]}>
                    Day {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dayPlanList}>
              <FlatList
                data={getLocationsForDay(activeDay)}
                renderItem={({ item, index }) =>
                  renderDayPlan({
                    item,
                    index,
                    arrayLength: getLocationsForDay(activeDay).length,
                  })
                }
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, !daysWithLocations.find(day => day > activeDay) && styles.disabledButton]}
          onPress={() => {
            const nextDay = daysWithLocations.find(day => day > activeDay);
            if (nextDay) {
              setActiveDay(nextDay);
            }
          }}
          disabled={!daysWithLocations.find(day => day > activeDay)}
        >
          <Text style={styles.buttonText}>➡️ Next Day</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate('Map', { 
              // Pass complete trip data
              tripData: safeTripData,
              // Pass all locations from all days
              allLocations: safeTripData.locationDetails,
              // Pass current day's locations
              currentDayLocations: getLocationsForDay(activeDay).map(location => ({
                name: location.name,
                address: location.address,
                location: location.location,
                distanceInKilometer: location.distanceInKilometer
              })),
              // Pass current active day
              activeDay: activeDay,
              // Pass total number of days
              totalDays: parseInt(safeTripData.numberOfDays),
              // Pass schedule data if available
              scheduleData: scheduleData,
              // Pass trip ID for API calls
              tripId: safeTripData.id,
              // Pass from and to locations
              fromLocation: getFixedLocations().from,
              toLocation: getFixedLocations().to,
              // Pass trip metadata
              tripMetadata: {
                title: safeTripData.title,
                date: safeTripData.date,
                riders: safeTripData.riders,
                travelMode: safeTripData.travelMode,
                visible: safeTripData.visible,
                imageUrl: safeTripData.imageUrl,
                createdBy: safeTripData.createdBy,
                createdAt: safeTripData.createdAt,
                updatedAt: safeTripData.updatedAt
              }
            })
          }
        >
          <Text style={styles.buttonText}>🗺️ Map</Text>
        </TouchableOpacity>
      </View>

      {/* Joined Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Joined Members</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMembersModal(false)}
              >
                <Icon name="close" size={24} color={enhancedColors.text} />
              </TouchableOpacity>
            </View>
            
            {loadingMembers ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={enhancedColors.primary} />
                <Text style={styles.emptyStateText}>Loading members...</Text>
              </View>
            ) : (
              <FlatList
                data={membersList}
                renderItem={renderMemberItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.modalList}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Icon name="account-group-outline" size={48} color={enhancedColors.textSecondary} />
                    <Text style={styles.emptyStateText}>No joined members yet</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Requested Members Modal */}
      <Modal
        visible={showRequestsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Requests</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowRequestsModal(false)}
              >
                <Icon name="close" size={24} color={enhancedColors.text} />
              </TouchableOpacity>
            </View>
            
            {loadingRequests ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={enhancedColors.primary} />
                <Text style={styles.emptyStateText}>Loading requests...</Text>
              </View>
            ) : (
              <FlatList
                data={requestsList}
                renderItem={renderRequestItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.modalList}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Icon name="account-clock-outline" size={48} color={enhancedColors.textSecondary} />
                    <Text style={styles.emptyStateText}>No pending requests</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      <BottomTab screen="WhereToGo" style={styles.BottomTab} />
    </View>
  );
};

export default TripDetail;