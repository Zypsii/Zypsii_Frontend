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

const { width } = Dimensions.get('window');

const EditSchedule = ({ route, navigation }) => {
  const { scheduleId, scheduleData } = route.params;
  const [loading, setLoading] = useState(false);
  const [bannerImage, setBannerImage] = useState(
    scheduleData?.bannerImage || scheduleData?.imageUrl || null
  );

  // Add state for date pickers
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

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
    fromDate: scheduleData?.date || '',
    toDate: scheduleData?.toDate || '',
    numberOfDays: scheduleData?.riders || '',
    budget: scheduleData?.budget || '',
    maxRiders: scheduleData?.maxRiders || '',
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

  // Add function to handle location selection
  const handleLocationSelect = (type, place, latitude, longitude) => {
    if (type === 'from') {
      setFormData(prev => ({
        ...prev,
        fromPlace: place,
        fromLatitude: latitude,
        fromLongitude: longitude
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        toPlace: place,
        toLatitude: latitude,
        toLongitude: longitude
      }));
    }
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
        console.log(data);
        
        if (data.success && data.data) {
          // Transform the API data into daySchedules format
          const transformedSchedules = data.data.map((day, index) => ({
            day: index + 1,
            activities: '',
            time: '',
            location: day.planDescription?.[0]?.name || '',
            description: day.Description || '',
            planDescription: day.planDescription || [],
            latitude: day.planDescription?.[0]?.location?.lat || '',
            longitude: day.planDescription?.[0]?.location?.lng || ''
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

  // Handle location update from map screen
  useEffect(() => {
    if (route.params?.latitude && route.params?.longitude) {
      const { latitude, longitude, dayId } = route.params;
      const updatedDaySchedules = daySchedules.map(day => {
        if (day.day === dayId) {
          return {
            ...day,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          };
        }
        return day;
      });
      setDaySchedules(updatedDaySchedules);
      
      // Clear the route params to prevent duplicate updates
      navigation.setParams({ latitude: undefined, longitude: undefined, dayId: undefined });
    }
  }, [route.params]);

  // Function to open map for location selection
  const openMapForDay = (dayId) => {
    navigation.navigate('MapScreen', { 
      dayId,
      initialLocation: {
        latitude: parseFloat(daySchedules.find(day => day.day === dayId)?.latitude || 0),
        longitude: parseFloat(daySchedules.find(day => day.day === dayId)?.longitude || 0)
      }
    });
  };

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
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setBannerImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
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

  // Update handleUpdate function to match the data structure
  const handleUpdate = async () => {
    try {
      // Validate form data
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        Alert.alert('Validation Error', validationErrors.join('\n'));
        return;
      }

      // Additional validation for required fields
      if (!formData.tripName || formData.tripName.length < 3) {
        Alert.alert('Error', 'Trip name is required and must be at least 3 characters long');
        return;
      }

      if (!formData.travelMode) {
        Alert.alert('Error', 'Travel mode is required');
        return;
      }

      if (!formData.fromPlace || !formData.toPlace) {
        Alert.alert('Error', 'From and To locations are required');
        return;
      }

      if (!formData.fromDate) {
        Alert.alert('Error', 'Start date is required');
        return;
      }

      if (!formData.numberOfDays || parseInt(formData.numberOfDays) < 1) {
        Alert.alert('Error', 'Number of days must be at least 1');
        return;
      }

      // Validate location coordinates
      if (!formData.fromLatitude || !formData.fromLongitude || !formData.toLatitude || !formData.toLongitude) {
        Alert.alert('Error', 'Location coordinates are required');
        return;
      }

      setLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      // Create the core update data object with top-level properties as expected by backend req.body
      const baseUpdateData = {
        tripName: formData.tripName.trim(),
        travelMode: formData.travelMode.trim(),
        visible: formData.visible.trim(),
        fromLatitude: parseFloat(formData.fromLatitude),
        fromLongitude: parseFloat(formData.fromLongitude),
        toLatitude: parseFloat(formData.toLatitude),
        toLongitude: parseFloat(formData.toLongitude),
        fromDate: new Date(formData.fromDate).toISOString(),
        toDate: formData.toDate ? new Date(formData.toDate).toISOString() : '',
        numberOfDays: parseInt(formData.numberOfDays),
        ...(formData.description && { description: formData.description.trim() }),
        ...(formData.budget && { budget: parseFloat(formData.budget) }),
        ...(formData.maxRiders && { maxRiders: parseInt(formData.maxRiders) }),
      };

      // Handle banner image separately for multipart/form-data
      if (bannerImage && bannerImage.startsWith('file://')) {
        const imageUri = bannerImage;
        const imageName = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(imageName);
        const imageType = match ? `image/${match[1]}` : 'image/jpeg';

        // Check image size
        const imageResponse = await fetch(imageUri);
        const blob = await imageResponse.blob();
        const fileSizeInMB = blob.size / (1024 * 1024);
        
        if (fileSizeInMB > 10) {
          throw new Error('Image size exceeds 10MB limit. Please select a smaller image.');
        }

        const formDataToSend = new FormData();
        formDataToSend.append('bannerImage', {
          uri: imageUri,
          type: imageType,
          name: imageName
        });

        // Append all baseUpdateData fields individually to FormData
        for (const key in baseUpdateData) {
          if (Object.prototype.hasOwnProperty.call(baseUpdateData, key) && baseUpdateData[key] !== undefined && baseUpdateData[key] !== null) {
            // Ensure numbers and booleans are converted to strings for FormData
            formDataToSend.append(key, typeof baseUpdateData[key] === 'object' ? JSON.stringify(baseUpdateData[key]) : baseUpdateData[key].toString());
          }
        }

        // Log the final form data
        console.log('Final formDataToSend (with image):', formDataToSend);

        // Make the API call with FormData
        const response = await fetch(`${base_url}/schedule/edit/${scheduleId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formDataToSend
        });

        const responseData = await response.json();
        console.log('Response data (with image):', responseData);

        if (!response.ok) {
          if (responseData.errors) {
            const errorMessages = Object.values(responseData.errors).flat();
            Alert.alert('Validation Error', errorMessages.join('\n'));
            return;
          }
          throw new Error(responseData.message || 'Failed to update schedule');
        }
      } else {
        // If no new local image, send as application/json
        const finalUpdateData = { ...baseUpdateData };
        if (bannerImage && !bannerImage.startsWith('file://')) {
          finalUpdateData.bannerImage = bannerImage; // Include remote URL in data
        }

        // Log the final data
        console.log('Final updateData (JSON):', finalUpdateData);

        // Make the API call with JSON data
        const response = await fetch(`${base_url}/schedule/edit/${scheduleId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(finalUpdateData)
        });

        const responseData = await response.json();
        console.log('Response data (JSON):', responseData);

        if (!response.ok) {
          if (responseData.errors) {
            const errorMessages = Object.values(responseData.errors).flat();
            Alert.alert('Validation Error', errorMessages.join('\n'));
            return;
          }
          throw new Error(responseData.message || 'Failed to update schedule');
        }
      }

      Alert.alert('Success', 'Schedule updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update schedule. Please try again.');
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
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Date picker handlers
  const onFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        fromDate: selectedDate.toISOString()
      }));
    }
  };

  const onToDateChange = (event, selectedDate) => {
    setShowToDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        toDate: selectedDate.toISOString()
      }));
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

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Max Riders</Text>
              <TextInput
                style={styles.input}
                value={formData.maxRiders}
                onChangeText={(text) => handleInputChange('maxRiders', text)}
                placeholder="Enter max riders"
                keyboardType="numeric"
              />
            </View>
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

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Budget</Text>
              <TextInput
                style={styles.input}
                value={formData.budget}
                onChangeText={(text) => handleInputChange('budget', text)}
                placeholder="Enter budget"
                keyboardType="numeric"
              />
            </View>
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
              onPress={() => navigation.navigate('LocationPicker', {
                onLocationSelect: (place, lat, lng) => handleLocationSelect('from', place, lat, lng),
                initialLocation: formData.fromPlace
              })}
            >
              <Text style={styles.locationText}>{formData.fromPlace || 'Select starting location'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>To Place</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => navigation.navigate('LocationPicker', {
                onLocationSelect: (place, lat, lng) => handleLocationSelect('to', place, lat, lng),
                initialLocation: formData.toPlace
              })}
            >
              <Text style={styles.locationText}>{formData.toPlace || 'Select destination'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>DATES</Text>
          <View style={styles.row}>
            <View style={styles.formGroup}>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowFromDatePicker(true)}
              >
                <Text style={[styles.dateText, !formData.fromDate && styles.datePlaceholder]}>
                  {formData.fromDate ? formatDate(formData.fromDate) : 'Start date'}
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
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowToDatePicker(true)}
              >
                <Text style={[styles.dateText, !formData.toDate && styles.datePlaceholder]}>
                  {formData.toDate ? formatDate(formData.toDate) : 'End date'}
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
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>PLAN DESCRIPTION</Text>
          {daySchedules.map((daySchedule, index) => (
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

              <TouchableOpacity
                onPress={() => openMapForDay(daySchedule.day)}
                style={styles.mapButton}
              >
                <Ionicons name="location-sharp" size={24} color="white" />
                <Text style={styles.mapButtonText}>Select Location</Text>
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
          ))}

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditSchedule; 