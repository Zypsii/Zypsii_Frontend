import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TextDefault } from '../../components';
import { colors } from "../../utils";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const DiscoverByNearest = (props) => {
  const navigation = useNavigation();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    navigation.navigate('Destination', {
      id: props.id,
      image: props.image,
      cardTitle: props.title,
      subtitle: props.subtitle,
      rating: props.rating,
      distance: props.distance
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.discoverCard}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: props.image }} 
          style={styles.discoverCardImage}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
        {imageLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.Zypsii_color} />
          </View>
        )}
        {imageError && (
          <View style={styles.errorContainer}>
            <Ionicons name="image-outline" size={24} color={colors.graycolor} />
          </View>
        )}
      </View>
      <View style={styles.discoverCardContent}>
        <TextDefault numberOfLines={1} style={styles.discoverCardTitle}>
          {props.title}
        </TextDefault>
        <TextDefault numberOfLines={2} style={styles.discoverCardSubtitle}>
          {props.subtitle}
        </TextDefault>
        <View style={styles.discoverCardFooter}>
          <View style={styles.discoverCardDistance}>
            <Ionicons name="location-outline" size={14} color={colors.Zypsii_color} />
            <TextDefault style={styles.distanceText}>
            {props.distance ? `${props.distance} km` : 'N/A'}
            </TextDefault>
          </View>
          <View style={styles.discoverCardRating}>
            <MaterialIcons name="star" size={14} color={colors.Zypsii_color} />
            <TextDefault style={styles.ratingText}>
            {!isNaN(Number(props.rating)) ? Number(props.rating).toFixed(1) : '0.0'}
            </TextDefault>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  discoverCard: {
    width: 150,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: colors.grayBackground,
    position: 'relative',
  },
  discoverCardImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.grayBackground,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.grayBackground,
  },
  discoverCardContent: {
    padding: 10,
  },
  discoverCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  discoverCardSubtitle: {
    fontSize: 12,
    color: colors.fontThirdColor,
    marginBottom: 8,
  },
  discoverCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discoverCardDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: colors.fontThirdColor,
    marginLeft: 4,
  },
  discoverCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: colors.fontMainColor,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default DiscoverByNearest;
