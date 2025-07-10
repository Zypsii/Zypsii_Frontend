import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Text, FlatList, TextInput, Image, ScrollView, TouchableOpacity, Linking } from 'react-native'
import styles from './styles'
import BottomTab from '../../components/BottomTab/BottomTab'
import { BackHeader } from '../../components'
import { SimpleLineIcons, MaterialIcons, Ionicons, FontAwesome, Feather, FontAwesome5, AntDesign } from '@expo/vector-icons'
import { colors } from '../../utils'
import MainBtn from '../../ui/Buttons/MainBtn'
import { ActivityIndicator } from 'react-native'
import { cardData } from '../CardData/CardData'
import DiscoverByNearest from '../../components/DiscoverByNearest/DiscoverByNearest'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url'
import { TextDefault } from '../../components';
import { useToast } from '../../context/ToastContext';
import Video from 'react-native-video';


function Destination({ route, navigation }) {
  const { showToast } = useToast();
  // Add default values and safe access
  const params = route?.params || {};
  const { image, cardTitle, subtitle } = params;
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('Main Attractions');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [discoverbynearest, setDiscoverbyNearest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shortsLoading, setShortsLoading] = useState(true);
  const [all_shorts, setAllShorts] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [googlePlaceDetails, setGooglePlaceDetails] = useState(null);

  // Safe access to nested properties with optional chaining and nullish coalescing
  const item_id = params?.product?.id ?? params?.id ?? null;
  const image1 = params?.product?.image ?? params?.image ?? null;
  const tolatitude = params?.tolatitude ?? params?.product?.tolatitude ?? params?.latitude ?? params?.lat;
  const tolongitude = params?.tolongitude ?? params?.product?.tolongitude ?? params?.longitude ?? params?.lng;

  const [nextPageToken, setNextPageToken] = useState(null);
  // Fetch data from an open-source API (JSONPlaceholder API for demonstration)
  // useEffect(() => {
  //   const fetchDiscoverbyNearest = async() => {
  //     try {
  //       const response = await fetch(baseUrl + '/discover_by_nearest')
  //       const data = await response.json()

  //       // Log to verify the data structure
  //       //  console.log(data);

  //       const formattedData = data.slice(0, 100).map(item => ({
  //         id: item.id,
  //         image: item.image,
  //         title: item.name,
  //         subtitle: item.subtitle
  //       }))

  //       //  console.log(formattedData); // Check the formatted data with image URLs

  //       setDiscoverbyNearest(formattedData)
  //     } catch (error) {
  //       console.error('Error fetching data:', error)
  //     }
  //   }

  //   fetchDiscoverbyNearest()
  // }, [])

  const fetchDiscoverbyNearest = async (token = "") => {
    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');

      const url = token
        ? `${base_url}/schedule/places/getNearest?nextPageToken=${token}&limit=10`
        : `${base_url}/schedule/places/getNearest?limit=10`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result)

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid data format received');
      }

      const formattedData = result.data.map(item => ({
        id: item._id,
        image: item.image,
        title: item.name,
        subtitle: item.address || item.subtitle || 'No address',
        rating: parseFloat(item.rating) || 0,
        distance: item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : null
      }));

      // Append new data to existing
      setDiscoverbyNearest(prevData => [...prevData, ...formattedData]);
      // Save the nextPageToken for future calls
      setNextPageToken(result.nextPageToken || null);
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast('Failed to load nearby places. Please try again later', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle reaching end of scroll
  const handleEndReached = () => {
    if (nextPageToken && !loading) {
      fetchDiscoverbyNearest(nextPageToken);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchDiscoverbyNearest();
  }, []);

  // Fetch shorts based on location
  const fetchShortsByLocation = async () => {
    try {
      setShortsLoading(true);
      
      if (!tolatitude || !tolongitude) {
        console.warn('No coordinates available for fetching location-based shorts');
        setAllShorts([]);
        return;
      }

      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${base_url}/shorts/list-based-location?placeLatitude=${tolatitude}&placeLongitude=${tolongitude}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Shorts by location response:', data);

      if (data.status && Array.isArray(data.data)) {
        const shortsData = data.data
          .filter(item => item.videoUrl && item.videoUrl.toLowerCase().endsWith('.mp4'))
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
      } else {
        console.error('Invalid shorts response format:', data);
        setAllShorts([]);
      }
    } catch (error) {
      console.error('Error fetching shorts by location:', error);
      setAllShorts([]);
    } finally {
      setShortsLoading(false);
    }
  };

  // Fetch shorts when component mounts or coordinates change
  useEffect(() => {
    if (tolatitude && tolongitude) {
      fetchShortsByLocation();
    }
  }, [tolatitude, tolongitude]);

  // Render footer loader
  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={colors.Zypsii_color} />
      </View>
    );
  };

  const [destinationData, setDestinationData] = useState(null) // ✅ Store fetched data

  useEffect(() => {
    const fetchDestinationData = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const response = await fetch(`${base_url}/schedule/places/getNearest`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        const data = await response.json();
        setDestinationData(data.data[0]); // Store the first item as destination data
      } catch (error) {
        console.error('Error fetching destination data:', error);
      }
    }

    fetchDestinationData();
  }, []);

  // YouTube tutorial videos data
  const [tutorialVideos, setTutorialVideos] = useState([])

  useEffect(() => {
    const fetchTutorialVideos = async () => {
      try {
        const response = await fetch() // Replace with your backend URL
        const data = await response.json()
        setTutorialVideos(data.videos) // Access the 'videos' array from the response
      } catch (error) {
        //console.error('Error fetching tutorial videos:', error)
      }
    }

    fetchTutorialVideos()
  }, [])

  // Tab data with descriptions
  const [tabs, setDescriptionexplore] = useState([])

  useEffect(() => {
    const fetchDescriptionexplore = async () => {
      try {
        const response = await fetch(`${base_url}/descriptionexplore`) // Replace with your backend URL
        const data = await response.json()
        if (data && data.dataexplore) {
          setDescriptionexplore(data.dataexplore)
        } else {
          setDescriptionexplore([])
        }
      } catch (error) {
        //console.error('Error fetching description explore:', error)
        setDescriptionexplore([])
      }
    }

    fetchDescriptionexplore()
  }, [])

  const backPressed = () => {
    navigation.goBack()
  }

  // const handleSendComment = () => {
  //   if (comment.trim()) {
  //     console.log('Comment:', comment)
  //     setComment('')
  //   }
  // }

  const handleReadMore = () => {
    setIsExpanded(!isExpanded)
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    console.log(isFollowing ? 'Unfollowed' : 'Followed')
  }

  // const handleSave = () => {
  //   setIsSaved(!isSaved)
  //   console.log(isSaved ? 'Removed from saved' : 'Saved to favorites')
  // }
  const handleSave = async () => {
    setLoading(true); // Start loading

    try {
      const accessToken = await AsyncStorage.getItem('accessToken'); // Get the access token
      const response = await fetch(`${base_url}/update-like-status?id=${item_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // Attach the JWT token to the request header
        },
      });

      if (response.ok) {
        const data = await response.json(); // Parse JSON response

        if (!data.error) {
          showToast(isSaved ? 'Product liked' : 'Product unliked', 'success');
          setIsSaved(!isSaved); // Update liked state
        } else {
          showToast(data.message || 'Failed to update like status', 'error');
        }
      } else {
        showToast('Failed to update like status, please try again', 'error');
      }
    } catch (error) {
      console.error('Network or fetch error:', error);
      showToast('Failed to update like status due to a network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMap = () => {
    console.log('Opening Map')
    // Navigate to map screen or open native maps
     navigation.navigate('MapView', { location: subtitle });
  }

  // const handleCall = () => {
  //   console.log('Making call to destination')
  //   Linking.openURL('tel:+1234567890')
  // }

  const handleOpenWebsite = () => {
    console.log('Opening website/blog')
    // Linking.openURL('https://ootytourism.com');
  }

  const handleOpenVideo = (url) => {
    console.log('Opening YouTube video:', url)
    // Linking.openURL(url);
  }

  // Get the description for the active tab
  const getActiveTabDescription = () => {
    const tab = tabs.find(tab => tab.name === activeTab)
    return tab ? tab.description : ''
  }

  const data = [
    { id: 1, name: 'Botanical Gardens', distance: '2.5 km' },
    { id: 2, name: 'Ooty Lake', distance: '3.1 km' },
    { id: 3, name: 'Nilgiri Mountain Railway', distance: '4.2 km' }
    // More nearby places...
  ]

  // Comments functionality removed as it requires WebSocket implementation
  // and is not essential for the shorts feature

  // Removed duplicate fetchDiscoverbyNearest call as it's already handled above

  // Removed unused handleLikePress function

  // Handle video press for full screen
  const handleVideoPress = (item) => {
    setSelectedVideo(item);
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
    setSelectedVideo(null);
  };

  // Render full screen video modal
  const renderFullScreenVideo = () => {
    if (!selectedVideo || !isFullScreen) return null;

    return (
      <View style={shortsStyles.fullScreenContainer}>
        <TouchableOpacity
          style={shortsStyles.closeButton}
          onPress={handleCloseFullScreen}
        >
          <MaterialIcons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Video
          source={{ uri: selectedVideo.video }}
          style={shortsStyles.fullScreenVideo}
          useNativeControls
          resizeMode="contain"
          shouldPlay={true}
          isLooping
        />
        <View style={shortsStyles.fullScreenInfo}>
          <Text style={shortsStyles.fullScreenTitle}>{selectedVideo.videoTitle}</Text>
          <Text style={shortsStyles.fullScreenDescription}>{selectedVideo.description}</Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    const fetchGooglePlaceDetails = async () => {
      if (!params?.place_id) return;
      try {
        const response = await fetch(`${base_url}/place/googlePlaceDetails?place_id=${params.place_id}`);
        const data = await response.json();
        if (data.status) setGooglePlaceDetails(data.data);
      } catch (e) {
        // handle error
      }
    };
    fetchGooglePlaceDetails();
  }, [params?.place_id]);

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.Zypsii_color} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={true}
            overScrollMode="always"
            scrollEventThrottle={16}
          >
            {/* Image Container */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: image1 }} style={styles.detailImage} />
              <BackHeader
                title="Details"
                backPressed={backPressed}
                style={{ position: 'absolute', top: 50, left: 20, right: 20 }}
              />

              {/* Save icon on the image */}
              {/* <TouchableOpacity
                style={titleStyles.saveButton}
                onPress={handleSave}
              >
                {isSaved
                  ? <FontAwesome name="bookmark" size={24} color="#FFFFFF" />
                  : <FontAwesome name="bookmark-o" size={24} color="#FFFFFF" />
                }
              </TouchableOpacity> */}
            </View>

            {/* Detail Container */}
            <View style={styles.detailContainer}>
              {/* Title */}
              <Text style={styles.detailTitle}>{params?.product?.name || cardTitle}</Text>

              {/* Subtitle with map button */}
              <View style={styles.subtitleContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <SimpleLineIcons name="location-pin" size={18} color={colors.fontThirdColor} />
                  <Text style={styles.detailSubtitle}>
                    {((params?.product?.subtitle || subtitle) && (params?.product?.subtitle || subtitle).length > 0)
                      ? (params?.product?.subtitle || subtitle).substring(0, 17) + ((params?.product?.subtitle || subtitle).length > 17 ? '...' : '')
                      : 'No address available'}
                  </Text>
                </View>

                {/* Ratings */}
                <View style={styles.ratingsContainer}>
                  <AntDesign name="star" size={18} color={colors.Zypsii_color} />
                  <Text style={styles.ratingText}>{params.rating || params?.product?.rating || '0.0'}</Text>
                </View>

                {/* Distance */}
                <View style={styles.distanceContainer}>
                  <Ionicons name="location-outline" size={18} color={colors.fontThirdColor} />
                  <Text style={styles.distanceText}>
                    {params.distance || params?.product?.distance ? `${params.distance || params.product.distance} km` : 'N/A'}
                  </Text>
                </View>

                {/* Map button */}
                <TouchableOpacity style={titleStyles.mapButton} onPress={handleOpenMap}>
                  <MaterialIcons name="map" size={18} color={colors.Zypsii_color || '#3498db'} />
                  <Text style={titleStyles.mapButtonText}>Map</Text>
                </TouchableOpacity>
              </View>
              {/* Quick Action Icons */}
             {/*    <View style={actionStyles.actionContainer}>
              <TouchableOpacity style={actionStyles.actionItem} onPress={handleCall}>
                  <View style={actionStyles.actionIconContainer}>
                    <Feather name="phone-call" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={actionStyles.actionText}>Call</Text>
                </TouchableOpacity> */}

                {/* <TouchableOpacity style={actionStyles.actionItem} onPress={handleOpenWebsite}>
                  <View style={actionStyles.actionIconContainer}>
                    <FontAwesome5 name="blog" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={actionStyles.actionText}>Blog</Text>
                </TouchableOpacity> */}

                {/* <TouchableOpacity style={actionStyles.actionItem} onPress={() => navigation.navigate('MakeSchedule')}>
                  <View style={actionStyles.actionIconContainer}>
                    <AntDesign name="calendar" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={actionStyles.actionText}>Schedule</Text>
                </TouchableOpacity>

                <TouchableOpacity style={actionStyles.actionItem} onPress={handleSave}>
                  <View style={actionStyles.actionIconContainer}>
                    <FontAwesome name={isSaved ? 'bookmark' : 'bookmark-o'} size={20} color="#FFFFFF" />
                  </View>
                  <Text style={actionStyles.actionText}>Save</Text>
                </TouchableOpacity>
              </View> */}

              {/* About Destination */}
              {googlePlaceDetails && (
                <View>
                  <Text>{googlePlaceDetails.name}</Text>
                  <Text>{googlePlaceDetails.formatted_address}</Text>
                  <Text>{googlePlaceDetails.rating}</Text>
                  <Text>{googlePlaceDetails.opening_hours?.weekday_text?.join('\n')}</Text>
                  <Text>{googlePlaceDetails.website}</Text>
                  <Text>{googlePlaceDetails.url}</Text>
                  {/* Render reviews, photos, etc. */}
                </View>
              )}

              {/* Horizontal Tab Menu */}
              <View style={tabStyles.tabSection}>
                <Text style={styles.aboutTitle}>Explore</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tabStyles.tabScrollContainer}
                >
                  {tabs && tabs.length > 0 ? (
                    tabs.map((tab) => (
                      <TouchableOpacity
                        key={tab.id}
                        style={[
                          tabStyles.tab,
                          activeTab === tab.name && tabStyles.activeTab
                        ]}
                        onPress={() => setActiveTab(tab.name)}
                      >
                        <Text
                          style={[
                            tabStyles.tabText,
                            activeTab === tab.name && tabStyles.activeTabText
                          ]}
                        >
                          {tab.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={tabStyles.noTabsText}>No explore options available</Text>
                  )}
                </ScrollView>

                {/* Tab Content Description */}
                <View style={tabStyles.tabContent}>
                  <Text style={tabStyles.tabDescription}>
                    {getActiveTabDescription()}
                  </Text>
                </View>
              </View>

              {/* Shorts Section */}
              <View style={styles.discoverRow}>
                <TextDefault style={styles.discoverText}>Shorts from this location</TextDefault>
                <TouchableOpacity onPress={() => navigation.navigate('Shorts', { 
                  userShorts: all_shorts,
                  initialIndex: 0
                })}>
                  <TextDefault style={styles.viewAllText}>View All</TextDefault>
                </TouchableOpacity>
              </View>

              {/* Shorts Grid */}
              {shortsLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={colors.Zypsii_color} />
                </View>
              ) : all_shorts.length > 0 ? (
                <FlatList
                  data={all_shorts}
                  numColumns={3}
                  key="shorts-grid"
                  renderItem={({ item }) => {
                    if (!item) return null;
                    
                    return (
                      <TouchableOpacity 
                        style={shortsStyles.gridItem}
                        onPress={() => handleVideoPress(item)}
                      >
                        {item.videoImage ? (
                          <Image
                            source={{ uri: item.videoImage }}
                            style={shortsStyles.gridImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[shortsStyles.gridImage, shortsStyles.placeholderImage]}>
                            <MaterialIcons name="play-circle" size={40} color="#ccc" />
                          </View>
                        )}
                        
                        <View style={shortsStyles.gridItemOverlay}>
                          <Text style={shortsStyles.gridItemTitle} numberOfLines={1}>
                            {item.videoTitle || 'Untitled'}
                          </Text>
                          <View style={shortsStyles.gridItemStats}>
                            <View style={shortsStyles.statItem}>
                              <MaterialIcons name="favorite" size={14} color="#870E6B" />
                              <Text style={shortsStyles.statText}>{item.likes || '0'}</Text>
                            </View>
                            <View style={shortsStyles.statItem}>
                              <MaterialIcons name="visibility" size={14} color="#870E6B" />
                              <Text style={shortsStyles.statText}>{item.views || '0'}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
                  contentContainerStyle={shortsStyles.gridContainer}
                  ListEmptyComponent={() => (
                    <View style={styles.noDataContainer}>
                      <MaterialIcons name="videocam-off" size={48} color={colors.fontSecondColor} />
                      <Text style={styles.noDataText}>No shorts available for this location</Text>
                    </View>
                  )}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <MaterialIcons name="videocam-off" size={48} color={colors.fontSecondColor} />
                  <Text style={styles.noDataText}>No shorts available for this location</Text>
                </View>
              )}

              <View style={styles.sectionSpacer} />

              {/* Discover Row */}
              <View style={styles.discoverRow}>
                <TextDefault style={styles.discoverText}>Discover by Nearest</TextDefault>
                <TouchableOpacity onPress={() => navigation.navigate('CombinedDestinations', { viewType: 'nearest' })}>
                  <TextDefault style={styles.viewAllText}>View All</TextDefault>
                </TouchableOpacity>
              </View>

              {/* Horizontal Scroll for Cards */}
              {discoverbynearest.length > 0 ? (
                <FlatList
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  data={discoverbynearest}
                  renderItem={({ item }) => (
                    <DiscoverByNearest
                      styles={styles.itemCardContainer}
                      {...item}
                      rating={parseFloat(item.rating) || 0}
                      distance={item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : (item.distance || null)}
                    />
                  )}
                  onEndReached={handleEndReached}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={renderFooter}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <TextDefault style={styles.noDataText}>No nearby places found</TextDefault>
                </View>
              )}

              {/* Comments Section */}
              {/* <View style={styles.commentContainer}>
                <TextDefault style={styles.commentTitle}>Leave a comment</TextDefault>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Say something..."
                    placeholderTextColor={colors.fontThirdColor}
                    value={comment}
                    onChangeText={setComment}
                  />
                  <TouchableOpacity style={styles.sendButton} onPress={handleSendComment}>
                    <TextDefault style={styles.sendButtonText}>Send</TextDefault>
                  </TouchableOpacity>
                </View>
              </View> */}

              {/* Comments section removed - requires WebSocket implementation */}

              <MainBtn 
                text="Make a schedule" 
                onPress={() => navigation.navigate('MakeSchedule', {
                  destinationData: {
                    id: item_id,
                    name: params?.product?.name || cardTitle,
                    image: image1,
                    subtitle: params?.product?.subtitle || subtitle,
                    rating: params?.product?.rating || '0',
                    distance: params?.product?.distance,
                    description: getActiveTabDescription(),
                    tolatitude: tolatitude,
                    tolongitude: tolongitude,
                    nearbyPlaces: discoverbynearest
                  }
                })} 
                style={{ marginTop: 20 }} 
              />
            </View>
          </ScrollView>
        )}
      </View>
      {/* Bottom Navigation */}
      <BottomTab screen="WhereToGo" style={styles.bottomTab} />
      {renderFullScreenVideo()}
    </View>
  )
}

// Comment styles removed as comments functionality is not implemented


// Additional styles for tabs
const tabStyles = {
  tabSection: {
    marginTop: 25,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  tabScrollContainer: {
    paddingVertical: 15,
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginRight: 15,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  activeTab: {
    backgroundColor: colors.Zypsii_color,
    shadowColor: colors.Zypsii_color,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '700',
  },
  tabContent: {
    marginTop: 25,
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  tabDescription: {
    fontSize: 16,
    lineHeight: 26,
    color: '#444',
  },
  noTabsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  }
}

// Additional styles for title and subtitle rows
const titleStyles = {
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  followButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: colors.Zypsii_color,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.Zypsii_color,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  followingButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  followingButtonText: {
    color: '#666666',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.Zypsii_color,
    backgroundColor: 'rgba(52, 152, 219, 0.08)',
    shadowColor: colors.Zypsii_color,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mapButtonText: {
    color: colors.Zypsii_color,
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '700',
  },
  saveButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  }
}

// Styles for action icons
const actionStyles = {
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  actionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.Zypsii_color,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: colors.Zypsii_color,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  }
}

// Styles for YouTube videos
const videoStyles = {
  videoSection: {
    marginTop: 25,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  videoScrollContainer: {
    paddingVertical: 10,
  },
  videoCard: {
    width: 200,
    marginRight: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailContainer: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    position: 'relative',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 10,
    marginBottom: 5,
  }
}

const shortsStyles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1001,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fullScreenVideo: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  fullScreenInfo: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  fullScreenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  fullScreenDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  gridContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  gridItem: {
    flex: 1,
    margin: 3,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  gridItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  gridItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 16,
  },
  gridItemStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default Destination
