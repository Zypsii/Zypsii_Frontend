import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Linking,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps"; // MapView for location selection
import Icon from "react-native-vector-icons/Ionicons"; // Import Icon library
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; // Image picker for cover image
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { updateSchedule, updateDayLocation, setSubmitted, resetSchedule } from '../../redux/slices/scheduleSlice';
import styles from "./styles";
import { base_url } from "../../utils/base_url";
import { colors } from '../../utils/colors';
import CustomLoader from '../../components/Loader/CustomLoader';
import { BackHeader } from '../../components';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

function MakeSchedule() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const schedule = useSelector(state => state.schedule);
  console.log(route)
  
  const {
    bannerImage,
    tripName,
    travelMode,
    visible,
    locationFrom,
    locationTo,
    fromDate,
    toDate,
    days,
    isSubmitted
  } = schedule;

  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeType, setTimeType] = useState('start'); // 'start' or 'end'

  // Reset schedule data when component mounts
  useEffect(() => {
    // Only reset if there's no existing data
    if (!days || days.length === 0) {
      dispatch(resetSchedule());
    }

    // Set the data from route params if available
    if (route.params?.destinationData) {
      const { image, name, tolatitude, tolongitude } = route.params.destinationData;
      
      // Update schedule with the provided data
      dispatch(updateSchedule({
        bannerImage: image,
        tripName: name,
        days: [{
          id: 1,
          description: "",
          latitude: "", // This will be set to current location
          longitude: "", // This will be set to current location
          startTime: "09:00",
          endTime: "17:00"
        }]
      }));

      // Get current location for the "from" location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            // Update the first day's location with current coordinates
            dispatch(updateDayLocation({
              dayId: 1,
              latitude: latitude.toString(),
              longitude: longitude.toString()
            }));
          },
          (error) => {
            console.error('Error getting current location:', error);
          }
        );
      }
    }
  }, [dispatch, route.params]);

  // Function to update schedule state
  const updateScheduleState = (updates) => {
    dispatch(updateSchedule(updates));
  };

  // Function to calculate the number of days between two dates
  const calculateNumberOfDays = (fromDate, toDate) => {
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Adding 1 for inclusive date range
  };

  // Handle location update from map screen
  const handleLocationUpdate = () => {
    const { latitude, longitude, dayId } = route.params || {};
    
    if (latitude && longitude && dayId) {
      console.log('Processing location update:', { dayId, latitude, longitude });
      
      // Update only the specific day's location
      const updatedDays = days.map(day => {
        if (day.id === dayId) {
          console.log(`Updating location for day ${dayId}`);
          return {
            ...day,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          };
        }
        return day;
      });
      
      updateScheduleState({ days: updatedDays });
      
      // Clear the route params after successful update
      navigation.setParams({ 
        latitude: undefined, 
        longitude: undefined, 
        dayId: undefined 
      });
    }
  };

  useEffect(() => {
    handleLocationUpdate();
  }, [route.params, days, navigation]);

  // Add a focus effect to handle location updates when returning from MapScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const { latitude, longitude, dayId } = route.params || {};
      if (latitude && longitude && dayId) {
        console.log('Screen focused with location data:', { dayId, latitude, longitude });
        handleLocationUpdate();
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  // Function to handle the form submission
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!bannerImage) {
        Alert.alert('Error', 'Banner image is required');
        return;
      }

      if (!tripName || tripName.length < 3) {
        Alert.alert('Error', 'Trip name is required and must be at least 3 characters long');
        return;
      }

      if (!days || days.length === 0) {
        Alert.alert('Error', 'At least one day plan is required');
        return;
      }

      // Validate that all days have locations and descriptions
      const invalidDays = days.filter(day => !day.latitude || !day.longitude || !day.description.trim());
      if (invalidDays.length > 0) {
        Alert.alert('Error', `Please complete all required fields for Day ${invalidDays[0].id}`);
        return;
      }

      if (!fromDate || !toDate) {
        Alert.alert('Error', 'Date range is required');
        return;
      }

      // Ensure dates are valid Date objects
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        Alert.alert('Error', 'Invalid date format');
        return;
      }

      // Get location from first and last day's map coordinates
      const firstDay = days[0];
      const lastDay = days[days.length - 1];

      if (!firstDay.latitude || !firstDay.longitude || !lastDay.latitude || !lastDay.longitude) {
        Alert.alert('Error', 'Please select locations for all days');
        return;
      }

      // Format location data using map coordinates
      const locationData = {
        from: {
          latitude: parseFloat(firstDay.latitude),
          longitude: parseFloat(firstDay.longitude)
        },
        to: {
          latitude: parseFloat(lastDay.latitude),
          longitude: parseFloat(lastDay.longitude)
        }
      };

      // Format dates
      const datesData = {
        from: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      };

      // Format plan description with validation
      const planDescription = days.map((day, index) => {
        const currentDate = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
        const formattedDate = currentDate.toISOString().split('T')[0];

        // Set the from location as current day's location
        const fromLocation = {
          latitude: parseFloat(day.latitude),
          longitude: parseFloat(day.longitude)
        };

        // Set the to location as next day's location (if it exists)
        let toLocation;
        if (index < days.length - 1) {
          const nextDay = days[index + 1];
          toLocation = {
            latitude: parseFloat(nextDay.latitude),
            longitude: parseFloat(nextDay.longitude)
          };
        } else {
          // For the last day, use the same location as from
          toLocation = fromLocation;
        }

        return {
          Description: day.description.trim(),
          date: formattedDate,
          location: {
            from: fromLocation,
            to: toLocation
          }
        };
      });

      // Calculate number of days between dates
      const diffTime = Math.abs(endDate - startDate);
      const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // First API call to create schedule
      try {
        const apiUrl = `${base_url}/schedule/create`;

        // Create the request body according to backend validation
        const requestBody = {
          tripName: tripName.trim(),
          travelMode: "Bike", // Default to Bike as per backend validation
          visible: visible || "Public", // Default to Public if not set
          location: {
            from: {
              latitude: parseFloat(firstDay.latitude),
              longitude: parseFloat(firstDay.longitude)
            },
            to: {
              latitude: parseFloat(lastDay.latitude),
              longitude: parseFloat(lastDay.longitude)
            }
          },
          dates: {
            from: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          },
          numberOfDays: numberOfDays,
          planDescription: days.map((day, index) => {
            const currentDate = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
            return {
              Description: day.description.trim(),
              date: currentDate.toISOString().split('T')[0],
              location: {
                from: {
                  latitude: parseFloat(day.latitude),
                  longitude: parseFloat(day.longitude)
                },
                to: index < days.length - 1 ? {
                  latitude: parseFloat(days[index + 1].latitude),
                  longitude: parseFloat(days[index + 1].longitude)
                } : {
                  latitude: parseFloat(day.latitude),
                  longitude: parseFloat(day.longitude)
                }
              }
            };
          })
        };

        // Create FormData for multipart/form-data
        const formData = new FormData();
        
        // Add banner image
        if (bannerImage) {
          const imageUri = bannerImage.startsWith('file://') ? bannerImage : `file://${bannerImage}`;
          formData.append('bannerImage', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'banner.jpg'
          });
        }

        // Add all other fields as JSON string
        formData.append('data', JSON.stringify(requestBody));

        // Log FormData contents
        console.log('FormData Contents:');
        console.log('1. Banner Image:', bannerImage ? {
          uri: bannerImage,
          type: 'image/jpeg',
          name: 'banner.jpg'
        } : 'No image');
        
        console.log('2. Request Data:', requestBody);
        
        // Log the actual FormData entries
        console.log('3. FormData Entries:');
        for (let pair of formData._parts) {
          console.log(pair[0], ':', pair[1]);
        }

        console.log('4. Full FormData:', formData);

        const accessToken = await AsyncStorage.getItem('accessToken');
        console.log('Access Token:', accessToken ? 'Token exists' : 'No token found');
        
        if (!accessToken) {
          Alert.alert('Error', 'Authentication required');
          return;
        }

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', JSON.stringify(response.headers));

        const responseText = await response.text();
        console.log('Raw response:', responseText);

        let data;
        try {
          if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            console.error('Server returned HTML instead of JSON');
            throw new Error('Server returned HTML instead of JSON. Please check the endpoint URL.');
          }
          data = JSON.parse(responseText);
          console.log('Parsed response data:', data);
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          if (response.status === 413) {
            throw new Error('The data being sent is too large. Please reduce the size of your images or data.');
          } else if (response.status === 404) {
            throw new Error('Schedule creation endpoint not found. Please check the URL.');
          } else if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else if (response.status === 500) {
            throw new Error('Server error. Please try again later.');
          } else {
            throw new Error(`Server returned an invalid response. Status: ${response.status}`);
          }
        }

        if (!response.ok) {
          console.error('API Error Response:', data);
          if (data.errors) {
            const errorMessages = Object.values(data.errors).flat();
            console.error('Validation Errors:', errorMessages);
            Alert.alert('Validation Error', errorMessages.join('\n'));
            return;
          } else {
            throw new Error(data.message || `Server error: ${response.status}`);
          }
        }

        dispatch(setSubmitted(true));
        Alert.alert('Success', 'Schedule created successfully!');
        dispatch(resetSchedule()); // Reset schedule after successful submission
        navigation.navigate('MySchedule');
      } catch (error) {
        console.error('Error in schedule creation:', error);
        
        // Handle specific network errors
        if (error.name === 'AbortError') {
          Alert.alert(
            'Error',
            'Request timed out. Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        } else if (error.message === 'Network request failed') {
          Alert.alert(
            'Network Error',
            'Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Error',
            error.message || 'Failed to save schedule. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save schedule. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a day to the trip plan
  const addDay = () => {
    const newDay = { 
      id: days.length + 1, 
      description: "", 
      latitude: "", 
      longitude: "",
      startTime: "09:00",
      endTime: "17:00"
    };
    updateScheduleState({ days: [...days, newDay] });
  };

  // Function to remove a day from the trip plan
  const removeDay = (id) => {
    if (!isSubmitted) {
    const updatedDays = days.filter((day) => day.id !== id);
      updateScheduleState({ days: updatedDays });
    } else {
      Alert.alert('Cannot Remove', 'Schedule has already been submitted and cannot be modified.');
    }
  };

  // Function to update a day's description or location
  const updateDayDetails = (id, field, value) => {
    if (!isSubmitted) {
    const updatedDays = days.map((day) =>
      day.id === id ? { ...day, [field]: value } : day
    );
      updateScheduleState({ days: updatedDays });
    } else {
      Alert.alert('Cannot Update', 'Schedule has already been submitted and cannot be modified.');
    }
  };

  // Open map for location selection for a specific day
  const openMapForDay = (dayId) => {
    if (!isSubmitted) {
      // Pass the current day's data to the map screen
      const currentDay = days.find(day => day.id === dayId);
      const params = {
        dayId: dayId,
        initialLocation: currentDay && currentDay.latitude && currentDay.longitude ? {
          latitude: parseFloat(currentDay.latitude),
          longitude: parseFloat(currentDay.longitude)
        } : null
      };
      console.log('Navigating to MapScreen with params:', params);
      navigation.navigate('MapScreen', params);
    } else {
      Alert.alert('Cannot Modify', 'Schedule has already been submitted and cannot be modified.');
    }
  };

  const pickImage = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos to select an image.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        maxWidth: 1200,
        maxHeight: 1200,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        base64: false,
        exif: false,
      });

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert('Error', 'No image was selected');
        return;
      }

      const selectedImage = result.assets[0];
      
      // Check file size
      const imageResponse = await fetch(selectedImage.uri);
      const blob = await imageResponse.blob();
      const fileSizeInMB = blob.size / (1024 * 1024);
      
      if (fileSizeInMB > 10) {
        Alert.alert(
          'Image Too Large',
          'Please select an image smaller than 10MB',
          [{ text: 'OK' }]
        );
        return;
      }

      updateScheduleState({ bannerImage: selectedImage.uri });
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        'Failed to select image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const onFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateScheduleState({ fromDate: selectedDate.toISOString() });
    }
  };

  const onToDateChange = (event, selectedDate) => {
    setShowToDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateScheduleState({ toDate: selectedDate.toISOString() });
    }
  };

  const backPressed = () => {
    Alert.alert(
      'Leave Form',
      'Are you sure you want to leave? Your changes will not be saved.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Function to handle time selection
  const handleTimeSelect = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      
      const updatedDays = days.map((day, index) => {
        if (index === selectedDayIndex) {
          return {
            ...day,
            [timeType === 'start' ? 'startTime' : 'endTime']: formattedTime
          };
        }
        return day;
      });
      
      updateScheduleState({ days: updatedDays });
    }
  };

  // Function to open time picker
  const openTimePicker = (index, type) => {
    setSelectedDayIndex(index);
    setTimeType(type);
    setShowTimePicker(true);
  };

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to set your current location.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        // Update the from location with current coordinates
        updateScheduleState({ 
          locationFrom: `${latitude},${longitude}`,
          locationTo: route.params?.destinationData ? 
            `${route.params.destinationData.tolatitude},${route.params.destinationData.tolongitude}` : 
            ''
        });
      } catch (error) {
        console.error('Error getting current location:', error);
        Alert.alert('Error', 'Failed to get current location');
      }
    };

    getCurrentLocation();
  }, []);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.mainContainer}
    >
      <LinearGradient
        colors={['#A60F93', '#8B0B7D', '#6D0861']}
        style={styles.headerGradient}
      >
        <BackHeader 
        title="Schedule"
        backPressed={backPressed}
        style={{ marginRight: 10 }} 
      />
      </LinearGradient>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.tripContainer}>
          {/* Banner Image Section */}
          <TouchableOpacity 
            style={styles.bannerContainer}
            onPress={pickImage}
          >
            {bannerImage ? (
              <Image source={{ uri: bannerImage }} style={styles.bannerImage} />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Icon name="camera" size={40} color="#666" />
                <Text style={styles.bannerPlaceholderText}>Add Cover Image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Trip Name */}
          <View style={styles.formGroupRow}>
            <Text style={styles.labelRow}>Trip Name</Text>
            <View style={styles.inputContainer}>
              <Icon name="airplane" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.underlineInput}
              value={tripName}
                onChangeText={(text) => updateScheduleState({ tripName: text })}
              placeholder="Enter trip name"
                placeholderTextColor="#999"
            />
            </View>
          </View>

          {/* Visibility Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>VISIBILITY</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.visibilityButton,
                  visible === 'Public' && styles.visibilityButtonActive
                ]}
                onPress={() => updateScheduleState({ visible: 'Public' })}
              >
                <Icon 
                  name="globe-outline" 
                  size={24} 
                  color={visible === 'Public' ? '#fff' : '#666'} 
                />
                <Text style={[
                  styles.visibilityButtonText,
                  visible === 'Public' && styles.visibilityButtonTextActive
                ]}>
                  Public
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.visibilityButton,
                  visible === 'Private' && styles.visibilityButtonActive
                ]}
                onPress={() => updateScheduleState({ visible: 'Private' })}
              >
                <Icon 
                  name="lock-closed-outline" 
                  size={24} 
                  color={visible === 'Private' ? '#fff' : '#666'} 
                />
                <Text style={[
                  styles.visibilityButtonText,
                  visible === 'Private' && styles.visibilityButtonTextActive
                ]}>
                  Private
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>LOCATION</Text>
            <View style={styles.row}>
              <View style={styles.formGroup}>
                <View style={styles.inputContainer}>
                  <Icon name="location" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={locationFrom}
                    onChangeText={(text) => updateScheduleState({ locationFrom: text })}
                    placeholder="From location"
                    placeholderTextColor="#999"
                  />
                </View>
                {locationFrom && (
                  <MapView
                    style={styles.locationMap}
                    initialRegion={{
                      latitude: parseFloat(locationFrom.split(',')[0]) || 0,
                      longitude: parseFloat(locationFrom.split(',')[1]) || 0,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: parseFloat(locationFrom.split(',')[0]) || 0,
                        longitude: parseFloat(locationFrom.split(',')[1]) || 0,
                      }}
                    />
                  </MapView>
                )}
              </View>
              <View style={styles.formGroup}>
                <View style={styles.inputContainer}>
                  <Icon name="location" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={locationTo}
                    onChangeText={(text) => updateScheduleState({ locationTo: text })}
                    placeholder="To location"
                    placeholderTextColor="#999"
                  />
                </View>
                {locationTo && (
                  <MapView
                    style={styles.locationMap}
                    initialRegion={{
                      latitude: parseFloat(locationTo.split(',')[0]) || 0,
                      longitude: parseFloat(locationTo.split(',')[1]) || 0,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: parseFloat(locationTo.split(',')[0]) || 0,
                        longitude: parseFloat(locationTo.split(',')[1]) || 0,
                      }}
                    />
                  </MapView>
                )}
              </View>
            </View>
          </View>

          {/* Dates Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>DATES</Text>
            <View style={styles.row}>
              <View style={styles.formGroup}>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowFromDatePicker(true)}
                >
                  <Text style={[styles.dateText, !fromDate && styles.datePlaceholder]}>
                    {fromDate ? formatDate(fromDate) : 'Start date'}
                  </Text>
                  <Icon name="calendar" size={20} color="#A60F93" />
                </TouchableOpacity>
                {showFromDatePicker && (
                  <DateTimePicker
                    value={fromDate ? new Date(fromDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onFromDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>
              <View style={styles.formGroup}>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowToDatePicker(true)}
                >
                  <Text style={[styles.dateText, !toDate && styles.datePlaceholder]}>
                    {toDate ? formatDate(toDate) : 'End date'}
                  </Text>
                  <Icon name="calendar" size={20} color="#A60F93" />
                </TouchableOpacity>
                {showToDatePicker && (
                  <DateTimePicker
                    value={toDate ? new Date(toDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onToDateChange}
                    minimumDate={fromDate ? new Date(fromDate) : new Date()}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Plan Description Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>PLAN DESCRIPTION</Text>
            {days.map((day, index) => (
              <View key={day.id} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{`Day ${day.id}`}</Text>
                  <TouchableOpacity
                    style={styles.removeDayButton}
                    onPress={() => removeDay(day.id)}
                  >
                    <Icon name="close-circle" size={24} color="#e53935" />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={[styles.dayInput, !day.latitude && styles.disabledInput]}
                  placeholder={`Enter details for Day ${day.id}`}
                  value={day.description}
                  onChangeText={(text) => updateDayDetails(day.id, "description", text)}
                  multiline
                  placeholderTextColor="#999"
                  editable={!!day.latitude}
                />

                <TouchableOpacity
                  onPress={() => openMapForDay(day.id)}
                  style={styles.mapButton}
                >
                  <Icon name="location-sharp" size={24} color="white" />
                  <Text style={styles.mapButtonText}>
                    {day.latitude ? 'Change Location' : 'Select Location'}
                  </Text>
                </TouchableOpacity>

                {day.latitude && day.longitude && (
                <MapView
                  style={styles.map}
                  initialRegion={{
                      latitude: parseFloat(day.latitude),
                      longitude: parseFloat(day.longitude),
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                    <Marker
                      coordinate={{
                        latitude: parseFloat(day.latitude),
                        longitude: parseFloat(day.longitude),
                      }}
                    />
                  </MapView>
                )}

                <View style={styles.timeContainer}>
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => openTimePicker(index, 'start')}
                  >
                    <Text style={styles.timeText}>
                      Start: {day.startTime || "09:00"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => openTimePicker(index, 'end')}
                  >
                    <Text style={styles.timeText}>
                      End: {day.endTime || "17:00"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addDayButton} onPress={addDay}>
              <Icon name="add-circle" size={24} color="#A60F93" />
              <Text style={styles.addDayButtonText}>Add Another Day</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
             <LinearGradient
              colors={['#A60F93', '#8B0B7D', '#6D0861']}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Creating...' : 'Create Schedule'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showFromDatePicker && (
        <DateTimePicker
          value={fromDate ? new Date(fromDate) : new Date()}
          mode="date"
          display="default"
          onChange={onFromDateChange}
        />
      )}
      {showToDatePicker && (
        <DateTimePicker
          value={toDate ? new Date(toDate) : new Date()}
          mode="date"
          display="default"
          onChange={onToDateChange}
        />
      )}

      {/* Add Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeSelect}
        />
      )}

      {/* Loader */}
      {isLoading && <CustomLoader message="Creating your schedule..." />}
    </KeyboardAvoidingView>
  );
}

export default MakeSchedule;
