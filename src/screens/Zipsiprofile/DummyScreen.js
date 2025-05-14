import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, ScrollView, Modal, Dimensions, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import styles from './styles';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils';
import { Feather, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Post from '../../components/Posts/Post';
import Schedule from '../MySchedule/Schedule/AllSchedule';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DummyScreen = ({ navigation }) => {
  const [activeIcon, setActiveIcon] = useState('th-large'); // Default active icon
  const [userId, setUserId] = useState(null);
  const [profileInfo, setProfileInfo] = useState({
    id: '',
    name: '',
    Posts: '0',
    Followers: '0',
    Following: '0',
    image: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [all_schedule, setAll_schedule] = useState([]);
  const [all_posts, setAllPosts] = useState([]);
  const [all_shorts, setAllShorts] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // First useEffect to get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('No access token found');
        }

        const response = await fetch(`${base_url}/user/getProfile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Profile fetch failed! Status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          const userData = result.data[0];
          setUserId(userData.id);
          setProfileInfo({
            id: userData.id || '',
            name: userData.fullName || '',
            Posts: userData.posts || '0',
            Followers: userData.followers || '0',
            Following: userData.following || '0',
            image: userData.profileImage || '',
            notes: userData.bio || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    getUserId();
  }, []);

  // Handle schedule item press
  const handleSchedulePress = (item) => {
    navigation.navigate('TripDetails', { tripId: item.id });
  };

  // Second useEffect to fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('No access token found');
        }

        // Fetch posts
        const postsResponse = await fetch(`${base_url}/post/listing/filter?filter=all&limit=20`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (postsResponse.ok) {
          try {
            const response = await postsResponse.json();
            
            if (response.success && Array.isArray(response.data)) {
              const postsData = response.data;
              console.log(postsData);
              
              const processedPosts = postsData
                .filter(item => item && typeof item === 'object') // Filter out invalid items
                .map(item => {
                  try {
                    return {
                      id: item._id || '',
                      postTitle: item.postTitle || '',
                      imageUrl: Array.isArray(item.mediaUrl) && item.mediaUrl.length > 0 
                        ? item.mediaUrl 
                        : '',
                      mediaType: item.mediaType || 'image',
                      likes: String(item.likesCount || 0),
                      comments: String(item.commentsCount || 0),
                      shares: String(item.shareCount || 0),
                      postType: item.postType || 'Public',
                      createdBy: item.createdBy || '',
                      createdAt: item.createdAt || '',
                      updatedAt: item.updatedAt || '',
                      tags: Array.isArray(item.tags) ? item.tags : []
                    };
                  } catch (error) {
                    console.error('Error processing post item:', error);
                    return null;
                  }
                })
                .filter(Boolean); // Remove any null items from failed processing

              setAllPosts(processedPosts);

              // Store pagination info if needed
              const pagination = {
                total: response.totalCount || 0,
                limit: response.limit || 20,
                offset: response.offset || 0,
                totalPages: Math.ceil((response.totalCount || 0) / (response.limit || 20))
              };
            } else {
              console.error('Invalid posts response format:', response);
              setAllPosts([]);
            }
          } catch (error) {
            console.error('Error processing posts response:', error);
            setAllPosts([]);
          }
        } else {
          console.error('Posts fetch failed:', postsResponse.status);
          setAllPosts([]);
        }

        // Fetch schedules with limit
        const scheduleResponse = await fetch(`${base_url}/schedule/listing/filter?limit=20`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (scheduleResponse.ok) {
          const response = await scheduleResponse.json();
          
          if (response.success && response.data) {
            const scheduleData = response.data;
            
            setAll_schedule(scheduleData.map(item => {
              // Helper function to format location
              const formatLocation = (locationObj) => {
                if (!locationObj) return '';
                if (typeof locationObj === 'string') return locationObj;
                if (locationObj.lat && locationObj.lng) {
                  return `${locationObj.lat}, ${locationObj.lng}`;
                }
                return '';
              };

              // Safely get locations
              const locationDetails = Array.isArray(item.locationDetails) ? item.locationDetails : [];
              const firstLocation = locationDetails[0]?.location;
              const lastLocation = locationDetails[locationDetails.length - 1]?.location;

              // Safely handle Dates array
              const dates = Array.isArray(item.Dates) ? item.Dates : [];

              return {
                id: item._id || '',
                title: item.tripName || '',
                from: formatLocation(firstLocation),
                to: formatLocation(lastLocation),
                date: dates[0]?.date || '',
                riders: String(item.numberOfDays || 0),
                joined: item.visible || 'Public',
                imageUrl: item.bannerImage || '',
                day1Locations: locationDetails.map(loc => ({
                  location: formatLocation(loc.location),
                  description: loc.description || ''
                })),
                day2Locations: dates.map(date => ({
                  date: date.date || '',
                  description: date.description || ''
                })),
                travelMode: item.travelMode || '',
                createdBy: item.createdBy || '',
                createdAt: item.createdAt || '',
                updatedAt: item.updatedAt || ''
              };
            }));

          }
        }

        // Fetch shorts
        const shortsResponse = await fetch(`${base_url}/shorts/listing`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        });

        if (shortsResponse.ok) {
          const response = await shortsResponse.json();
          
          if (response.status && response.data) {
            const shortsData = response.data
              .filter(item => typeof item.videoUrl === 'string' && item.videoUrl.toLowerCase().endsWith('.mp4'))
              .map(item => ({
                id: item._id || '',
                video: item.videoUrl || '',
                videoTitle: item.title || '',
                videoImage: item.thumbnailUrl || '',
                description: item.description || '',
                likes: String(item.likesCount || 0),
                views: String(item.viewsCount || 0),
                comments: String(item.commentsCount || 0),
                createdBy: item.createdBy || '',
                createdAt: item.createdAt || '',
                updatedAt: item.updatedAt || '',
                tags: item.tags || []
              }));
            
            setAllShorts(shortsData);
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []); // Run once when component mounts

  // Add console logs for state changes
  useEffect(() => {
  }, [profileInfo]);

  useEffect(() => {
  }, [all_posts]);

  useEffect(() => {
  }, [all_schedule]);

  useEffect(() => {

  }, [all_shorts]);

  // Local images for grid view (th-large)
  const images = {
    'th-large': [
      { id: '1', uri: require('../../assets/image1.jpg') },
      { id: '2', uri: require('../../assets/image2.jpg') },
      { id: '3', uri: require('../../assets/image3.jpg') },
      { id: '4', uri: require('../../assets/image4.jpg') },
    ],
  };

  // Generate placeholders if no images are available
  const getImageData = () => {
    return images['th-large'].length > 0
      ? images['th-large']
      : Array(6)
          .fill(null)
          .map((_, index) => ({ id: `${index + 1}`, isPlaceholder: true }));
  };

  const handleVideoPress = (item) => {
    setSelectedVideo(item);
    setIsFullScreen(true);
    StatusBar.setHidden(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
    setSelectedVideo(null);
    StatusBar.setHidden(false);
  };

  const renderFullScreenVideo = () => {
    if (!selectedVideo) return null;

    return (
      <Modal
        visible={isFullScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseFullScreen}
      >
        <View style={fullScreenStyles.container}>
          <TouchableOpacity 
            style={fullScreenStyles.closeButton}
            onPress={handleCloseFullScreen}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          <WebView
            source={{ uri: selectedVideo.video }}
            style={fullScreenStyles.video}
            allowsFullscreenVideo
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            mediaPlaybackRequiresUserAction={false}
          />

          <View style={fullScreenStyles.videoInfo}>
            <Text style={fullScreenStyles.videoTitle}>{selectedVideo.videoTitle || 'Untitled'}</Text>
            <Text style={fullScreenStyles.videoDescription}>{selectedVideo.description || 'No description'}</Text>
            <View style={fullScreenStyles.videoStats}>
              <Text style={fullScreenStyles.statText}>{selectedVideo.views || '0'} views</Text>
              <Text style={fullScreenStyles.statText}>{selectedVideo.likes || '0'} likes</Text>
              <Text style={fullScreenStyles.statText}>{selectedVideo.comments || '0'} comments</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Modify the renderItem in the FlatList
  const renderShortItem = ({ item }) => {
    if (!item) return null;

    return (
      <TouchableOpacity 
        style={videoStyles.videoContainer}
        onPress={() => handleVideoPress(item)}
      >
        {item.video ? (
          <WebView
            source={{ uri: item.video }}
            style={videoStyles.webviewVideo}
            allowsFullscreenVideo
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            mediaPlaybackRequiresUserAction={false}
          />
        ) : (
          <Image 
            source={{ uri: item.videoImage }}
            style={videoStyles.webviewVideo}
            resizeMode="cover"
          />
        )}
        <View style={videoStyles.videoInfo}>
          <Text style={videoStyles.videoTitle}>{item.videoTitle || 'Untitled'}</Text>
          <Text style={videoStyles.videoDescription}>{item.description || 'No description'}</Text>
          <View style={videoStyles.videoStats}>
            <Text style={videoStyles.statText}>{item.views || '0'} views</Text>
            <Text style={videoStyles.statText}>{item.likes || '0'} likes</Text>
            <Text style={videoStyles.statText}>{item.comments || '0'} comments</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render content based on active icon
  const renderContent = () => {
    switch (activeIcon) {
      case 'th-large':
        return (
          <FlatList
            data={all_posts}
            renderItem={({ item }) => {
              if (!item) return null;
              
              // Add null checks for all required properties
              const postData = {
                id: item?.id || '',
                postTitle: item?.postTitle || '',
                imageUrl: item?.imageUrl || [], // This is already an array from the API
                mediaType: item?.mediaType || 'image',
                likesCount: item?.likes || '0',
                commentsCount: item?.comments || '0',
                shareCount: item?.shares || '0',
                postType: item?.postType || 'Public',
                createdBy: item?.createdBy || '',
                createdAt: item?.createdAt || '',
                tags: item?.tags || []
              };

              return (
                <View style={{ marginBottom: 10 }}>
                  <Post item={postData} isFromProfile={true} />
                </View>
              );
            }}
            keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text>No posts available</Text>
              </View>
            )}
          />
        );
      case 'briefcase':
        return (
          <FlatList
            vertical
            showsVerticalScrollIndicator={false}
            data={all_schedule}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSchedulePress(item)}>
                <Schedule item={item} isFromProfile={true} />
              </TouchableOpacity>
            )}
          />
        );
      case 'play-circle':
        return (
          <>
            <FlatList
              vertical
              showsVerticalScrollIndicator={false}
              data={all_shorts}
              keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
              renderItem={renderShortItem}
              ListEmptyComponent={() => (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text>No shorts available</Text>
                </View>
              )}
            />
            {renderFullScreenVideo()}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.protractorShape} />
      <View style={styles.backgroundCurvedContainer} />
      {/* Header Section */}
      <View style={styles.header}>
        {/* Icons Row */}
        <View style={styles.topIconsRow}>
          <View style={styles.circle}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Profile Section */}
      <TouchableOpacity
        style={styles.profileContainer}
        onPress={() => navigation.goBack()}
      >
        <Image
          source={{uri:profileInfo.image}} // Local profile image
          style={styles.profileImage}
        />
        <Text style={styles.name}>{profileInfo.name || 'Jenish'}</Text>
        <Text style={styles.description}>{profileInfo.notes}</Text>
      </TouchableOpacity>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Posts</Text>
          <Text style={styles.statNumber}>{profileInfo.Posts || '0'}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Followers</Text>
          <Text style={styles.statNumber}>{profileInfo.Followers || '0'}</Text>
        </View>
        <View style={styles.statLast}>
          <Text style={styles.statLabel}>Following</Text>
          <Text style={styles.statNumber}>{profileInfo.Following || '0'}</Text>
        </View>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.editProfileButton}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Gray Line */}
      <View style={styles.separatorLine} />

      {/* Icons Section */}
      <View style={styles.iconsContainer}>
        <TouchableOpacity
          style={[
            styles.iconBox,
            activeIcon === 'th-large' && styles.activeIconBox,
          ]}
          onPress={() => setActiveIcon('th-large')}
        >
          <Icon name="th-large" size={30} color="#870E6B" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.iconBox,
            activeIcon === 'briefcase' && styles.activeIconBox,
          ]}
          onPress={() => setActiveIcon('briefcase')}
        >
          <Icon name="briefcase" size={30} color="#870E6B" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.iconBox,
            activeIcon === 'play-circle' && styles.activeIconBox,
          ]}
          onPress={() => setActiveIcon('play-circle')}
        >
          <Icon name="play-circle" size={30} color="#870E6B" />
        </TouchableOpacity>
      </View>

      {/* Content Section based on active icon */}
      <View style={contentStyles.contentContainer}>
        {renderContent()}
      </View>
    </View>
  );
};

// Additional styles needed for the content sections
const contentStyles = {
  contentContainer: {
    flex: 1,
    marginTop: 10,
    zIndex: 2,
    paddingHorizontal: 5,
  },
};

// Styles for schedule cards
const cardStyles = {
  card: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeItem: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  routeText: {
    fontSize: 14,
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    marginBottom: 4,
  },
  riders: {
    fontSize: 14,
    color: '#666',
  },
  joinedButton: {
    backgroundColor: '#870E6B',
    padding: 8,
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  joinedText: {
    color: 'white',
    fontWeight: 'bold',
  },
};

// Styles for video/shorts
const videoStyles = {
  videoContainer: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  webviewVideo: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  videoInfo: {
    padding: 15,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  videoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  videoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  }
};

// Add new styles for full-screen view
const fullScreenStyles = {
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1000,
    padding: 10,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 14,
    color: 'white',
    marginBottom: 12,
  },
  videoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8,
  },
  statText: {
    fontSize: 12,
    color: 'white',
  }
};

export default DummyScreen;