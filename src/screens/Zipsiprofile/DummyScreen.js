import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import styles from './styles';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils';
import { Feather, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Post from '../../components/Posts/Post';
import Schedule from '../MySchedule/Schedule/AllSchedule';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    console.log('Navigating to trip details with ID:', item.id);
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
        const postsResponse = await fetch(`${base_url}/post/listing/lter?filter=all&limit=20`, {
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
              
              const processedPosts = postsData
                .filter(item => item && typeof item === 'object') // Filter out invalid items
                .map(item => {
                  try {
                    return {
                      id: item._id || '',
                      postTitle: item.postTitle || '',
                      postImage: Array.isArray(item.mediaUrl) && item.mediaUrl.length > 0 
                        ? item.mediaUrl[0] 
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

              console.log('Processed Posts:', JSON.stringify(processedPosts, null, 2));
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
          console.log('Shorts Response:', response);
          
          if (response.status && response.data) {
            const shortsData = response.data.map(item => ({
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
            
            console.log('Processed Shorts Data:', shortsData);
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
    console.log('Current Posts:', all_posts);
  }, [all_posts]);

  useEffect(() => {
  }, [all_schedule]);

  useEffect(() => {
    console.log('Current shorts:', all_shorts);

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
                postImage: item?.postImage || '',
                mediaType: item?.mediaType || 'image',
                likes: item?.likes || '0',
                comments: item?.comments || '0',
                shares: item?.shares || '0',
                postType: item?.postType || 'Public',
                createdBy: item?.createdBy || '',
                createdAt: item?.createdAt || '',
              };

              return (
                <Post
                  {...postData}
                />
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
                <Schedule item={item} />
              </TouchableOpacity>
            )}
          />
        );
      case 'play-circle':
        return (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={all_shorts}
            keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => {
              if (!item) return null;

              return (
                <View style={videoStyles.videoContainer}>
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
                </View>
              );
            }}
            ListEmptyComponent={() => (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text>No shorts available</Text>
              </View>
            )}
          />
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
        onPress={() => navigation.navigate('PageCreation')}
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
    width: 300,
    marginHorizontal: 10,
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
    height: 400, // Increased height for better video visibility
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

export default DummyScreen;