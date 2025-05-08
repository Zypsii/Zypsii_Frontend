import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  Image, 
  Alert, 
  StyleSheet,
  Button,
  Modal,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SkeletonLoader from '../Loader/SkeletonLoader';
import { base_url } from '../../utils/base_url';
import InstaStory from 'react-native-insta-story';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

const Stories = () => {
  const navigation = useNavigation();
  const [image, setImage] = useState(null);
  const [storyInfo, setStoryInfo] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState();
  const [seenStories, setSeenStories] = useState(new Set());
  const [showStories, setShowStories] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUserStories, setCurrentUserStories] = useState([]);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [myStories, setMyStories] = useState([]);
  const [mediaType, setMediaType] = useState(null);

  const loadUserId = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      const parsedUser = user ? JSON.parse(user) : null;

      if (parsedUser && parsedUser._id) {
        setUserId(parsedUser._id);
      } else {
        console.error('User not found or user ID is missing');
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch('https://admin.zypsii.com/story/list', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Transform the API response to match the format expected by InstaStory
        const transformedStories = data.data.stories.map(story => ({
          user_id: story._id,
          user_image: story.thumbnailUrl,
          user_name: story.title,
          stories: [{
            story_id: story._id,
            story_image: story.videoUrl,
            swipeText: story.description,
            onPress: () => console.log('story swiped'),
          }]
        }));
        
        setStoryInfo(transformedStories);
      } else {
        setError(data.message || 'Failed to fetch stories');
      }
    } catch (error) {
      setError('Error fetching stories: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    loadUserId();
  }, []);

  const pickMedia = async (type) => {
    try {
      let permissionResult;
      if (type === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        Alert.alert("Permission required", `You need to allow access to ${type === 'camera' ? 'camera' : 'photos'} to upload media.`);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
        videoMaxDuration: 30, // 30 seconds max for stories
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setMediaType(asset.type);
        setImage(asset);
        uploadStory(asset);
        setShowImagePickerModal(false);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "You need to allow access to your camera to take a photo or video.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
        videoMaxDuration: 30,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setMediaType(asset.type);
        setImage(asset);
        uploadStory(asset);
        setShowImagePickerModal(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadStory = async (mediaAsset) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      // Create form data
      const uploadFormData = new FormData();
      const fileUri = mediaAsset.uri.replace('file://', '');
      
      // Get file extension and set appropriate MIME type
      const fileExtension = fileUri.split('.').pop().toLowerCase();
      const mimeType = mediaAsset.type === 'video' ? 'video/mp4' : 'image/jpeg';
      
      // Create file object for upload
      uploadFormData.append('mediaFile', {
        uri: mediaAsset.uri,
        type: mimeType,
        name: `${mediaAsset.type}.${fileExtension}`
      });

      // Upload the media file
      const uploadResponse = await fetch(`${base_url}/uploadFile?mediaType=story`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: uploadFormData,
      });

      const uploadResponseData = await uploadResponse.json();

      if (!uploadResponseData.status || !uploadResponseData.urls || !uploadResponseData.urls[0]) {
        throw new Error('Failed to upload media file');
      }

      // Create the story with the uploaded file URL
      const storyData = {
        title: "My Story",
        description: "Check out my story!",
        videoUrl: uploadResponseData.urls[0],
        thumbnailUrl: mediaAsset.type === 'video' ? uploadResponseData.thumbnailUrl : uploadResponseData.urls[0],
        mediaType: mediaAsset.type,
        duration: mediaAsset.duration || 0,
        tags: []
      };

      const response = await fetch(`${base_url}/story/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Story uploaded successfully:', data.data);
        fetchStories();
        const newStory = {
          user_id: userId,
          user_image: 'https://via.placeholder.com/150',
          user_name: 'User',
          stories: [{
            story_id: data.data._id,
            story_image: data.data.thumbnailUrl,
            story_video: data.data.videoUrl,
            mediaType: data.data.mediaType,
            duration: data.data.duration,
            swipeText: 'Swipe to view more',
            onPress: () => console.log('story swiped'),
          }]
        };

        // Update stories list
        const existingUserIndex = storyInfo.findIndex(story => story.user_id === userId);
        if (existingUserIndex !== -1) {
          setStoryInfo(prev => {
            const updated = [...prev];
            updated[existingUserIndex].stories = [
              ...updated[existingUserIndex].stories,
              newStory.stories[0]
            ];
            return updated;
          });
        } else {
          setStoryInfo(prev => [...prev, newStory]);
        }
      } else {
        throw new Error(data.message || 'Failed to create story');
      }
    } catch (error) {
      console.error('Error uploading story:', error);
      Alert.alert('Error', 'Failed to upload story. Please try again.');
    }
  };

  const updateSeenStories = ({ story: { story_id } }) => {
    setSeenStories((prevSet) => {
      prevSet.add(story_id);
      return prevSet;
    });
  };

  const handleSeenStories = async (item) => {
    console.log(item);
    const storyIds = [];
    seenStories.forEach((storyId) => {
      if (storyId) storyIds.push(storyId);
    });
    if (storyIds.length > 0) {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        await fetch(`${base_url}/story/mark-seen`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storyIds }),
        });
        seenStories.clear();
      } catch (error) {
        console.error('Error marking stories as seen:', error);
      }
    }
  };

  const handleStoryPress = (user) => {
    // Create a new array with only the selected user's stories
    const userStories = [{
      ...user,
      stories: [...user.stories] // Create a new array of stories to avoid reference issues
    }];
    
    setSelectedUser(user);
    setCurrentUserStories(userStories);
    setShowStories(true);
  };

  const renderStoryContent = (story) => {
    if (story.mediaType === 'video') {
      return (
        <Video
          source={{ uri: story.story_video }}
          style={styles.storyVideo}
          resizeMode="cover"
          shouldPlay
          isLooping
          useNativeControls={false}
        />
      );
    }
    return (
      <Image
        source={{ uri: story.story_image }}
        style={styles.storyImage}
        resizeMode="cover"
      />
    );
  };

  const renderStoryItem = ({ item }) => {
    const hasStories = item.stories && item.stories.length > 0;
    
    return (
      <TouchableOpacity 
        onPress={() => hasStories && handleStoryPress(item)}
        disabled={!hasStories}
      >
        <View style={styles.storyItemContainer}>
          <View style={[
            styles.storyCircle,
            !hasStories && styles.disabledStoryCircle
          ]}>
            {item.stories[0]?.mediaType === 'video' ? (
              <Video
                source={{ uri: item.stories[0].story_video }}
                style={styles.storyThumbnail}
                resizeMode="cover"
                shouldPlay={false}
                useNativeControls={false}
              />
            ) : (
              <Image
                source={{ uri: item.user_image }}
                style={styles.storyImage}
              />
            )}
            {item.stories[0]?.mediaType === 'video' && (
              <View style={styles.videoIndicator}>
                <Ionicons name="videocam" size={12} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.storyName}>{item.user_name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderYourStory = () => {
    const hasStories = myStories.length > 0;
    return (
      <TouchableOpacity 
        style={styles.yourStoryContainer}
        onPress={() => setShowImagePickerModal(true)}
      >
        <View style={[styles.storyCircle, hasStories && styles.storyCircleActive]}>
          <Image
            source={{ uri: 'https://via.placeholder.com/150' }} // Replace with user's profile picture
            style={styles.storyImage}
          />
          {!hasStories && (
            <View style={styles.addIconContainer}>
              <Ionicons name="add-circle" size={24} color="#fff" />
            </View>
          )}
        </View>
        <Text style={styles.storyUsername}>Your Story</Text>
      </TouchableOpacity>
    );
  };

  const renderImagePickerModal = () => (
    <Modal
      visible={showImagePickerModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImagePickerModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={takePhoto}
          >
            <Ionicons name="camera" size={24} color="#000" />
            <Text style={styles.modalButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={() => {
              setShowImagePickerModal(false);
              navigation.navigate('ReelUpload');
            }}
          >
            <Ionicons name="videocam" size={24} color="#000" />
            <Text style={styles.modalButtonText}>Upload Reel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={() => {
              setShowImagePickerModal(false);
              navigation.navigate('ReelUpload');
            }}
          >
            <Ionicons name="image" size={24} color="#000" />
            <Text style={styles.modalButtonText}>Upload Post</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowImagePickerModal(false)}
          >
            <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              setStoryInfo([]);
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isLoading) {
      return (
        <SkeletonLoader
          count={6}
          circleSize={68}
          textWidth={40}
          textHeight={10}
          containerStyle={styles.skeletonContainer}
        />
      );
    }

    return (
      <View style={styles.container}>
        {renderImagePickerModal()}
        <View style={styles.storiesContainer}>
          {renderYourStory()}
          <InstaStory
            data={storyInfo}
            duration={10}
            onStart={(item) => {
              console.log('Story started:', item);
              if (item.user_id === userId) {
                setShowStories(true);
                setSelectedUser(item);
              }
            }}
            onClose={() => {
              handleSeenStories();
              setShowStories(false);
              setSelectedUser(null);
            }}
            onStorySeen={updateSeenStories}
            renderCloseComponent={({ onPress }) => (
              <View style={styles.closeContainer}>
                <Button title="Share" onPress={() => console.log('Share story')} />
                <Button title="X" onPress={onPress} />
              </View>
            )}
            renderTextComponent={({ item, profileName }) => (
              <View style={styles.textContainer}>
                <Text style={styles.profileName}>{profileName}</Text>
                {item.user_id === userId && !item.stories?.length && (
                  <TouchableOpacity
                    onPress={() => {
                      setShowImagePickerModal(true);
                      setMediaType(null);
                    }}
                    style={styles.addStoryButton}
                  >
                    <Entypo name="circle-with-plus" style={styles.addIcon} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            style={styles.instaStory}
            onAddStoryPress={() => {
              if (userId) {
                pickMedia('camera');
              }
            }}
            showAddStoryButton={true}
            addStoryButtonStyle={styles.addStoryButton}
            addStoryButtonIcon={<Entypo name="circle-with-plus" style={styles.addIcon} />}
            unPressedBorderColor="#A60F93"

          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  storiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  storyItemContainer: {
    flexDirection: 'column',
    paddingHorizontal: 8,
    position: 'relative',
    alignItems: 'center',
  },
  storyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  storyImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  storyName: {
    textAlign: 'center',
    fontSize: 10,
    opacity: 0.5,
    marginTop: 4,
  },
  addStoryButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderWidth: 1.8,
    borderRadius: 100,
    borderColor: '#c13584',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
  addIcon: {
    fontSize: 20,
    color: '#c13584',
  },
  closeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  textContainer: {
    padding: 10,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  profileName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instaStory: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#870E6B',
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
  },
  skeletonContainer: {
    paddingHorizontal: 8,
  },
  disabledStoryCircle: {
    opacity: 0.5,
    borderColor: '#ccc',
  },
  yourStoryContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  storyCircleActive: {
    borderColor: '#3897f0',
  },
  storyUsername: {
    fontSize: 12,
    color: '#000',
  },
  addIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#a60f93',
    borderRadius: 100,
    padding: 0.1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalButtonText: {
    marginLeft: 10,
    fontSize: 16,
  },
  cancelButton: {
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#ff0000',
  },
  storiesContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  storyVideo: {
    width: '100%',
    height: '100%',
  },
  storyThumbnail: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
  },
});

export default Stories;
