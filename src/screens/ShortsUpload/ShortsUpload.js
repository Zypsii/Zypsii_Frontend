import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import styles from './Styles';
import { colors } from '../../utils';
import { base_url } from '../../utils/base_url';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

function ShortsUpload({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const compressVideo = async (uri) => {
    try {
      const compressedUri = `${FileSystem.cacheDirectory}compressed_video.mp4`;
      await FileSystem.copyAsync({
        from: uri,
        to: compressedUri
      });
      return compressedUri;
    } catch (error) {
      throw new Error('Failed to compress video');
    }
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.5,
        videoMaxDuration: 30,
        videoExportPreset: ImagePicker.VideoExportPreset.LowQuality,
        videoQuality: 0.5,
        aspect: [9, 16],
      });

      if (!result.canceled) {
        const compressedUri = await compressVideo(result.assets[0].uri);
        setVideo({ ...result.assets[0], uri: compressedUri });
        setThumbnail(compressedUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const validateMediaType = (mediaType) => {
    if (typeof mediaType !== 'string') {
      throw new Error('mediaType must be a string');
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!video) {
      Alert.alert('Error', 'Please select a video');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      setIsUploading(true);
      validateMediaType('shorts');
      const accessToken = await AsyncStorage.getItem('accessToken');

      const videoFormData = new FormData();
      
      // Get file extension from video URI
      const fileExtension = video.uri.split('.').pop().toLowerCase();
      
      // Set mime type based on file extension
      let mimeType;
      switch (fileExtension) {
        case 'mp4':
          mimeType = 'video/mp4';
          break;
        case 'mov':
          mimeType = 'video/quicktime';
          break;
        case '3gp':
          mimeType = 'video/3gpp';
          break;
        case 'm4v':
          mimeType = 'video/x-m4v';
          break;
        default:
          mimeType = 'video/mp4'; // default to mp4
      }
      
      videoFormData.append('mediaFile', {
        uri: video.uri,
        type: mimeType,
        name: `shorts.${fileExtension}`
      });

      const videoUploadResponse = await fetch(`${base_url}/uploadFile?mediaType=shorts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: videoFormData,
      });

      let videoResponseText;
      try {
        videoResponseText = await videoUploadResponse.text();
        console.log('Video Upload Response:', videoResponseText);
      } catch (error) {
        console.error('Error reading response:', error);
        throw new Error('Failed to read server response');
      }

      if (!videoUploadResponse.ok) {
        if (videoUploadResponse.status === 413) {
          throw new Error('Video file is too large. Please select a smaller video.');
        }
        throw new Error('Failed to upload video');
      }

      let videoData;
      try {
        videoData = JSON.parse(videoResponseText);
        console.log('Parsed Video Data:', videoData);
      } catch (error) {
        console.error('Error parsing video response:', error);
        throw new Error('Invalid server response format');
      }

      if (!videoData || typeof videoData !== 'object') {
        throw new Error('Invalid response format from server');
      }

      const videoUrl = videoData.urls || videoData.data?.urls;
      if (!videoUrl) {
        throw new Error('Video URL not found in response');
      }

      // Handle videoUrl if it's an array
      const finalVideoUrl = Array.isArray(videoUrl) ? videoUrl[0] : videoUrl;
      if (!finalVideoUrl) {
        throw new Error('Invalid video URL format');
      }

      const createShortResponse = await fetch(`${base_url}/shorts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: title,
          description: description,
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalVideoUrl // Using the same URL for thumbnail as it's a video
        }),
      });

      let createShortResponseText;
      try {
        createShortResponseText = await createShortResponse.text();
        console.log('Create Short Response:', createShortResponseText);
      } catch (error) {
        console.error('Error reading create short response:', error);
        throw new Error('Failed to read create short response');
      }

      if (!createShortResponse.ok) {
        throw new Error('Failed to create short');
      }

      let createShortData;
      try {
        createShortData = JSON.parse(createShortResponseText);
        console.log('Parsed Create Short Data:', createShortData);
      } catch (error) {
        console.error('Error parsing create short response:', error);
        throw new Error('Invalid create short response format');
      }

      if (!createShortData || typeof createShortData !== 'object') {
        throw new Error('Invalid create short response format');
      }

      Alert.alert('Success', 'Short created successfully');
      navigation.navigate('MainLanding');
    } catch (error) {
      console.error('Error creating short:', {
        message: error.message,
        stack: error.stack
      });
      Alert.alert('Error', error.message || 'Failed to create short');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Short</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.videoContainer} onPress={pickVideo}>
          {video ? (
            <View style={styles.videoPreviewContainer}>
              <Video
                source={{ uri: video.uri }}
                style={styles.videoPreview}
                resizeMode="cover"
                shouldPlay={false}
                isMuted={true}
              />
              <View style={styles.videoOverlay}>
                <MaterialIcons name="play-circle-outline" size={50} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialIcons name="video-library" size={50} color={colors.btncolor} />
              <Text style={styles.placeholderText}>Select Video (max 30s)</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isUploading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isUploading}>
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Upload Short</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ShortsUpload;