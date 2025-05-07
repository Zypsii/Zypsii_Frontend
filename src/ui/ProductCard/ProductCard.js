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
    setLoading(true); // Start loading

    try {
      const newLikedStatus = !liked;
      const accessToken = await AsyncStorage.getItem('accessToken'); // Get the access token
      // Make the POST request to update like status
      const response = await fetch(`${base_url}/place/addFavorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // Attach the JWT token to the request header
        },
        body: JSON.stringify({
          name: props.name,
          image: props.image,
          latitude: props.latitude,
          longitude: props.longitude,
          address: props.address || "Address not available",
          rating: props.rating
        })
      });

      if (response.ok) {
        const data = await response.json(); // Parse JSON response

        if (!data.error) {
          Alert.alert('Success', newLikedStatus ? 'Product liked' : 'Product unliked');
          setLiked(newLikedStatus); // Update liked state
        } else {
          Alert.alert('Error', data.message || 'Failed to update like status');
        }
      } else {
        Alert.alert('Error', 'Failed to update like status, please try again.');
      }
    } catch (error) {
      console.error('Network or fetch error:', error);
      Alert.alert('Error', 'Failed to update like status due to a network error');
    } finally {
      setLoading(false);
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

        {/* Like Button */}
        <View style={styles.likeContainer}>
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
        </View>
      </View>

      {/* Product Information */}
      <View style={styles.botCardContainer}>
        <View style={styles.botSubCardContainer}>
          <Text style={{ color: colors.fontMainColor }} numberOfLines={1}>
            {props.name}
          </Text>

          <View style={styles.priceContainer}>
            <View style={styles.distanceContainer}>
              <Ionicons name="location-outline" size={14} color={colors.Zypsii_color} />
              <Text style={styles.distanceText}>
                {formatDistance(props.distance)}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={colors.Zypsii_color} />
              <Text style={styles.ratingText}>{props.rating || '0'}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default ProductCard;
