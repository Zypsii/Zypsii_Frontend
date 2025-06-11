import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Alert, Text } from 'react-native';
import styles from './styles';
import { colors, scale } from '../../utils';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { base_url } from '../../utils/base_url';

function ProductCard(props) {
  const navigation = useNavigation();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state

  // Fetch user data from AsyncStorage on component mount

  const handleLikeToggle = async () => {
    setLoading(true);

    try {
      const newLikedStatus = !liked;
      const accessToken = await AsyncStorage.getItem('accessToken');

      // First search for the place
      const searchResponse = await fetch(`${base_url}/schedule/places/getNearest?searchPlaceName=${props.name}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!searchResponse.ok) {
        throw new Error(`Search failed with status: ${searchResponse.status}`);
      }
      const searchResult = await searchResponse.json();
      
      if (!searchResult.data || searchResult.data.length === 0) {
        Alert.alert('Error', 'Place not found');
        setLoading(false);
        return;
      }

      const place = searchResult.data[0]; // Get the first matching place

      // Validate location data
      if (!place.location || !place.location.lat || !place.location.lng) {
        Alert.alert('Error', 'Location coordinates are required');
        setLoading(false);
        return;
      }

      // Prepare data for adding to favorites
      const requestData = {
        name: place.name,
        image: place.image,
        latitude: parseFloat(place.location.lat),
        longitude: parseFloat(place.location.lng),
        address: place.address || "Address not available",
        rating: place.rating
      };

      // Make the POST request to update like status
      const response = await fetch(`${base_url}/place/addFavorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();

        if (!data.error) {
          Alert.alert('Success', newLikedStatus ? 'Place added to favorites' : 'Place removed from favorites');
          setLiked(newLikedStatus);
        } else {
          console.error('API Error:', data.message);
          Alert.alert('Error', data.message || 'Failed to update favorite status');
        }
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        Alert.alert('Error', errorData?.message || 'Failed to update favorite status, please try again.');
      }
    } catch (error) {
      console.error('Network or fetch error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert('Error', 'Failed to update favorite status due to a network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchPlaceName) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${base_url}/schedule/places/getNearest?searchPlaceName=${encodeURIComponent(searchPlaceName)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.data && result.data.length > 0) {
        // Handle the search results here
        // You can navigate to a new screen or update the UI with the results
        navigation.navigate('SearchResults', {
          searchResults: result.data,
          searchQuery: searchPlaceName
        });
      } else {
        Alert.alert('No Results', 'No places found for your search.');
      }
    } catch (error) {
      console.error("Error searching places:", error);
      Alert.alert('Error', 'Failed to search places. Please try again later.');
    }
  };

  const handlePlaceClick = (place) => {
    if (place.location && place.location.latitude && place.location.longitude) {
      navigation.navigate('Destination', {
        id: place._id,
        image: place.image,
        cardTitle: place.name,
        subtitle: place.address,
        rating: place.rating,
        distance: place.distanceInKilometer,
        latitude: place.location.latitude,
        longitude: place.location.longitude
      });
    } else {
      Alert.alert('Error', 'Location information not available for this place.');
    }
  };

  // Format distance to show one decimal place
  const formatDistance = (distance) => {
    if (!distance) return '0.0 km';
    return `${parseFloat(distance).toFixed(1)} km`;
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => navigation.navigate('Destination', { product: props })}
      style={[styles.cardContainer, props.styles]}>
      
      {/* Product Image */}
      <View style={styles.topCardContainer}>
        <Image
          source={{ uri: props.image }}  // Assuming `props.image` contains the product image URL
          style={styles.imgResponsive}
          resizeMode="cover"
        />

        {/* Location and Rating Info */}
        <View style={styles.infoOverlay}>
          <View style={styles.distanceContainer}>
            <Ionicons name="location-outline" size={14} color={colors.white} />
            <Text style={[styles.distanceText, { color: colors.white }]}>
              {formatDistance(props.distance)}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={colors.white} />
            <Text style={[styles.ratingText, { color: colors.white }]}>{props.rating || '0'}</Text>
          </View>
        </View>

        {/* Like Button */}
        {/* <View style={styles.likeContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLikeToggle} // Trigger like/unlike functionality
            disabled={loading}  // Disable while loading
          >
            <Ionicons
              name={liked ? 'bookmark' : 'bookmark-outline'}
              size={scale(20)}
              color={colors.greenColor}
            />
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Product Information */}
      <View style={styles.botCardContainer}>
        <View style={styles.botSubCardContainer}>
          <Text style={{ color: colors.fontMainColor }} numberOfLines={1}>
            {props.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default ProductCard;
