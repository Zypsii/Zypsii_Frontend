import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../utils";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import styles from "./Styles";
import { base_url } from "../../utils/base_url";
import { useToast } from '../../context/ToastContext';
import { Picker } from '@react-native-picker/picker';
import ImageFilterModal from '../../components/ImageFilterModal';
import FilteredImageDisplay from '../../components/ImageFilterModal/FilteredImageDisplay';

function PostUpload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [postType, setPostType] = useState("Public");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const navigation = useNavigation();
  const { showToast } = useToast();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleFilterApplied = (filteredImage) => {
    // Store the filtered image data for upload
    setImage(filteredImage);
    setShowFilterModal(false);
  };

  const openFilterModal = () => {
    if (image) {
      setShowFilterModal(true);
    } else {
      showToast("Please select an image first", "error");
    }
  };

  const pickImage = async () => {
    Alert.alert(
      "Select Media",
      "Choose an option",
      [
        {
          text: "Camera",
          onPress: () => openCamera(),
        },
        {
          text: "Gallery",
          onPress: () => openGallery(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        setOriginalImage(result.assets[0]);
      }
    } else {
      showToast("You need to allow camera access to take photos.", "error");
    }
  };

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        setOriginalImage(result.assets[0]);
      }
    } else {
      showToast("You need to allow access to your media library.", "error");
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      showToast("Please select an image to upload.", "error");
      return;
    }

    if (!title.trim()) {
      showToast("Please add a title for your post.", "error");
      return;
    }
  
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (!accessToken) {
        showToast("You need to be logged in to submit.", "error");
        setIsLoading(false);
        return;
      }

      const uploadFormData = new FormData();
      
      // Handle both original and filtered images
      let fileUri = image.uri;
      let fileName = `image.jpg`;
      let mimeType = 'image/jpeg';
      
      // If it's a filtered image, use the processed URI
      if (image.isFiltered && image.uri) {
        fileUri = image.uri;
        // Extract file extension from the URI
        const uriParts = fileUri.split('.');
        const fileExtension = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
        
        // Set appropriate mime type
        if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === 'webp') {
          mimeType = 'image/webp';
        }
        
        // Create filename with filter information
        fileName = `filtered_${image.appliedFilter || 'filter'}_${Date.now()}.${fileExtension}`;
      } else {
        // For original images, extract file extension
        const uriParts = fileUri.split('.');
        const fileExtension = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
        
        if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === 'webp') {
          mimeType = 'image/webp';
        }
        
        fileName = `image.${fileExtension}`;
      }

      // Use the same approach as ReelUpload for consistency
      uploadFormData.append('mediaFile', {
        uri: fileUri,
        type: mimeType,
        name: fileName
      });

      try {
        console.log('Uploading file:', fileName);
        console.log('File URI:', fileUri);
        console.log('File type:', mimeType);
        console.log('Is filtered:', image.isFiltered);
        
        const uploadResponse = await fetch(`${base_url}/uploadFile?mediaType=post`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
          body: uploadFormData,
        });

        if (uploadResponse.status === 413) {
          showToast("The file is too large. Please try uploading a smaller file.", "error");
          setIsLoading(false);
          return;
        }

        let uploadResponseData;
        try {
          const responseText = await uploadResponse.text();
          uploadResponseData = JSON.parse(responseText);
        } catch (error) {
          console.error('Error parsing response:', error);
          showToast("Failed to process the upload response. Please try again.", "error");
          setIsLoading(false);
          return;
        }

        if (!uploadResponseData.status) {
          showToast(uploadResponseData.message || "Failed to upload file", "error");
          setIsLoading(false);
          return;
        }

        if (!uploadResponseData.urls || !uploadResponseData.urls[0]) {
          showToast("No file URL returned from upload", "error");
          setIsLoading(false);
          return;
        }

        const postFormData = new FormData();
        postFormData.append('postTitle', title.trim());
        postFormData.append('postType', postType);
        postFormData.append('mediaType', 'image');
        postFormData.append('mediaUrl[]', uploadResponseData.urls[0]);
        postFormData.append('tags[]', 'new');
        if (description.trim()) {
          postFormData.append('postDescription', description.trim());
        }
        
        // Note: Filter information is stored in the image filename and metadata
        // Backend will receive the filtered image file but not the filter metadata
        // This avoids potential backend compatibility issues

        console.log('Creating post with data:', {
          title: title.trim(),
          postType,
          mediaType: 'image',
          mediaUrl: uploadResponseData.urls[0],
          isFiltered: image.isFiltered,
          appliedFilter: image.appliedFilter
        });

        const response = await fetch(`${base_url}/post/create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
          body: postFormData,
        });

        let responseData;
        try {
          responseData = await response.json();
        } catch (error) {
          console.error('Error parsing response:', error);
          const responseText = await response.text();
          console.error('Response text:', responseText);
          throw new Error('Invalid response from server');
        }

        if (response.ok) {
          showToast(`Your ${postType.toLowerCase()} post was successfully created!`, "success");
          navigation.goBack();
        } else {
          console.error("Error creating post. Status:", response.status);
          console.error("Error response data:", responseData);
          showToast(responseData.message || "There was an error creating your post.", "error");
        }
      } catch (error) {
        console.error("Network error:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          imageData: {
            uri: image?.uri,
            isFiltered: image?.isFiltered,
            appliedFilter: image?.appliedFilter
          }
        });
        
        let errorMessage = "Please check your internet connection and try again.";
        if (error.message.includes('Network request failed')) {
          errorMessage = "Network connection failed. Please check your internet connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Upload timed out. Please try uploading a smaller file or check your connection.";
        }
        
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Error in creating post:", error);
      showToast("There was an error creating your post. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
      </View>

      <ScrollView>
        <TouchableOpacity 
          style={styles.imageContainer} 
          onPress={pickImage}
        >
          {image ? (
            <View style={styles.imageContainer}>
              <FilteredImageDisplay
                image={image}
                style={styles.selectedImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons 
                name="camera"
                size={50} 
                color={colors.btncolor} 
              />
              <Text style={styles.placeholderText}>
                Tap to add photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Filter Controls */}
        {image && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 10 }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.btncolor,
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 10,
              }}
              onPress={openFilterModal}
            >
              <Ionicons name="color-filter-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.white, fontWeight: '600', fontSize: 16 }}>
                {image.isFiltered ? 'Change Filter' : 'Filter'}
              </Text>
            </TouchableOpacity>

            {image.isFiltered && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#ff6b6b',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => {
                  // Remove filter and restore original image
                  setImage({
                    ...originalImage,
                    isFiltered: false,
                    appliedFilter: null,
                    filterConfig: null,
                    filterStyle: null,
                    originalUri: null,
                    filterMetadata: null,
                  });
                }}
              >
                <Ionicons name="close-circle-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.white, fontWeight: '600', fontSize: 16 }}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Filter Applied Indicator */}
        {image && image.isFiltered && (
          <View style={{
            alignSelf: 'center',
            backgroundColor: '#4CAF50',
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 15,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Ionicons name="checkmark-circle" size={16} color={colors.white} style={{ marginRight: 6 }} />
            <Text style={{ color: colors.white, fontWeight: '600', fontSize: 14 }}>
              {image.filterConfig?.name || image.appliedFilter || 'Filter'} Applied
            </Text>
          </View>
        )}

        {/* Image Filter Modal */}
        <ImageFilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          originalImage={originalImage}
          onFilterApplied={handleFilterApplied}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Add a titl..."
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Add a description..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Post Type:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={postType}
              style={styles.picker}
              onValueChange={(itemValue) => setPostType(itemValue)}
            >
              <Picker.Item label="Public" value="Public" />
              <Picker.Item label="Followers Only" value="FollowersOnly" />
              <Picker.Item label="My Posts" value="my" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default PostUpload; 