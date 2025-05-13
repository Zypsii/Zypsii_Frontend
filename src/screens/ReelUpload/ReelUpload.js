import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../utils";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import styles from "./Styles";
import { base_url } from "../../utils/base_url";
import NotificationService from "../../services/NotificationService";
import ContentTypeModal from "../../components/ContentTypeModal/ContentTypeModal";

function ReelUpload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [showContentTypeModal, setShowContentTypeModal] = useState(true);
  const [contentType, setContentType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    setShowContentTypeModal(true);
  }, []);

  const handleContentTypeSelect = (type) => {
    setContentType(type);
    setShowContentTypeModal(false);
  };

  const handleBackPress = () => {
    navigation.goBack();
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
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } else {
      Alert.alert("Permission required", "You need to allow camera access to take photos.");
    }
  };

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } else {
      Alert.alert("Permission required", "You need to allow access to your media library.");
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      Alert.alert("Error", "Please select an image to upload.");
      return;
    }
  
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (!accessToken) {
        Alert.alert("Error", "You need to be logged in to submit.");
        setIsLoading(false);
        return;
      }

      const uploadFormData = new FormData();
      const fileUri = image.uri.replace('file://', '');
      
      const fileExtension = fileUri.split('.').pop().toLowerCase();
      let mimeType = 'image/jpeg';
      
      if (fileExtension === 'png') {
        mimeType = 'image/png';
      } else if (fileExtension === 'gif') {
        mimeType = 'image/gif';
      } else if (fileExtension === 'webp') {
        mimeType = 'image/webp';
      }

      uploadFormData.append('mediaFile', {
        uri: image.uri,
        type: mimeType,
        name: `image.${fileExtension}`
      });

      try {
        const uploadResponse = await fetch(`${base_url}/uploadFile?mediaType=post`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
          body: uploadFormData,
        });

        if (uploadResponse.status === 413) {
          Alert.alert("Error", "The file is too large. Please try uploading a smaller file.");
          setIsLoading(false);
          return;
        }

        let uploadResponseData;
        try {
          const responseText = await uploadResponse.text();
          uploadResponseData = JSON.parse(responseText);
        } catch (error) {
          console.error('Error parsing response:', error);
          Alert.alert("Error", "Failed to process the upload response. Please try again.");
          setIsLoading(false);
          return;
        }

        if (!uploadResponseData.status) {
          Alert.alert("Error", uploadResponseData.message || "Failed to upload file");
          setIsLoading(false);
          return;
        }

        if (!uploadResponseData.urls || !uploadResponseData.urls[0]) {
          Alert.alert("Error", "No file URL returned from upload");
          setIsLoading(false);
          return;
        }

        const postFormData = new FormData();
        postFormData.append('postTitle', title);
        postFormData.append('postType', 'Public');
        postFormData.append('mediaType', 'image');
        postFormData.append('mediaUrl[]', uploadResponseData.urls[0]);
        postFormData.append('tags[]', 'new');

        const response = await fetch(`${base_url}/post/create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
          body: postFormData,
        });

        const responseData = await response.json();

        if (response.ok) {
          Alert.alert("Success", "Your post was successfully created!");
          navigation.goBack();
        } else {
          console.error("Error creating post. Status:", response.status);
          console.error("Error response data:", responseData);
          Alert.alert("Error", responseData.message || "There was an error creating your post.");
        }
      } catch (error) {
        console.error("Network error:", error);
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again. If the problem persists, try uploading a smaller file."
        );
      }
    } catch (error) {
      console.error("Error in creating post:", error);
      Alert.alert("Error", "There was an error creating your post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const user = JSON.parse(userData);
      
      const expoPushToken = await AsyncStorage.getItem('expoPushToken');
      
      if (!expoPushToken) {
        Alert.alert("Error", "No push token found. Please make sure you're logged in.");
        return;
      }

      await NotificationService.sendReelNotification(user.fullName, expoPushToken);
      Alert.alert("Success", "Test notification sent!");
    } catch (error) {
      console.error("Error sending test notification:", error);
      Alert.alert("Error", "Failed to send test notification");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ContentTypeModal
        visible={showContentTypeModal}
        onClose={() => setShowContentTypeModal(false)}
        onSelectType={handleContentTypeSelect}
      />

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
      </View>

      {contentType && (
        <ScrollView>
          <TouchableOpacity 
            style={styles.imageContainer} 
            onPress={pickImage}
          >
            {image ? (
              <Image 
                source={{ uri: image.uri }} 
                style={styles.selectedImage} 
              />
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

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder="Add a title..."
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
      )}
    </SafeAreaView>
  );
}

export default ReelUpload;
