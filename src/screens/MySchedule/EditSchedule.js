import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../../utils';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '../../context/ToastContext';
import Moment from 'moment';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

function formatDateForBackend(dateString) {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return undefined; // Invalid date
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

const EditSchedule = ({ route, navigation }) => {
  const { scheduleId, scheduleData } = route.params || {};
  const { showToast } = useToast();
  
  // Validate scheduleId
  useEffect(() => {
    if (!scheduleId) {
      showToast('Invalid schedule ID', 'error');
      navigation.goBack();
      return;
    }
  }, [scheduleId]);

  const [loading, setLoading] = useState(false);
  const [bannerImage, setBannerImage] = useState(
    scheduleData?.bannerImage || scheduleData?.imageUrl || null
  );

  // Add state for date pickers
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [showFromTimePicker, setShowFromTimePicker] = useState(false);
  const [showToTimePicker, setShowToTimePicker] = useState(false);

  // Initialize form data with all fields from scheduleData
  const [formData, setFormData] = useState({
    tripName: scheduleData?.title || '',
    description: scheduleData?.description || '',
    travelMode: scheduleData?.travelMode || '',
    visible: scheduleData?.visible || scheduleData?.privacy || 'Public',
    fromPlace: scheduleData?.fromPlace || '',
    toPlace: scheduleData?.toPlace || '',
    fromLatitude: scheduleData?.rawLocation?.from?.latitude || '',
    fromLongitude: scheduleData?.rawLocation?.from?.longitude || '',
    toLatitude: scheduleData?.rawLocation?.to?.latitude || '',
    toLongitude: scheduleData?.rawLocation?.to?.longitude || '',
    fromDate: scheduleData?.date ? new Date(scheduleData.date).toISOString() : '',
    toDate: scheduleData?.toDate ? new Date(scheduleData.toDate).toISOString() : '',
    fromTime: scheduleData?.fromTime || '09:00',
    toTime: scheduleData?.toTime || '17:00',
    numberOfDays: scheduleData?.riders || '',
    budget: scheduleData?.budget || '',
    maxRiders: scheduleData?.maxRiders || '',
    bannerImage: scheduleData?.bannerImage || scheduleData?.imageUrl || '',
  });

  // Add useEffect to log the initial data
  useEffect(() => {
    console.log('Initial Schedule Data:', scheduleData);
    console.log('Initial Form Data:', formData);
  }, []);

  // Add function to handle input changes
  const handleInputChange = (field, value) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add state for day schedules with location data
  const [daySchedules, setDaySchedules] = useState([
    { 
      day: 1, 
      activities: '', 
      time: '',
      location: '',
      description: '',
      planDescription: [],
      latitude: '',
      longitude: ''
    }
  ]);

  // Fetch schedule description data
  useEffect(() => {
    const fetchScheduleDescription = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const user = await AsyncStorage.getItem('user');
        const currentUserId = user ? JSON.parse(user)._id : null;

        if (!accessToken || !currentUserId) {
          console.error('Missing token or userId');
          return;
        }

        const response = await fetch(
          `${base_url}/schedule/listing/scheduleDescription/${scheduleId}/${currentUserId}?offset=0&limit=10`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        const data = await response.json();
        console.log('Schedule Description Data:', data);
        
        if (data.success && data.data) {
          // Transform the API data into daySchedules format
          const transformedSchedules = data.data.map((day, index) => ({
            _id: day._id, // Store the description ID
            day: index + 1,
            activities: '',
            time: '',
            location: day.planDescription?.[0]?.name || '',
            description: day.Description || '',
            planDescription: day.planDescription || [],
            latitude: day.planDescription?.[0]?.location?.lat || '',
            longitude: day.planDescription?.[0]?.location?.lng || '',
            date: day.date // Store the original date
          }));
          
          setDaySchedules(transformedSchedules);
        }
      } catch (error) {
        console.error('Error fetching schedule description:', error);
        Alert.alert('Error', 'Failed to load schedule details');
      }
    };

    fetchScheduleDescription();
  }, [scheduleId]);

  // Update openMapForLocation function
  const openMapForLocation = (type, dayIndex) => {
    let initialLocation;
    
    if (type === 'day') {
      // For day-specific locations, use the day's current location
      const daySchedule = daySchedules[dayIndex];
      initialLocation = {
        latitude: parseFloat(daySchedule?.latitude || 0),
        longitude: parseFloat(daySchedule?.longitude || 0),
        place: daySchedule?.location || ''
      };
    } else if (type === 'from') {
      initialLocation = {
        latitude: parseFloat(formData.fromLatitude || 0),
        longitude: parseFloat(formData.fromLongitude || 0),
        place: formData.fromPlace
      };
    } else if (type === 'to') {
      initialLocation = {
        latitude: parseFloat(formData.toLatitude || 0),
        longitude: parseFloat(formData.toLongitude || 0),
        place: formData.toPlace
      };
    }

    navigation.navigate('EditMapScreen', { 
      type,
      scheduleId,
      dayIndex,
      initialLocation
    });
  };

  // Update handleLocationSelect function
  const handleLocationSelect = (type, place, latitude, longitude, dayIndex) => {
    console.log('Location selected:', { type, place, latitude, longitude, dayIndex });
    
    if (type === 'day' && dayIndex !== undefined) {
      // Update specific day's location
      const updatedSchedules = [...daySchedules];
      updatedSchedules[dayIndex] = {
        ...updatedSchedules[dayIndex],
        location: place,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        planDescription: [{
          name: place,
          location: {
            lat: latitude.toString(),
            lng: longitude.toString()
          }
        }]
      };
      setDaySchedules(updatedSchedules);
    } else if (type === 'from') {
      setFormData(prev => ({
        ...prev,
        fromPlace: place,
        fromLatitude: latitude.toString(),
        fromLongitude: longitude.toString()
      }));
    } else if (type === 'to') {
      setFormData(prev => ({
        ...prev,
        toPlace: place,
        toLatitude: latitude.toString(),
        toLongitude: longitude.toString()
      }));
    }
  };

  // Update useEffect for location updates
  useEffect(() => {
    if (route.params?.latitude && route.params?.longitude) {
      const { latitude, longitude, type, placeName, dayIndex } = route.params;
      console.log('Received location update:', { latitude, longitude, type, placeName, dayIndex });
      
      handleLocationSelect(type, placeName, latitude, longitude, dayIndex);
      
      // Clear the route params to prevent duplicate updates
      navigation.setParams({ 
        latitude: undefined, 
        longitude: undefined, 
        type: undefined, 
        placeName: undefined,
        dayIndex: undefined 
      });
    }
  }, [route.params]);

  // Validation functions
  const validateForm = () => {
    const errors = [];

    if (formData.tripName && typeof formData.tripName !== 'string') {
      errors.push('Trip name must be a string');
    }

    if (formData.travelMode && !['Car', 'Bike', 'Cycle'].includes(formData.travelMode)) {
      errors.push('Invalid travel mode. Must be Car, Bike, or Cycle');
    }

    if (formData.visible && !['Public', 'Private', 'FriendOnly'].includes(formData.visible)) {
      errors.push('Invalid visibility option');
    }

    if (formData.fromLatitude && (isNaN(formData.fromLatitude) || formData.fromLatitude < -90 || formData.fromLatitude > 90)) {
      errors.push('Invalid from latitude');
    }

    if (formData.fromLongitude && (isNaN(formData.fromLongitude) || formData.fromLongitude < -180 || formData.fromLongitude > 180)) {
      errors.push('Invalid from longitude');
    }

    if (formData.toLatitude && (isNaN(formData.toLatitude) || formData.toLatitude < -90 || formData.toLatitude > 90)) {
      errors.push('Invalid to latitude');
    }

    if (formData.toLongitude && (isNaN(formData.toLongitude) || formData.toLongitude < -180 || formData.toLongitude > 180)) {
      errors.push('Invalid to longitude');
    }

    if (formData.fromDate && !isValidDate(formData.fromDate)) {
      errors.push('Invalid from date');
    }

    if (formData.toDate && !isValidDate(formData.toDate)) {
      errors.push('Invalid to date');
    }

    if (formData.numberOfDays && (!Number.isInteger(Number(formData.numberOfDays)) || Number(formData.numberOfDays) < 1)) {
      errors.push('Number of days must be a positive integer');
    }

    return errors;
  };

  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  // Add image picker function
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Image Permission Error:', 'Permission not granted');
        showToast('Please grant permission to access your photos', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        const accessToken = await AsyncStorage.getItem('accessToken');
        
        // Create form data for image upload
        const formDataUpload = new FormData();
        const imageUri = result.assets[0].uri;
        const imageName = imageUri.split('/').pop();
        const match = /(\.\w+)$/.exec(imageName);
        const imageType = match ? `image/${match[1]}` : 'image/jpeg';

        // Check image size
        const imageResponse = await fetch(imageUri);
        const blob = await imageResponse.blob();
        const fileSizeInMB = blob.size / (1024 * 1024);
        
        if (fileSizeInMB > 10) {
          throw new Error('Image size exceeds 10MB limit. Please select a smaller image.');
        }

        formDataUpload.append('mediaFile', {
          uri: imageUri,
          type: imageType,
          name: imageName
        });

        console.log('Uploading image with data:', {
          uri: imageUri,
          type: imageType,
          name: imageName
        });

        // Upload image to server using the correct endpoint with mediaType
        const response = await fetch(`${base_url}/uploadFile?mediaType=post`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formDataUpload
        });

        const data = await response.json();
        console.log('Image upload response:', data);
        
        if (data.status && data.urls && data.urls.length > 0) {
          // Get the image URL from the response
          const imageUrl = data.urls[0];
          console.log('Image uploaded successfully, URL:', imageUrl);
          setBannerImage(imageUrl);
          setFormData(prev => ({
            ...prev,
            bannerImage: imageUrl
          }));
          showToast(data.message || 'Image uploaded successfully', 'success');
        } else {
          console.error('Image upload failed:', data.message);
          throw new Error(data.message || 'Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Error picking/uploading image:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      showToast(error.message || 'Failed to upload image', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update the banner section in the render
  const renderBannerSection = () => (
    <View style={styles.bannerContainer}>
      {bannerImage ? (
        <ImageBackground
          source={{ uri: bannerImage }}
          style={styles.bannerImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.bannerGradient}
          >
            <Text style={styles.bannerTitle}>{formData.tripName}</Text>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <TouchableOpacity 
          style={styles.bannerPlaceholder} 
          onPress={pickImage}
        >
          <Ionicons name="camera" size={40} color={colors.white} />
          <Text style={styles.bannerPlaceholderText}>Add Banner Image</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={styles.changeImageButton}
        onPress={pickImage}
      >
        <Ionicons name="camera" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  // Update the updateAllDayDescriptions function
  // const updateAllDayDescriptions = async (accessToken) => {
  //   try {
  //     for (let i = 0; i < daySchedules.length; i++) {
  //       const daySchedule = daySchedules[i];
        
  //       if (!daySchedule._id) {
  //         console.error(`No description ID found for Day ${i + 1}`);
  //         continue;
  //       }

  //       // Format date as DD-MM-YYYY for Moment.js parsing
  //       const currentDate = new Date(formData.fromDate);
  //       currentDate.setDate(currentDate.getDate() + i);
        
  //       // Format date with leading zeros for consistent parsing
  //       const dayNum = String(currentDate.getDate()).padStart(2, '0');
  //       const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  //       const year = currentDate.getFullYear();
  //       const formattedDate = `${dayNum}-${month}-${year}`;

  //       // Validate the date format
  //       if (!dayNum || !month || !year) {
  //         throw new Error(`Invalid date format for Day ${i + 1}`);
  //       }

  //       // Set the from location as current day's location
  //       if (!daySchedule.latitude || !daySchedule.longitude) {
  //         throw new Error(`Missing location for Day ${i + 1}`);
  //       }

  //       // Match the backend's expected structure exactly
  //       const descriptionData = {
  //         Description: daySchedule.description.trim(),
  //         date: formattedDate,
  //         fromLatitude: daySchedule.latitude.toString(),
  //         fromLongitude: daySchedule.longitude.toString(),
  //         toLatitude: daySchedule.latitude.toString(),
  //         toLongitude: daySchedule.longitude.toString()
  //       };

  //       console.log('formattedDate', formattedDate);
  //       console.log(`Updating Day ${i + 1} (ID: ${daySchedule._id}) with data:`, JSON.stringify(descriptionData, null, 2));

  //       try {
  //         const response = await fetch(
  //           `${base_url}/schedule/edit/descriptions/${scheduleId}/${daySchedule._id}`,
  //           {
  //             method: 'PUT',
  //             headers: {
  //               'Authorization': `Bearer ${accessToken}`,
  //               'Content-Type': 'application/json',
  //             },
  //             body: JSON.stringify(descriptionData)
  //           }
  //         );

  //         const responseData = await response.json();
          
  //         if (!response.ok) {
  //           console.error(`Error updating description for Day ${i + 1}:`, {
  //             status: response.status,
  //             statusText: response.statusText,
  //             responseData: responseData,
  //             sentData: descriptionData
  //           });
  //           throw new Error(`Failed to update description for day ${i + 1}: ${responseData.message || 'Unknown error'}`);
  //         }

  //         console.log(`Successfully updated description for Day ${i + 1}:`, responseData);
  //       } catch (error) {
  //         console.error(`Error updating Day ${i + 1}:`, error);
  //         throw error;
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error in updateAllDayDescriptions:', error);
  //     throw error;
  //   }
  // };

  // Update handleUpdate function
  const handleUpdate = async () => {
    try {
      if (!scheduleId) {
        console.error('Validation Error: Invalid schedule ID');
        showToast('Invalid schedule ID', 'error');
        return;
      }

      // Validate form data
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        console.error('Form Validation Errors:', validationErrors);
        showToast(validationErrors.join('\n'), 'error');
        return;
      }

      // Additional validation for required fields
      if (!formData.tripName || formData.tripName.length < 3) {
        console.error('Validation Error: Invalid trip name');
        showToast('Trip name is required and must be at least 3 characters long', 'error');
        return;
      }

      if (!formData.travelMode) {
        console.error('Validation Error: Travel mode required');
        showToast('Travel mode is required', 'error');
        return;
      }

      if (!formData.fromPlace || !formData.toPlace) {
        console.error('Validation Error: Location required');
        showToast('From and To locations are required', 'error');
        return;
      }

      if (!formData.fromDate) {
        console.error('Validation Error: Start date required');
        showToast('Start date is required', 'error');
        return;
      }

      if (!formData.numberOfDays || parseInt(formData.numberOfDays) < 1) {
        console.error('Validation Error: Invalid number of days');
        showToast('Number of days must be at least 1', 'error');
        return;
      }

      // Validate location coordinates
      if (!formData.fromLatitude || !formData.fromLongitude || !formData.toLatitude || !formData.toLongitude) {
        console.error('Validation Error: Location coordinates required');
        showToast('Location coordinates are required', 'error');
        return;
      }

      setLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');

      // Prepare update data
      const updateData = {
        tripName: formData.tripName.trim(),
        travelMode: formData.travelMode.trim(),
        visible: formData.visible.trim(),
        fromLatitude: formData.fromLatitude ? parseFloat(formData.fromLatitude) : undefined,
        fromLongitude: formData.fromLongitude ? parseFloat(formData.fromLongitude) : undefined,
        toLatitude: formData.toLatitude ? parseFloat(formData.toLatitude) : undefined,
        toLongitude: formData.toLongitude ? parseFloat(formData.toLongitude) : undefined,
        numberOfDays: formData.numberOfDays ? parseInt(formData.numberOfDays) : undefined,
      };
      // Only add fromDate and toDate if valid
      const formattedFromDate = formatDateForBackend(formData.fromDate);
      if (formattedFromDate) {
        updateData.fromDate = formattedFromDate;
      }
      const formattedToDate = formatDateForBackend(formData.toDate);
      if (formattedToDate) {
        updateData.toDate = formattedToDate;
      }

      // Check bannerImage type
      const bannerImage = formData.bannerImage;
      let useFormData = false;
      if (bannerImage) {
        if (/^https?:\/\//.test(bannerImage)) {
          // Remote URL, send as string
          updateData.bannerImage = bannerImage;
        } else if (bannerImage.startsWith('file://')) {
          useFormData = true;
        }
      }

      let response, responseData;
      if (useFormData) {
        // Use FormData for local file
        const formDataToSend = new FormData();
        // Append all updateData fields
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formDataToSend.append(key, String(value));
          }
        });
        // Append bannerImage as file
        formDataToSend.append('bannerImage', {
          uri: bannerImage,
          type: 'image/jpeg',
          name: 'banner.jpg',
        });
        response = await fetch(`${base_url}/schedule/edit/${scheduleId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            // 'Content-Type' will be set automatically by fetch for FormData
          },
          body: formDataToSend,
        });
        responseData = await response.json();
      } else {
        // Use JSON as before
        response = await fetch(`${base_url}/schedule/edit/${scheduleId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        responseData = await response.json();
      }

      console.log('Update response:', responseData);

      if (!response.ok) {
        if (responseData.errors) {
          console.error('Server validation errors:', responseData.errors);
          const errorMessages = Object.values(responseData.errors).flat();
          showToast(errorMessages.join('\n'), 'error');
          return;
        }
        console.error('Update failed:', responseData.message);
        throw new Error(responseData.message || 'Failed to update schedule');
      }

      // Update all day descriptions
      // await updateAllDayDescriptions(accessToken);

      console.log('Schedule updated successfully');
      showToast('Schedule updated successfully', 'success');
      navigation.goBack();
    } catch (error) {
      console.error('Update error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      showToast(error.message || 'Failed to update schedule. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add new day schedule
  const addDaySchedule = () => {
    setDaySchedules([...daySchedules, { 
      day: daySchedules.length + 1, 
      activities: '', 
      time: '',
      location: '',
      description: '',
      planDescription: [],
      latitude: '',
      longitude: ''
    }]);
  };

  // Remove day schedule
  const removeDaySchedule = (index) => {
    if (daySchedules.length > 1) {
      const newDaySchedules = daySchedules.filter((_, i) => i !== index);
      const updatedDaySchedules = newDaySchedules.map((schedule, i) => ({
        ...schedule,
        day: i + 1
      }));
      setDaySchedules(updatedDaySchedules);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Date and time picker handlers
  const onFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      try {
        const date = new Date(selectedDate);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        const time = new Date(`2000-01-01T${formData.fromTime}`);
        date.setHours(time.getHours(), time.getMinutes());
        setFormData(prev => ({
          ...prev,
          fromDate: date.toISOString()
        }));
      } catch (error) {
        console.error('Error setting from date:', error);
        showToast('Invalid date selected', 'error');
      }
    }
  };

  const onToDateChange = (event, selectedDate) => {
    setShowToDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      try {
        const date = new Date(selectedDate);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        const time = new Date(`2000-01-01T${formData.toTime}`);
        date.setHours(time.getHours(), time.getMinutes());
        setFormData(prev => ({
          ...prev,
          toDate: date.toISOString()
        }));
      } catch (error) {
        console.error('Error setting to date:', error);
        showToast('Invalid date selected', 'error');
      }
    }
  };

  const onFromTimeChange = (event, selectedTime) => {
    setShowFromTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      try {
        const time = selectedTime.toTimeString().slice(0, 5);
        setFormData(prev => ({
          ...prev,
          fromTime: time
        }));
      } catch (error) {
        console.error('Error setting from time:', error);
        showToast('Invalid time selected', 'error');
      }
    }
  };

  const onToTimeChange = (event, selectedTime) => {
    setShowToTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      try {
        const time = selectedTime.toTimeString().slice(0, 5);
        setFormData(prev => ({
          ...prev,
          toTime: time
        }));
      } catch (error) {
        console.error('Error setting to time:', error);
        showToast('Invalid time selected', 'error');
      }
    }
  };

  // Update the day schedule section in the render to include description editing
  const renderDaySchedule = (daySchedule, index) => (
    <View key={index} style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{`Day ${daySchedule.day}`}</Text>
        {daySchedules.length > 1 && (
          <TouchableOpacity
            style={styles.removeDayButton}
            onPress={() => removeDaySchedule(index)}
          >
            <Ionicons name="close-circle" size={24} color="#e53935" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          value={daySchedule.description}
          onChangeText={(text) => {
            const updatedSchedules = [...daySchedules];
            updatedSchedules[index] = {
              ...updatedSchedules[index],
              description: text
            };
            setDaySchedules(updatedSchedules);
          }}
          placeholder="Enter day description"
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        onPress={() => openMapForLocation('day', index)}
        style={styles.mapButton}
      >
        <Ionicons name="location-sharp" size={24} color="white" />
        <Text style={styles.mapButtonText}>
          {daySchedule.location || 'Select Location'}
        </Text>
      </TouchableOpacity>

      {daySchedule.latitude && daySchedule.longitude && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: parseFloat(daySchedule.latitude),
              longitude: parseFloat(daySchedule.longitude),
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{
                latitude: parseFloat(daySchedule.latitude),
                longitude: parseFloat(daySchedule.longitude),
              }}
            />
          </MapView>
        </View>
      )}

      <View style={styles.timeContainer}>
        <TouchableOpacity 
          style={styles.timeButton}
          onPress={() => openTimePicker(index, 'start')}
        >
          <Text style={styles.timeText}>
            Start: {daySchedule.startTime || "09:00"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.timeButton}
          onPress={() => openTimePicker(index, 'end')}
        >
          <Text style={styles.timeText}>
            End: {daySchedule.endTime || "17:00"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Display plan description locations */}
      {daySchedule.planDescription && daySchedule.planDescription.length > 0 && (
        <View style={styles.locationList}>
          {daySchedule.planDescription.map((location, locIndex) => (
            <View key={locIndex} style={styles.locationItem}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationAddress}>{location.address}</Text>
              <Text style={styles.locationDistance}>{location.distanceInKilometer}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Utility function to save schedule data as JSON with a custom filename
  const saveScheduleToFile = async (data, filename = 'scheduleData.json') => {
    try {
      const folderUri = FileSystem.documentDirectory + 'schedules/';
      // Ensure the folder exists
      await FileSystem.makeDirectoryAsync(folderUri, { intermediates: true });
      const safeFilename = filename.replace(/[^a-zA-Z0-9-_\.]/g, '_');
      const fileUri = folderUri + safeFilename;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
      console.log('Schedule data saved to:', fileUri);
      Alert.alert('Success', `Schedule data saved to file: ${safeFilename}`);
      return fileUri;
    } catch (error) {
      console.error('Error saving schedule data:', error);
      Alert.alert('Error', 'Failed to save schedule data.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Schedule</Text>
      </View>

      <ScrollView style={styles.content}>
        {renderBannerSection()}
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>BASIC DETAILS</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Trip Name</Text>
            <TextInput
              style={styles.input}
              value={formData.tripName}
              onChangeText={(text) => handleInputChange('tripName', text)}
              placeholder="Enter trip name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Enter trip description"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Number of Days</Text>
              <TextInput
                style={styles.input}
                value={formData.numberOfDays}
                onChangeText={(text) => handleInputChange('numberOfDays', text)}
                placeholder="Enter days"
                keyboardType="numeric"
              />
            </View>

            {/* <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Max Riders</Text>
              <TextInput
                style={styles.input}
                value={formData.maxRiders}
                onChangeText={(text) => handleInputChange('maxRiders', text)}
                placeholder="Enter max riders"
                keyboardType="numeric"
              />
            </View> */}
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Travel Mode</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.travelMode}
                  onValueChange={(value) => handleInputChange('travelMode', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select mode" value="" />
                  <Picker.Item label="Car" value="Car" />
                  <Picker.Item label="Bike" value="Bike" />
                  <Picker.Item label="Cycle" value="Cycle" />
                </Picker>
              </View>
            </View>

            {/* <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Budget</Text>
              <TextInput
                style={styles.input}
                value={formData.budget}
                onChangeText={(text) => handleInputChange('budget', text)}
                placeholder="Enter budget"
                keyboardType="numeric"
              />
            </View> */}
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Visibility</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.visible}
                  onValueChange={(value) => handleInputChange('visible', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Public" value="Public" />
                  <Picker.Item label="Private" value="Private" />
                  <Picker.Item label="Friends Only" value="FriendOnly" />
                </Picker>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>LOCATION</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>From Place</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => openMapForLocation('from')}
            >
              <Text style={styles.locationText}>{formData.fromPlace || 'Select starting location'}</Text>
            </TouchableOpacity>
            {formData.fromLatitude && formData.fromLongitude && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: parseFloat(formData.fromLatitude),
                    longitude: parseFloat(formData.fromLongitude),
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: parseFloat(formData.fromLatitude),
                      longitude: parseFloat(formData.fromLongitude),
                    }}
                  />
                </MapView>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>To Place</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => openMapForLocation('to')}
            >
              <Text style={styles.locationText}>{formData.toPlace || 'Select destination'}</Text>
            </TouchableOpacity>
            {formData.toLatitude && formData.toLongitude && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: parseFloat(formData.toLatitude),
                    longitude: parseFloat(formData.toLongitude),
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: parseFloat(formData.toLatitude),
                      longitude: parseFloat(formData.toLongitude),
                    }}
                  />
                </MapView>
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>DATES</Text>
          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Start Date & Time</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowFromDatePicker(true)}
              >
                <Text style={[styles.dateText, !formData.fromDate && styles.datePlaceholder]}>
                  {formData.fromDate ? formatDate(formData.fromDate) : 'Select date'}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
              {showFromDatePicker && (
                <DateTimePicker
                  value={formData.fromDate ? new Date(formData.fromDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onFromDateChange}
                  minimumDate={new Date()}
                />
              )}
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => setShowFromTimePicker(true)}
              >
                <Text style={styles.timeText}>
                  {formData.fromTime || 'Select time'}
                </Text>
                <Ionicons name="time" size={20} color={colors.primary} />
              </TouchableOpacity>
              {showFromTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01T${formData.fromTime}`)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onFromTimeChange}
                />
              )}
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>End Date & Time</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowToDatePicker(true)}
              >
                <Text style={[styles.dateText, !formData.toDate && styles.datePlaceholder]}>
                  {formData.toDate ? formatDate(formData.toDate) : 'Select date'}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
              {showToDatePicker && (
                <DateTimePicker
                  value={formData.toDate ? new Date(formData.toDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onToDateChange}
                  minimumDate={formData.fromDate ? new Date(formData.fromDate) : new Date()}
                />
              )}
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => setShowToTimePicker(true)}
              >
                <Text style={styles.timeText}>
                  {formData.toTime || 'Select time'}
                </Text>
                <Ionicons name="time" size={20} color={colors.primary} />
              </TouchableOpacity>
              {showToTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01T${formData.toTime}`)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onToTimeChange}
                />
              )}
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>PLAN DESCRIPTION</Text>
          {daySchedules.map((daySchedule, index) => renderDaySchedule(daySchedule, index))}

          <TouchableOpacity style={styles.addDayButton} onPress={addDaySchedule}>
            <Ionicons name="add-circle" size={24} color="#A60F93" />
            <Text style={styles.addDayButtonText}>Add Another Day</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.updateButtonText}>Update Schedule</Text>
          )}
        </TouchableOpacity>
        {/* Button to save schedule data as JSON file */}
        <TouchableOpacity
          style={[styles.updateButton, { backgroundColor: '#4CAF50', marginTop: 10 }]}
          onPress={() => {
            // Use trip name and current date for filename
            const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
            const tripName = formData.tripName ? formData.tripName.replace(/\s+/g, '_') : 'schedule';
            const filename = `${tripName}_${dateStr}.json`;
            saveScheduleToFile({ ...formData, daySchedules }, filename);
          }}
        >
          <Text style={styles.updateButtonText}>Save to JSON</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditSchedule; 