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

  const [comment, setComment] = useState('') // Input field state
  const [comments, setComments] = useState([]) // Stores all comments

  // ✅ Fetch Comments from Backend
  // const fetchComments = async() => {
  //   try {
  //     const response = await fetch('http://172.20.10.5:3030/comments')
  //     const data = await response.json()
  //     setComments(data) // Update state
  //   } catch (error) {
  //     console.error('❌ Error fetching comments:', error)
  //   }
  // }

  // ✅ Send Comment to Backend
  // const handleSendComment = async () => {
  //   if (!comment.trim()) return; // Prevent empty comments

  //   try {
  //     console.log('Sending comment:', comment); // Log the comment before sending

  //     const response = await fetch('http://172.20.10.5:3030/comments', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ text: comment }) // Sending the comment as JSON
  //     });

  //     // Log the response status and message
  //     if (!response.ok) {
  //       console.error('Failed to send comment:', response.status, response.statusText);
  //       return;
  //     }

  //     const data = await response.json();
  //     console.log('Comment posted successfully:', data.message);

  //     setComment(''); // Clear comment input field
  //     fetchComments(); // Refresh the list of comments
  //   } catch (error) {
  //     console.error('❌ Error sending comment:', error);
  //   }
  // };
  const handleSendComment = async () => {
    if (!comment.trim()) return // Prevent empty comments

    try {
      const response = await fetch(`${base_url}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: comment })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Comment posted successfully:', data)
        setComment('') // Clear the comment input
        fetchComments() // Refresh the comments list
      } else {
        const errorData = await response.json()
        console.error('Failed to send comment:', errorData)
      }
    } catch (error) {
      console.error('Error sending comment:', error)
    }
  }

  // const fetchComments = async() => {
  //   try {
  //     const response = await fetch('http://172.20.10.5:3030comments')
  //     if (!response.ok) {
  //       console.error('Failed to fetch comments:', response.status, response.statusText)
  //       return
  //     }
  //     const data = await response.json()
  //     console.log('Fetched comments:', data) // Log the fetched comments
  //     setComments(data) // Update state
  //   } catch (error) {
  //     console.error('❌ Error fetching comments:', error)
  //   }
  // }
  // Example function to fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      if (!item_id) {
        console.warn('No item_id available for fetching comments');
        return;
      }

      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${base_url}/comments/${item_id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setComments(data?.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Call the fetch function when the component mounts or whenever needed
  useEffect(() => {
    fetchComments()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!item_id) {
          console.warn('No item_id available for fetching data');
          setLoading(false);
          return;
        }

        const accessToken = await AsyncStorage.getItem('accessToken');
        const response = await fetch(`${base_url}/discover_by_nearest`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDiscoverbyNearest(data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [item_id]);

  const handleLikePress = async () => {
    try {
      if (!item_id) {
        console.warn('No item_id available for like/unlike action');
        return;
      }

      setLikeLoading(true);
      const endpoint = isLiked ? 'unlike' : 'like';
      const response = await fetch(`${baseUrl}/${endpoint}/${item_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setIsLiked(!isLiked);
        setLikesCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
        showToast(isLiked ? 'Post unliked' : 'Post liked', 'success');
      }
    } catch (error) {
      console.error('Error handling like/unlike:', error);
      showToast('Failed to update like status. Please try again', 'error');
    } finally {
      setLikeLoading(false);
    }
  };

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
              {/* <View style={styles.aboutContainer}>
                <Text style={styles.aboutTitle}>{destinationData?.title}</Text>
                <Text style={styles.aboutText}>
                  {destinationData?.shortDescription}{' '}
                  <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                    <Text style={styles.readMore}>{isExpanded ? 'Read Less' : 'Read More'}</Text>
                  </TouchableOpacity>
                </Text>
                {isExpanded && <Text style={styles.expandedText}>{destinationData?.fullDescription}</Text>}
              </View> */}

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

              <View style={stylescomment.commentSection}>
                {comments.map((comment) => (
                  <View key={comment._id} style={stylescomment.commentCard}>
                    <View style={stylescomment.commentHeader}>
                      <FontAwesome name="user-circle" size={20} color="#555" />
                      <TextDefault style={stylescomment.commentUser}>{comment.username || "User"}</TextDefault>
                    </View>
                    <TextDefault style={stylescomment.commentText}>{comment.text}</TextDefault>
                  </View>
                ))}
              </View>

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
    </View>
  )
}

const stylescomment = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  itemCardContainer: {
    marginRight: 15,
  },
  discoverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  discoverText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: colors.Zypsii_color,
    fontWeight: '600',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
  commentSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  commentCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: colors.Zypsii_color,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentUser: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  commentText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
});


// Additional styles for tabs
const tabStyles = {
  tabSection: {
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
  tabScrollContainer: {
    paddingVertical: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  activeTab: {
    backgroundColor: colors.Zypsii_color,
    shadowColor: colors.Zypsii_color,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  tabContent: {
    marginTop: 20,
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  tabDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: '#444',
  },
  noTabsText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    padding: 15,
  }
}

// Additional styles for title and subtitle rows
const titleStyles = {
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 15,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    backgroundColor: colors.Zypsii_color,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.Zypsii_color,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  followingButton: {
    backgroundColor: '#E8E8E8',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
    color: '#666666',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.Zypsii_color,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  mapButtonText: {
    color: colors.Zypsii_color,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  saveButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
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

export default Destination
