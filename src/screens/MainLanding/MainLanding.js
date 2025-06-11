import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  Alert, 
  ScrollView, 
  ImageBackground, 
  TouchableOpacity, 
  NativeModules,
  Image,
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  Dimensions
} from 'react-native';
import SwiperFlatList from 'react-native-swiper-flatlist';
import styles from './styles';
import CategoryCard from '../../ui/CategoryCard/CategoryCard';
import { BottomTab, TextDefault, TextError, Spinner, Hexagon } from '../../components';
import { verticalScale, scale, colors, alignment } from '../../utils';
import ProductCard from '../../ui/ProductCard/ProductCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSchedule } from '../../context/ScheduleContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Stories from '../../components/Stories/Stories';
import Post from '../../components/Posts/Post';
import DiscoverByNearest from '../../components/DiscoverByNearest/DiscoverByNearest';
import SkeletonLoader from '../../components/Loader/SkeletonLoader';
import { useFocusEffect } from '@react-navigation/native';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStatusBar } from '../../utils/useStatusBar';
import ChatSupport from '../../components/ChatSupport/ChatSupport';
import FloatingSupportButton from '../../components/FloatingChatButton/FloatingChatButton';
import AllSchedule from '../MySchedule/Schedule/AllSchedule';
import RecommendCard from '../../components/Recommendation/RecommendCard';
import FollowButton from '../../components/Follow/FollowButton';

const { height, width } = Dimensions.get('window');

function MainLanding(props) { 
  const navigation = useNavigation();
  const { scheduleData } = useSchedule();
  const [selectedButton, setSelectedButton] = useState('All');
  const buttons = ['All', 'Posts', 'Shorts', 'Schedule'];
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Loading states
  const [isDiscoverByInterestLoading, setIsDiscoverByInterestLoading] = useState(true);
  const [isBestDestinationLoading, setIsBestDestinationLoading] = useState(true);
  const [isAllDestinationLoading, setIsAllDestinationLoading] = useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = useState(true);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [isShortsLoading, setIsShortsLoading] = useState(true);
  const [isNearestLoading, setIsNearestLoading] = useState(true);
  const [isStoriesLoading, setIsStoriesLoading] = useState(true);

  // Data states
  const [discover_by_intrest, setDiscover_by_intrest] = useState([]);
  const [best_destination, setBest_destination] = useState([]);
  const [all_destination, setAll_destination] = useState([]);
  const [all_schedule, setAll_schedule] = useState([]);
  const [all_posts, setAllPosts] = useState([]);
  const [all_shorts, setAllShorts] = useState([]);
  const [discoverbynearest, setDiscoverbyNearest] = useState([]);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [shortsPagination, setShortsPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    totalPages: 0
  });
  // Add pagination states for discover by interest and nearest
  const [discoverByInterestPagination, setDiscoverByInterestPagination] = useState({
    nextPageToken: null,
    hasMore: true
  });
  const [discoverByNearestPagination, setDiscoverByNearestPagination] = useState({
    nextPageToken: null,
    hasMore: true
  });
  // Add pagination states for all destination and best destination
  const [allDestinationPagination, setAllDestinationPagination] = useState({
    nextPageToken: null,
    hasMore: true
  });
  const [bestDestinationPagination, setBestDestinationPagination] = useState({
    nextPageToken: null,
    hasMore: true
  });

  // Add state for tracking new loading items
  const [loadingNewItems, setLoadingNewItems] = useState(false);

  // Add state for tracking new loading items for best destination
  const [loadingNewBestItems, setLoadingNewBestItems] = useState(false);

  // Add state for user location
  const [userLocation, setUserLocation] = useState({
    latitude: 13.0843,
    longitude: 80.2705
  });

  // Add function to update live location
  const updateLiveLocation = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) return;

      // Use the location from user data if available, otherwise use default
      const latitude = user?.location?.latitude || userLocation.latitude;
      const longitude = user?.location?.longitude || userLocation.longitude;
     console.log(accessToken)
      const response = await fetch(`${base_url}/user/update-live-location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: latitude,
          longitude: longitude
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update live location');
      }

      const data = await response.json();
      console.log('Live location updated successfully:', data);
    } catch (error) {
      console.error('Error updating live location:', error);
    }
  };

  // Add useEffect to call updateLiveLocation when component mounts
  useEffect(() => {
    updateLiveLocation();
  }, []);

  // Add useEffect for initial data fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Back handler
  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit?",
          [
            {
              text: "Cancel",
              onPress: () => null,
              style: "cancel"
            },
            { text: "YES", onPress: () => BackHandler.exitApp() }
          ]
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [])
  );

  // Add useEffect to fetch unread messages
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) return;

        const response = await fetch(`${base_url}/api/messages/unread`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadMessages(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadMessages();
  }, []);

  // Add load more functions for all destination and best destination
  const loadMoreAllDestination = async () => {
    if (!allDestinationPagination.hasMore || isAllDestinationLoading) return;

    try {
      setIsAllDestinationLoading(true);
      setLoadingNewItems(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      const url = `${base_url}/schedule/places/getNearest?nextPageToken=${allDestinationPagination.nextPageToken}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      
      if (Array.isArray(data?.data)) {
        const newData = data.data.map(item => ({
          id: item._id || item.name,
          image: item.image,
          name: item.name,
          rating: parseFloat(item.rating) || 0,
          distanceInKilometer: item.distanceInKilometer
        }));
        
        // Add new data at the beginning of the list
        setAll_destination(prev => [...newData, ...prev]);
        
        // Update pagination state
        setAllDestinationPagination({
          nextPageToken: data.nextPageToken || null,
          hasMore: !!data.nextPageToken
        });

        // Scroll to the beginning of the list to show new data
        if (this.allDestinationListRef) {
          this.allDestinationListRef.scrollToOffset({ offset: 0, animated: true });
        }
      }
    } catch (error) {
      console.error('Error loading more all destinations:', error);
    } finally {
      // Add a small delay before hiding the loader to ensure smooth transition
      setTimeout(() => {
        setIsAllDestinationLoading(false);
        setLoadingNewItems(false);
      }, 500);
    }
  };

  const loadMoreBestDestination = async () => {
    if (!bestDestinationPagination.hasMore || isBestDestinationLoading) return;

    try {
      setIsBestDestinationLoading(true);
      setLoadingNewBestItems(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      const url = `${base_url}/schedule/places/getNearest?bestDestination=true&nextPageToken=${bestDestinationPagination.nextPageToken}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      
      if (Array.isArray(data?.data)) {
        const newData = data.data.map(item => ({
          id: item._id || item.name,
          image: item.image,
          name: item.name,
          rating: parseFloat(item.rating) || 0,
          distanceInKilometer: item.distanceInKilometer
        }));
        
        // Add new data at the beginning of the list
        setBest_destination(prev => [...newData, ...prev]);
        
        // Update pagination state
        setBestDestinationPagination({
          nextPageToken: data.nextPageToken || null,
          hasMore: !!data.nextPageToken
        });

        // Scroll to the beginning of the list to show new data
        if (this.bestDestinationListRef) {
          this.bestDestinationListRef.scrollToOffset({ offset: 0, animated: true });
        }
      }
    } catch (error) {
      console.error('Error loading more best destinations:', error);
    } finally {
      // Add a small delay before hiding the loader to ensure smooth transition
      setTimeout(() => {
        setIsBestDestinationLoading(false);
        setLoadingNewBestItems(false);
      }, 500);
    }
  };

  // Modify the fetchAllData function to handle pagination
  const fetchAllData = async () => {
    try {
      // Set all loading states to true
      setIsDiscoverByInterestLoading(true);
      setIsBestDestinationLoading(true);
      setIsAllDestinationLoading(true);
      setIsScheduleLoading(true);
      setIsPostsLoading(true);
      setIsShortsLoading(true);
      setIsNearestLoading(true);

      // Get access token once for all authenticated requests
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // Create a timeout promise
      const timeoutPromise = (ms) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), ms)
      );

      // Make all API requests in parallel with timeout
      const [
        discoverByInterestResponse,
        bestDestinationResponse,
        allDestinationResponse,
        allScheduleResponse,
        allPostsResponse,
        discoverByNearestResponse
      ] = await Promise.all([
        Promise.race([
          fetch(`${base_url}/schedule/places/getNearest?type=interest`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }),
          timeoutPromise(10000)
        ]),
        Promise.race([
          fetch(`${base_url}/schedule/places/getNearest?bestDestination=true`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }),
          timeoutPromise(10000)
        ]),
        Promise.race([
          fetch(`${base_url}/schedule/places/getNearest`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }),
          timeoutPromise(10000)
        ]),
        Promise.race([
          fetch(`${base_url}/schedule/listing/filter`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }),
          timeoutPromise(10000)
        ]),
        Promise.race([
          fetch(`${base_url}/post/listing/filter`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }),
          timeoutPromise(10000)
        ]),
        Promise.race([
          fetch(`${base_url}/schedule/places/getNearest?type=nearest`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }),
          timeoutPromise(10000)
        ])
      ]);

      // Process all responses
      const [
        discoverByInterestData,
        bestDestinationData,
        allDestinationData,
        allScheduleData,
        allPostsData,
        discoverByNearestData
      ] = await Promise.all([
        discoverByInterestResponse.json(),
        bestDestinationResponse.json(),
        allDestinationResponse.json(),
        allScheduleResponse.json(),
        allPostsResponse.json(),
        discoverByNearestResponse.json()
      ]);

      // Set data for each response with proper empty state handling
      if (Array.isArray(discoverByInterestData?.data)) {
        setDiscover_by_intrest(discoverByInterestData.data.map(item => ({
          id: item._id || item.name,
          image: item.image,
          name: item.name
        })));
        setDiscoverByInterestPagination({
          nextPageToken: discoverByInterestData.nextPageToken || null,
          hasMore: !!discoverByInterestData.nextPageToken
        });
      } else {
        setDiscover_by_intrest([]);
      }

      if (Array.isArray(bestDestinationData?.data)) {
        setBest_destination(bestDestinationData.data.slice(0, 100).map(item => ({
          id: item._id || item.name,
          image: item.image,
          name: item.name,
          rating: item.rating,
          distanceInKilometer: item.distanceInKilometer
        })));
        setBestDestinationPagination({
          nextPageToken: bestDestinationData.nextPageToken || null,
          hasMore: !!bestDestinationData.nextPageToken
        });
      }

      if (Array.isArray(allDestinationData?.data)) {
        setAll_destination(allDestinationData.data.slice(0, 100).map(item => ({
          id: item._id || item.name,
          image: item.image,
          name: item.name,
          rating: item.rating,
          distanceInKilometer: item.distanceInKilometer
        })));
        setAllDestinationPagination({
          nextPageToken: allDestinationData.nextPageToken || null,
          hasMore: !!allDestinationData.nextPageToken
        });
      }

      if (Array.isArray(allScheduleData?.data)) {
        setAll_schedule(allScheduleData.data.map(item => ({
          id: item._id,
          title: item.tripName,
          from: (item.locationDetails?.[0]?.address 
            ? item.locationDetails[0].address.slice(0, 5) + '...'
            : 'Unknown'),
          to: (item.locationDetails?.[1]?.address 
          ? item.locationDetails[1].address.slice(0, 5) + '...'
          : 'Unknown'),
          date: new Date(item.Dates.from).toLocaleDateString(),
          endDate: new Date(item.Dates.end).toLocaleDateString(),
          travelMode: item.travelMode,
          visible: item.visible,
          numberOfDays: item.numberOfDays.toString(),
          imageUrl: item.bannerImage,
          locationDetails: item.locationDetails,
          createdAt: new Date(item.createdAt).toLocaleDateString(),
          riders: '0 riders',
          joined: false,
          rawLocation: {
            from: {
              latitude: item.location.from.latitude,
              longitude: item.location.from.longitude
            },
            to: {
              latitude: item.location.to.latitude,
              longitude: item.location.to.longitude
            }
          }
        })));
      } else {
        setAll_schedule([]);
      }

      if (Array.isArray(allPostsData?.data)) {
        setAllPosts(allPostsData.data.map(item => {
          // Process mediaUrl array
          let mediaUrls = item.mediaUrl;
          
          // Handle string URLs
          if (typeof mediaUrls === 'string') {
            try {
              // Try to parse if it's a JSON string
              if (mediaUrls.startsWith('[')) {
                mediaUrls = JSON.parse(mediaUrls);
              } else {
                // Single URL string
                mediaUrls = [mediaUrls];
              }
            } catch (e) {
              console.log('Error parsing mediaUrl:', e);
              mediaUrls = [mediaUrls];
            }
          }

          // Ensure mediaUrls is always an array
          if (!Array.isArray(mediaUrls)) {
            mediaUrls = [mediaUrls];
          }

          // Filter out null or undefined URLs
          mediaUrls = mediaUrls.filter(url => url != null);

          // Clean up URLs if needed
          mediaUrls = mediaUrls.map(url => {
            if (typeof url === 'string') {
              return url.replace(/\\/g, '').replace(/"/g, '');
            }
            return url;
          });

          return {
            _id: item._id,
            postTitle: item.postTitle,
            postType: item.postType,
            mediaType: item.mediaType,
            mediaUrl: mediaUrls,
            imageUrl: mediaUrls,
            createdBy: item.createdBy,
            tags: Array.isArray(item.tags) ? item.tags : [],
            likesCount: item.likesCount || 0,
            commentsCount: item.commentsCount || 0,
            shareCount: item.shareCount || 0,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          };
        }));
      } else {
        setAllPosts([]);
      }

      if (Array.isArray(discoverByNearestData?.data)) {
        const formattedData = discoverByNearestData.data.slice(0, 100).map(item => ({
          id: item._id || item.image,
          image: item.image,
          title: item.name,
          subtitle: item.address || 'No address',
          rating: parseFloat(item.rating) || 0,
          distance: item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : null
        }));
        setDiscoverbyNearest(formattedData);
        setDiscoverByNearestPagination({
          nextPageToken: discoverByNearestData.nextPageToken || null,
          hasMore: !!discoverByNearestData.nextPageToken
        });
      } else {
        setDiscoverbyNearest([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error
      setDiscover_by_intrest([]);
      setBest_destination([]);
      setAll_destination([]);
      setAll_schedule([]);
      setAllPosts([]);
      setDiscoverbyNearest([]);
      
      // Log specific error details
      if (error.message === 'Request timeout') {
        console.error('One or more API requests timed out');
      } else if (error.message === 'No access token found') {
        console.error('Authentication error: No access token found');
      } else {
        console.error('Network or server error:', error);
      }
    } finally {
      // Set all loading states to false after all data is processed
      setIsDiscoverByInterestLoading(false);
      setIsBestDestinationLoading(false);
      setIsAllDestinationLoading(false);
      setIsScheduleLoading(false);
      setIsPostsLoading(false);
      setIsShortsLoading(false);
      setIsNearestLoading(false);
    }
  };

  // Modify loadMoreDiscoverByInterest function
  const loadMoreDiscoverByInterest = async () => {
    if (!discoverByInterestPagination.hasMore || isDiscoverByInterestLoading) return;

    try {
      setIsDiscoverByInterestLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      const url = `${base_url}/schedule/places/getNearest?type=interest&nextPageToken=${discoverByInterestPagination.nextPageToken}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      
      if (Array.isArray(data?.data)) {
        const newData = data.data.map(item => ({
          id: item._id || item.name,
          image: item.image,
          name: item.name
        }));
        
        // Add new data at the beginning of the list
        setDiscover_by_intrest(prev => [...newData, ...prev]);
        
        // Update pagination state
        setDiscoverByInterestPagination({
          nextPageToken: data.nextPageToken || null,
          hasMore: !!data.nextPageToken
        });

        // Scroll to the beginning of the list to show new data
        if (this.interestListRef) {
          this.interestListRef.scrollToOffset({ offset: 0, animated: true });
        }
      }
    } catch (error) {
      console.error('Error loading more discover by interest:', error);
    } finally {
      setIsDiscoverByInterestLoading(false);
    }
  };

  // Modify loadMoreDiscoverByNearest function
  const loadMoreDiscoverByNearest = async () => {
    if (!discoverByNearestPagination.hasMore || isNearestLoading) return;

    try {
      setIsNearestLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      const url = `${base_url}/schedule/places/getNearest?type=nearest&nextPageToken=${discoverByNearestPagination.nextPageToken}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      
      if (Array.isArray(data?.data)) {
        const newData = data.data.map(item => ({
          id: item._id || item.image,
          image: item.image,
          title: item.name,
          subtitle: item.address || 'No address',
          rating: parseFloat(item.rating) || 0,
          distance: item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : null
        }));
        
        // Add new data at the beginning of the list
        setDiscoverbyNearest(prev => [...newData, ...prev]);
        
        // Update pagination state
        setDiscoverByNearestPagination({
          nextPageToken: data.nextPageToken || null,
          hasMore: !!data.nextPageToken
        });

        // Scroll to the beginning of the list to show new data
        if (this.nearestListRef) {
          this.nearestListRef.scrollToOffset({ offset: 0, animated: true });
        }
      }
    } catch (error) {
      console.error('Error loading more discover by nearest:', error);
    } finally {
      setIsNearestLoading(false);
    }
  };

  const fetchShorts = async () => {
    try {
      setIsShortsLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      // Fetch shorts
      const shortsResponse = await fetch(`${base_url}/shorts/listing`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!shortsResponse.ok) {
        throw new Error(`API request failed with status ${shortsResponse.status}`);
      }

      const shortsData = await shortsResponse.json();
      
      if (shortsData.status && Array.isArray(shortsData.data)) {
        const shortsList = shortsData.data.map(short => ({
          id: short._id,
          type: 'short',
          title: short.title,
          description: short.description,
          videoUrl: short.videoUrl,
          thumbnailUrl: short.thumbnailUrl,
          createdBy: short.createdBy,
          viewsCount: short.viewsCount || 0,
          likesCount: short.likesCount || 0,
          commentsCount: short.commentsCount || 0,
          createdAt: short.createdAt,
          updatedAt: short.updatedAt
        }));
        
        // Filter only mp4 videos
        const mp4ShortsList = shortsList.filter(
          item => typeof item.videoUrl === 'string' && item.videoUrl.toLowerCase().endsWith('.mp4')
        );
        setAllShorts(mp4ShortsList);
        setShortsPagination(shortsData.pagination || {});
      } else {
        setAllShorts([]);
      }
    } catch (error) {
      console.error('Error fetching shorts:', error);
      setAllShorts([]);
    } finally {
      setIsShortsLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []); // Empty dependency array means it runs once on mount

  // Add a debug effect to monitor all_shorts state
  useEffect(() => {
  }, [all_shorts]);

  // Loader components
  const HorizontalListLoader = ({ count = 8 }) => (
    <View style={{ paddingVertical: 10 }}>
      <SkeletonLoader 
        count={count} 
        circleSize={80}
        textWidth={60}
        textHeight={12}
        containerStyle={{ paddingHorizontal: 8 }}
      />
    </View>
  );

  const VerticalListLoader = ({ count = 5 }) => (
    <View style={{ padding: 10 }}>
      {Array(count).fill(0).map((_, index) => (
        <View key={index} style={{ marginBottom: 20 }}>
          <SkeletonLoader 
            count={1} 
            circleSize={40}
            textWidth={'100%'}
            textHeight={100}
            containerStyle={{ paddingHorizontal: 0, alignItems: 'flex-start' }}
            circleStyle={{ marginBottom: 10 }}
            textStyle={{ borderRadius: 8, height: 150 }}
          />
        </View>
      ))}
    </View>
  );

  // Render functions
  const renderVideoShorts = () => {
    const isValidVideoUrl = (url) => {
      if (!url) return false;
      const videoExtensions = ['.mp4', '.mov', '.webm', '.m4v'];
      const isSupportedFormat = videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
      const isHttpUrl = url.startsWith('http');
      const isHttpsUrl = url.startsWith('https');
      
      return (isSupportedFormat || isHttpUrl || isHttpsUrl) && !url.toLowerCase().endsWith('.3gp');
    };

    const getVideoSource = (videoUrl) => {
      if (!videoUrl) return null;
      if (videoUrl.toLowerCase().endsWith('.3gp')) return null;
      
      if (videoUrl.startsWith('http') || videoUrl.startsWith('https')) {
        return { uri: videoUrl };
      } else if (videoUrl.startsWith('file://')) {
        return { uri: videoUrl };
      } else if (videoUrl.startsWith('data:')) {
        return { uri: videoUrl };
      }
      return null;
    };

    if (isShortsLoading) {
      return (
        <View style={styles.titleSpacer}>
          <View style={styles.sectionHeader}>
            <TextDefault textColor={colors.fontMainColor} H4 bold>
              {'Shorts'}
            </TextDefault>
            <TouchableOpacity onPress={() => navigation.navigate('AllShorts')}>
              <TextDefault textColor={colors.btncolor} H5>
                {'View All'}
              </TextDefault>
            </TouchableOpacity>
          </View>
          <VerticalListLoader count={3} />
        </View>
      );
    }

    if (!all_shorts || all_shorts.length === 0) {
      return (
        <View style={styles.titleSpacer}>
          <View style={styles.sectionHeader}>
            <TextDefault textColor={colors.fontMainColor} H4 bold>
              {'Shorts'}
            </TextDefault>
          </View>
          <View style={styles.emptyContainer}>
            <Icon name="videocam-outline" size={48} color={colors.fontSecondColor} />
            <TextDefault textColor={colors.fontMainColor} H5 style={{ marginTop: 10 }}>
              No shorts available
            </TextDefault>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.shortsListContainer, { height: 500 }]}>
        <SwiperFlatList
          data={all_shorts}
          keyExtractor={(item) => item.id}
          vertical
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={500}
          decelerationRate="fast"
          onChangeIndex={({ index }) => {
            // Stop all videos when swiping
            const stopVideoScript = `
              var videos = document.getElementsByTagName('video');
              for(var i = 0; i < videos.length; i++) {
                videos[i].pause();
                videos[i].currentTime = 0;
              }
            `;
            if (this.webview) {
              this.webview.injectJavaScript(stopVideoScript);
            }
          }}
          renderItem={({ item }) => {
            const videoSource = getVideoSource(item.videoUrl);
            const isValidVideo = isValidVideoUrl(item.videoUrl);
            
            return (
              <View style={[styles.shortItemContainer, { height: 500 }]}>
                <View style={styles.videoContainer}>
                  {isValidVideo && videoSource ? (
                    <View style={styles.videoWrapper}>
                      <WebView
                        source={videoSource}
                        style={[styles.videoPlayer, { height: 500 }]}
                        allowsFullscreenVideo={true}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        mediaPlaybackRequiresUserAction={false}
                        allowsInlineMediaPlayback={true}
                        onLoad={() => {
                          // Auto-play the video when loaded
                          const autoPlayScript = `
                            var video = document.getElementsByTagName('video')[0];
                            if (video) {
                              video.play();
                              video.controls = false;
                              video.style.width = '100%';
                              video.style.height = '100%';
                              video.style.objectFit = 'cover';
                              video.loop = true;
                            }
                          `;
                          this.webview.injectJavaScript(autoPlayScript);
                        }}
                        ref={(ref) => (this.webview = ref)}
                        onError={(syntheticEvent) => {
                          const { nativeEvent } = syntheticEvent;
                          console.warn('WebView error: ', nativeEvent);
                        }}
                        renderLoading={() => (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.btncolor} />
                          </View>
                        )}
                      />
                    </View>
                  ) : (
                    <View style={styles.errorContainer}>
                      <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={[styles.thumbnailImage, { height: height }]}
                        resizeMode="cover"
                      />
                      <View style={styles.errorMessageContainer}>
                        <TextDefault textColor={colors.white} H6>
                          {!item.videoUrl ? 'No video available' : 'Unsupported video format'}
                        </TextDefault>
                      </View>
                    </View>
                  )}
                </View>

                {/* Right side interaction buttons */}
                <View style={styles.interactionButtonsContainer}>
                  <TouchableOpacity style={styles.interactionButton}>
                    <Icon name="heart-outline" size={28} color={colors.white} />
                    <TextDefault textColor={colors.white} H6 style={styles.interactionCount}>
                      {item.likesCount}
                    </TextDefault>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.interactionButton}>
                    <Icon name="chatbubble-outline" size={28} color={colors.white} />
                    <TextDefault textColor={colors.white} H6 style={styles.interactionCount}>
                      {item.commentsCount}
                    </TextDefault>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.interactionButton}>
                    <Icon name="share-social-outline" size={28} color={colors.white} />
                    <TextDefault textColor={colors.white} H6 style={styles.interactionCount}>
                      {item.shareCount || 0}
                    </TextDefault>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.interactionButton}>
                    <Icon name="bookmark-outline" size={28} color={colors.white} />
                  </TouchableOpacity>
                </View>

                {/* Video info overlay */}
                <View style={styles.videoInfoOverlay}>
                  <View style={styles.userInfoContainer}>
                    <View style={styles.userInfo}>
                      <TextDefault textColor={colors.white} H5 bold numberOfLines={2} style={styles.videoTitle}>
                        {item.title}
                      </TextDefault>
                      <TextDefault textColor={colors.white} H6 numberOfLines={2} style={styles.videoDescription}>
                        {item.description}
                      </TextDefault>
                    </View>
                    <View style={styles.followButtonContainer}>
                      <FollowButton userId={item.createdBy} />
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    );
  };

  const renderScheduleContainer = () => {
    if (!all_schedule || all_schedule.length === 0) {
      return (
        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleheadContainer}>
            <TextDefault textColor={colors.fontMainColor} H5 bold>
              {'Schedule'}
            </TextDefault>
            <TouchableOpacity onPress={() => navigation.navigate('MySchedule')}>
              <TextDefault textColor={colors.btncolor} H5>
                {'View All'}
              </TextDefault>
            </TouchableOpacity>
          </View>
          <TextDefault style={{ marginLeft: 20, color: colors.fontSecondColor }}>
            No schedule available
          </TextDefault>
        </View>
      );
    }
  
    return (
      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleheadContainer}>
          <TextDefault textColor={colors.fontMainColor} H5 bold>
            {'Schedule'}
          </TextDefault>
          <TouchableOpacity onPress={() => navigation.navigate('MySchedule')}>
            <TextDefault textColor={colors.btncolor} H5>
              {'View All'}
            </TextDefault>
          </TouchableOpacity>
        </View>
  
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          data={all_schedule}
          renderItem={({ item }) => (
            <View style={{ marginRight: 0 }}>
              <AllSchedule item={item} />
            </View>
          )}
        />
      </View>
    );
  };

  const renderVerticalScheduleList = () => {
    if (!all_schedule || all_schedule.length === 0) {
      return (
        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleheadContainer}>
            <TextDefault textColor={colors.fontMainColor} H5 bold>
              {'Schedule'}
            </TextDefault>
            <TouchableOpacity onPress={() => navigation.navigate('MySchedule')}>
              <TextDefault textColor={colors.btncolor} H5>
                {'View All'}
              </TextDefault>
            </TouchableOpacity>
          </View>
          <TextDefault style={{ marginLeft: 20, color: colors.fontSecondColor }}>
            No schedule available
          </TextDefault>
        </View>
      );
    }
  
    return (
      <View style={styles.scheduleContainer}>
        <View style={styles.scheduleheadContainer}>
          <TextDefault textColor={colors.fontMainColor} H5 bold>
            {'Schedule'}
          </TextDefault>
          <TouchableOpacity onPress={() => navigation.navigate('MySchedule')}>
            <TextDefault textColor={colors.btncolor} H5>
              {'View All'}
            </TextDefault>
          </TouchableOpacity>
        </View>
  
        <FlatList
          vertical
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          data={all_schedule}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={{ marginBottom: -20 }}>
              <AllSchedule item={item} />
            </View>
          )}
        />
      </View>
    );
  };


  const renderDiscoverByNearest = () => (
    <View style={styles.titleSpaceredge}>
      <TextDefault textColor={colors.fontMainColor} H5 bold style={styles.titleSpacernearest}>
        {'Discover by Nearest'}
      </TextDefault>
      <View style={styles.seeAllTextContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('DiscoverPlace')}>
          <TextDefault textColor={colors.greenColor} H5 style={styles.seeAllText}>View All</TextDefault>
        </TouchableOpacity>
      </View>

      {isNearestLoading && discoverbynearest.length === 0 ? (
        <HorizontalListLoader count={8} />
      ) : (
        <FlatList
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.id}
          data={discoverbynearest}
          renderItem={({ item, index }) => (
            <DiscoverByNearest 
              styles={styles.itemCardContainer} 
              {...item}
              rating={item.rating}
            />
          )}
          onEndReached={loadMoreDiscoverByNearest}
          onEndReachedThreshold={0.2}
          ListFooterComponent={() => (
            isNearestLoading ? (
              <View style={{ padding: 10 }}>
                <ActivityIndicator size="small" color={colors.btncolor} />
              </View>
            ) : null
          )}
          ref={(ref) => (this.nearestListRef = ref)}
        />
      )}
    </View>
  );

  const renderBestDestination = () => (
    <View style={styles.titleSpacerdesti}>
      <TextDefault textColor={colors.fontMainColor} H5 bold style={styles.titleSpacer}>
        {'Best Destination'}
      </TextDefault>
      <View style={styles.seeAllTextContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('WhereToGo')}>
          <TextDefault textColor={colors.greenColor} H5 style={styles.seeAllText}>View All</TextDefault>
        </TouchableOpacity>
      </View>

      {isBestDestinationLoading && best_destination.length === 0 ? (
        renderInitialLoading()
      ) : (
        <View>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item.id}
            data={best_destination}
            renderItem={({ item, index }) => (
              <ProductCard 
                styles={styles.itemCardContainer} 
                {...item}
                rating={parseInt(item.rating) || 0}
                distance={item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : null}
              />
            )}
            onEndReached={loadMoreBestDestination}
            onEndReachedThreshold={0.2}
            ref={(ref) => (this.bestDestinationListRef = ref)}
            ListHeaderComponent={() => (
              loadingNewBestItems ? (
                <View style={{ flexDirection: 'row', marginRight: 10 }}>
                  {[1, 2, 3, 4].map((_, index) => (
                    <View key={index} style={{ marginRight: 10 }}>
                      <CardSkeletonLoader />
                    </View>
                  ))}
                </View>
              ) : null
            )}
          />
        </View>
      )}
    </View>
  );

  // Add a custom skeleton loader component
  const CardSkeletonLoader = () => (
    <View style={{ width: 160, height: 200, backgroundColor: '#f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
      {/* Image placeholder */}
      <View style={{ width: '100%', height: 120, backgroundColor: '#e0e0e0' }} />
      {/* Title placeholder */}
      <View style={{ padding: 8 }}>
        <View style={{ width: '80%', height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
        {/* Rating and distance placeholders */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '40%', height: 12, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
          <View style={{ width: '40%', height: 12, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
        </View>
      </View>
    </View>
  );

  // Modify the initial loading state to use the new skeleton loader
  const renderInitialLoading = () => (
    <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
        <View key={index} style={{ marginRight: 10 }}>
          <CardSkeletonLoader />
        </View>
      ))}
    </View>
  );

  const renderAllDestination = () => (
    <View style={styles.titleSpacerdesti}>
      <TextDefault textColor={colors.fontMainColor} H5 bold style={styles.titleSpacer}>
        {'All Destination'}
      </TextDefault>
      <View style={styles.seeAllTextContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('WhereToGo')}>
          <TextDefault textColor={colors.greenColor} H5 style={styles.seeAllText}>View All</TextDefault>
        </TouchableOpacity>
      </View>

      {isAllDestinationLoading && all_destination.length === 0 ? (
        renderInitialLoading()
      ) : (
        <View>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={all_destination}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProductCard 
                styles={styles.itemCardContainer} 
                {...item}
                rating={parseFloat(item.rating) || 0}
                distance={item.distanceInKilometer ? parseFloat(item.distanceInKilometer).toFixed(1) : null}
              />
            )}
            onEndReached={loadMoreAllDestination}
            onEndReachedThreshold={0.2}
            ref={(ref) => (this.allDestinationListRef = ref)}
            ListHeaderComponent={() => (
              loadingNewItems ? (
                <View style={{ flexDirection: 'row', marginRight: 10 }}>
                  {[1, 2, 3, 4].map((_, index) => (
                    <View key={index} style={{ marginRight: 10 }}>
                      <CardSkeletonLoader />
                    </View>
                  ))}
                </View>
              ) : null
            )}
          />
        </View>
      )}
    </View>
  );

  const renderItem = ({ item }) => {
    return (
      <Post item={item} />
    );
  };

  const renderPosts = () => (
    <View>
      <TextDefault textColor={colors.fontMainColor} style={styles.titleSpacer}H4>
        {'Posts'}
      </TextDefault>
      {isPostsLoading ? (
        <VerticalListLoader count={5} />
      ) : (
        <FlatList
          data={all_posts}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}
        />
      )}
    </View>
  );

  const renderContent = () => {
    switch (selectedButton) {
      case 'Shorts':
        return isShortsLoading ? (
          <VerticalListLoader count={3} />
        ) : (
          renderVideoShorts()
        );
      case 'Schedule':
        return isScheduleLoading ? (
          <VerticalListLoader count={5} />
        ) : (
          renderVerticalScheduleList()
        );
      case 'Posts':
        return isPostsLoading ? (
          <VerticalListLoader count={5} />
        ) : (
          renderPosts()
        );
      case 'All':
      default:
        return (
          <>
            {isScheduleLoading ? (
              <HorizontalListLoader count={5} />
            ) : (
              renderScheduleContainer()
            )}
            {/* {isDiscoverByInterestLoading ? (
              <HorizontalListLoader count={8} />
            ) : (
              renderDiscoverByInterest()
            )} */}
            {isNearestLoading ? (
              <HorizontalListLoader count={8} />
            ) : (
              renderDiscoverByNearest()
            )}
            {isBestDestinationLoading ? (
              <HorizontalListLoader count={8} />
            ) : (
              renderBestDestination()
            )}
            {renderAllDestination()}
          </>
        );
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.locationWrapper}>
          <View style={styles.locationContainer}>
            <Image
              source={require('../../assets/zipsii.png')}
              style={styles.locationImage}
            />
            <TextDefault style={styles.locationText} H5 bold>Zypsii</TextDefault>
          </View>
        </View>
        <View style={styles.rightIconsContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SearchPage')}
            style={styles.notificationIconWrapper}
          >
            <MaterialIcons
              name="search"
              size={28}
              color="#000"
              style={styles.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MessageList')}
            style={styles.notificationIconWrapper}
          >
            <MaterialIcons
              name="forum"
              size={28}
              color="#000"
              style={[styles.icon, { marginRight: 5 }]}
            />
            {unreadMessages > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notification')}
            style={styles.notificationIconWrapper}
          >
            <MaterialIcons
              name="notifications-none"
              size={28}
              color="#000"
              style={styles.notificationIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Stories />

      <View style={styles.buttonContainer}>
        {buttons.map(button => (
          <TouchableOpacity
            key={button}
            style={[
              styles.button,
              selectedButton === button && styles.selectedButton
            ]}
            onPress={() => setSelectedButton(button)}
          >
            <TextDefault
              style={[
                styles.buttonText,
                selectedButton === button && styles.selectedButtonText
              ]}
            >
              {button}
            </TextDefault>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}
    </>
  );

  useStatusBar(colors.btncolor, 'light-content');

  return (
    <SafeAreaView style={[styles.flex, styles.safeAreaStyle]}>
      <View style={[styles.grayBackground, styles.flex]}>
        <View style={[styles.contentContainer, { paddingBottom: 100 }]}>
          <FlatList
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            data={[]}
            renderItem={() => null}
            ListEmptyComponent={null}
          />
        </View>
        <View style={styles.bottomTabContainer}>
          <BottomTab screen="HOME" />
        </View>
      </View>
      <FloatingSupportButton onPress={() => setIsChatVisible(true)} />
      <ChatSupport
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
      />
    </SafeAreaView>
  );
}

export default MainLanding;


