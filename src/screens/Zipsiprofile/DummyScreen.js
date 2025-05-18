import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, ScrollView, Modal, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import styles from './styles';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils';
import { Feather, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Post from '../../components/Posts/Post';
import Schedule from '../MySchedule/Schedule/AllSchedule';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

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
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [all_schedule, setAll_schedule] = useState([]);
  const [all_posts, setAllPosts] = useState([]);
  const [all_shorts, setAllShorts] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [placeNames, setPlaceNames] = useState({});

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
    if (!item || !item.id) {
      console.error('Invalid schedule item:', item);
      return;
    }
    navigation.navigate('TripDetails', { tripId: item.id });
  };

  // Function to get place name from coordinates
  const getPlaceName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDxXqXQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return `${lat}, ${lng}`;
    } catch (error) {
      console.error('Error getting place name:', error);
      return `${lat}, ${lng}`;
    }
  };

  // Function to process location data
  const processLocationData = async (scheduleData) => {
    try {
      const processedData = await Promise.all(
        scheduleData.map(async (item) => {
          if (!item) return null;

          const locationDetails = Array.isArray(item.locationDetails) ? item.locationDetails : [];
          const firstLocation = locationDetails[0]?.location;
          const lastLocation = locationDetails[locationDetails.length - 1]?.location;

          let fromPlace = '';
          let toPlace = '';

          if (firstLocation) {
            fromPlace = await getPlaceName(firstLocation.lat, firstLocation.lng);
          }

          if (lastLocation) {
            toPlace = await getPlaceName(lastLocation.lat, lastLocation.lng);
          }

          return {
            id: item._id || Math.random().toString(),
            title: item.tripName || 'Untitled Trip',
            fromPlace: fromPlace || 'Location not available',
            toPlace: toPlace || 'Location not available',
            date: Array.isArray(item.Dates) && item.Dates.length > 0 ? item.Dates[0].date : '',
            riders: String(item.numberOfDays || 0),
            imageUrl: item.bannerImage || '',
            travelMode: item.travelMode || '',
            createdBy: item.createdBy || '',
            createdAt: item.createdAt || '',
            updatedAt: item.updatedAt || ''
          };
        })
      );

      // Filter out any null items
      const validData = processedData.filter(item => item !== null);
      setAll_schedule(validData);
    } catch (error) {
      console.error('Error processing location data:', error);
      setAll_schedule([]);
    }
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
                .filter(item => item && typeof item === 'object')
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
                .filter(Boolean);

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
        setScheduleLoading(true);
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
            await processLocationData(response.data);
          }
        }
        setScheduleLoading(false);

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
            numColumns={3}
            key="grid"
            renderItem={({ item }) => {
              if (!item) return null;
              
              return (
                <TouchableOpacity 
                  style={gridStyles.gridItem}
                  onPress={() => navigation.navigate('PostDetail', { post: item })}
                >
                  {item.imageUrl && item.imageUrl.length > 0 ? (
                    <Image
                      source={{ uri: item.imageUrl[0] }}
                      style={gridStyles.gridImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[gridStyles.gridImage, gridStyles.placeholderImage]}>
                      <MaterialIcons name="image" size={40} color="#ccc" />
                    </View>
                  )}
                  <View style={gridStyles.gridItemInfo}>
                    <Text style={gridStyles.gridItemTitle} numberOfLines={1}>
                      {item.postTitle || 'Untitled'}
                    </Text>
                    <View style={gridStyles.gridItemStats}>
                      <View style={gridStyles.statItem}>
                        <MaterialIcons name="favorite" size={14} color="#870E6B" />
                        <Text style={gridStyles.statText}>{item.likes || '0'}</Text>
                      </View>
                      <View style={gridStyles.statItem}>
                        <MaterialIcons name="comment" size={14} color="#870E6B" />
                        <Text style={gridStyles.statText}>{item.comments || '0'}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
            contentContainerStyle={gridStyles.gridContainer}
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
            data={all_schedule}
            key="schedule"
            keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => {
              if (!item) return null;
              
              return (
                <TouchableOpacity 
                  onPress={() => handleSchedulePress(item)}
                  style={scheduleStyles.scheduleCard}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={scheduleStyles.scheduleImage}
                    resizeMode="cover"
                  />
                  <View style={scheduleStyles.scheduleContent}>
                    <Text style={scheduleStyles.scheduleTitle}>{item.title}</Text>
                    <View style={scheduleStyles.routeContainer}>
                      <View style={scheduleStyles.routeItem}>
                        <Text style={scheduleStyles.routeLabel}>From</Text>
                        <View style={scheduleStyles.locationRow}>
                          <MaterialIcons name="location-on" size={16} color="#870E6B" />
                          <Text style={scheduleStyles.routeText} numberOfLines={2}>
                            {item.fromPlace}
                          </Text>
                        </View>
                      </View>
                      <View style={scheduleStyles.routeItem}>
                        <Text style={scheduleStyles.routeLabel}>To</Text>
                        <View style={scheduleStyles.locationRow}>
                          <MaterialIcons name="location-on" size={16} color="#870E6B" />
                          <Text style={scheduleStyles.routeText} numberOfLines={2}>
                            {item.toPlace}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={scheduleStyles.scheduleFooter}>
                      <View style={scheduleStyles.dateContainer}>
                        <MaterialIcons name="event" size={16} color="#666" />
                        <Text style={scheduleStyles.dateText}>{item.date}</Text>
                      </View>
                      <View style={scheduleStyles.ridersContainer}>
                        <MaterialIcons name="group" size={16} color="#666" />
                        <Text style={scheduleStyles.ridersText}>{item.riders} Riders</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={scheduleStyles.scheduleList}
            ListEmptyComponent={() => (
              <View style={{ padding: 20, alignItems: 'center' }}>
                {scheduleLoading ? (
                  <View style={scheduleStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#870E6B" />
                    <Text style={scheduleStyles.loadingText}>Loading schedules...</Text>
                  </View>
                ) : (
                  <Text>No schedules available</Text>
                )}
              </View>
            )}
          />
        );
      case 'play-circle':
        return (
          <>
            <FlatList
              data={all_shorts}
              numColumns={3}
              key="shorts-grid"
              renderItem={({ item }) => {
                if (!item) return null;
                
                return (
                  <TouchableOpacity 
                    style={gridStyles.gridItem}
                    onPress={() => handleVideoPress(item)}
                  >
                    {item.videoImage ? (
                      <Image
                        source={{ uri: item.videoImage }}
                        style={gridStyles.gridImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[gridStyles.gridImage, gridStyles.placeholderImage]}>
                        <MaterialIcons name="play-circle" size={40} color="#ccc" />
                      </View>
                    )}
                    <View style={gridStyles.gridItemInfo}>
                      <Text style={gridStyles.gridItemTitle} numberOfLines={1}>
                        {item.videoTitle || 'Untitled'}
                      </Text>
                      <View style={gridStyles.gridItemStats}>
                        <View style={gridStyles.statItem}>
                          <MaterialIcons name="favorite" size={14} color="#870E6B" />
                          <Text style={gridStyles.statText}>{item.likes || '0'}</Text>
                        </View>
                        <View style={gridStyles.statItem}>
                          <MaterialIcons name="visibility" size={14} color="#870E6B" />
                          <Text style={gridStyles.statText}>{item.views || '0'}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
              contentContainerStyle={gridStyles.gridContainer}
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
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: screenWidth,
    height: screenHeight * 0.7,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1000,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
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

// Add new styles for grid layout
const gridStyles = {
  gridContainer: {
    padding: 5,
  },
  gridItem: {
    flex: 1/3,
    margin: 5,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  gridItemInfo: {
    padding: 8,
  },
  gridItemTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  gridItemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
};

// Add new styles for schedule
const scheduleStyles = {
  scheduleList: {
    padding: 15,
  },
  scheduleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  scheduleImage: {
    width: '100%',
    height: 180,
  },
  scheduleContent: {
    padding: 15,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  routeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  routeItem: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
    flex: 1,
  },
  scheduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  ridersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ridersText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
};

export default DummyScreen;