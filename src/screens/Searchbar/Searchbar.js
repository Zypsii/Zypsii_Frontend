import React, { useState, useEffect, useCallback } from "react";
import FollowButton from "../../components/Follow/FollowButton";
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { colors } from "../../utils";
import { alignment } from "../../utils";
import { base_url } from "../../utils/base_url";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';
import RecommendCard from "../../components/Recommendation/RecommendCard";
import { useToast } from '../../context/ToastContext';

function SearchPage() {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("People");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showViewMoreModal, setShowViewMoreModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchSearchResults = async (text) => {
    if (text.trim() === "") {
      setSearchResults([]); 
      return;
    }
    
    setIsLoading(true);
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    if (!accessToken) {
      console.error('No access token found');
      showToast('Authentication required', 'error');
      setIsLoading(false);
      return;
    }

    const url = activeTab === "People"
      ? `${base_url}/user/getProfile?search=${encodeURIComponent(text)}&filter=users`
      : `${base_url}/schedule/places/searchWithItinerary?searchPlaceName=${encodeURIComponent(text)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        setSearchResults([]);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data && data.success) {
        if (activeTab === "Places") {
          const suggestions = data.data.suggestions || [];
          const formattedData = suggestions.map(place => ({
            id: place.id || '',
            image: place.image || 'https://via.placeholder.com/50',
            name: place.name || 'Unknown Place',
            tagline: place.tagline || '',
            rating: place.rating || 0,
            distance: place.distance || 'N/A',
            location: {
              latitude: place.location?.lat || 0,
              longitude: place.location?.lng || 0,
              address: place.tagline || ''
            },
            suggestions: [{
              tripName: place.suggestions?.[0]?.tripName || `Trip to ${place.name}`,
              places: place.suggestions?.[0]?.places || []
            }]
          }));
          
          console.log('Formatted Places Data:', formattedData);
          setSearchResults(formattedData);
        } else {
          // Handle people search results
          const usersArray = Array.isArray(data.data) ? data.data : [data.data];
          const formattedData = usersArray
            .filter(user => user && user._id) // Filter out invalid users
            .map(user => ({
              id: user._id,
              image: user.profilePicture || 'https://via.placeholder.com/50',
              name: user.fullName || 'Unknown User',
              tagline: user.userName || '',
              email: user.email || '',
              website: user.website || '',
              bio: user.bio || '',
              location: user.location || '',
              placeDetails: user.placeDetails || {},
              profileViews: user.profileViews || 'public'
            }));
          
          console.log('Formatted People Data:', formattedData);
          setSearchResults(formattedData);
        }
      } else {
        console.log('API returned success: false:', data);
        setSearchResults([]);
        if (data.message) {
          showToast(data.message, 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      console.error('Error details:', error.message);
      setSearchResults([]);
      if (error.message && !error.message.includes('Status: 404')) {
        showToast('Failed to search. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      fetchSearchResults(text);
    }, 500);
    setSearchTimeout(timeout);
  };

  const getVehicleIcon = (vehicle) => {
    let icon = '🚗';
    switch(vehicle) {
      case 'bike':
        icon = '🚲';
        break;
      case 'car':
        icon = '🚗';
        break;
      case 'jeep':
        icon = '🚙';
        break;
    }
    return <Text>{icon}</Text>;
  };

  const renderItem = ({ item, index }) => (
    <Animated.View style={[styles.itemWrapper, { opacity: 1 }]}>
      <TouchableOpacity
        style={styles.itemTouchable}
        onPress={() => {
          if (activeTab === "Places") {
            navigation.navigate('Destination', {
              product: {
                id: item.id,
                image: item.image,
                name: item.name,
                subtitle: item.tagline,
                rating: item.rating,
                distance: item.distance,
                location: item.location,
                suggestions: item.suggestions
              }
            });
          } else {
            navigation.navigate('UserProfile', { 
              targetUserId: item.id,
              userData: {
                id: item.id,
                fullName: item.name,
                userName: item.tagline,
                email: item.email,
                website: item.website,
                bio: item.bio,
                location: item.location,
                placeDetails: item.placeDetails,
                profilePicture: item.image,
                profileViews: item.profileViews
              }
            });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.personContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: item.image || 'https://via.placeholder.com/50' }}
              style={styles.avatar}
            />
            {activeTab === "People" && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
          
          <View style={styles.personDetails}>
            <View style={styles.nameRow}>
              <View style={styles.nameContainer}>
                <Text style={styles.personName} numberOfLines={1}>
                  {item.name}
                </Text>
                {activeTab === "People" && item.tagline && (
                  <Text style={styles.personTagline} numberOfLines={1}>
                    @{item.tagline}
                  </Text>
                )}
              </View>
              
              <View style={styles.actionButtons}>
                {activeTab === "People" && (
                  <>
                    <TouchableOpacity 
                      style={styles.chatButton}
                      onPress={() => {
                        if (!item.id || !item.name) {
                          showToast('Invalid user data', 'error');
                          return;
                        }
                        
                        console.log('Navigating to chat with:', { userId: item.id, userName: item.name });
                        
                        navigation.navigate('ChatScreen', { 
                          userId: item.id,
                          userName: item.name
                        });
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color={colors.Zypsii_color} />
                    </TouchableOpacity>
                    <FollowButton userId={item.id} />
                  </>
                )}
              </View>
            </View>
            
            {activeTab === "Places" && (
              <View style={styles.placeInfo}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FF6B35" />
                  <Text style={styles.ratingText}>{item.rating || '0'}</Text>
                  <View style={styles.separator} />
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.distanceText}>{item.distance}</Text>
                </View>
                <View style={styles.locationContainer}>
                  <Text style={styles.locationText} numberOfLines={2}>
                    {item.tagline || 'Location not available'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      {activeTab === "Places" && item.suggestions && (
        <View style={styles.recommendCardWrapper}>
          {/* <RecommendCard 
            title={<Text>Suggested Itineraries</Text>}
            suggestions={item.suggestions}
            onSchedulePress={() => {
              setSelectedPlace(item);
              setShowScheduleModal(true);
            }}
            onViewMorePress={() => {
              setSelectedPlace(item);
              setShowViewMoreModal(true);
            }}
          /> */}
        </View>
      )}
    </Animated.View>
  );

  const renderResultCount = () => {
    const count = searchResults.length;
    return (
      <View style={styles.resultCountContainer}>
        <Text style={styles.resultCount}>
          {count} {count === 1 ? 'result' : 'results'} found
        </Text>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Enhanced Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={[
          styles.searchBarContainer,
          isFocused && styles.searchBarFocused
        ]}>
          <Ionicons 
            name="search" 
            size={20} 
            color={isFocused ? colors.Zypsii_color : "#999"} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={`Search for ${activeTab.toLowerCase()}...`}
            placeholderTextColor="#999"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText !== "" && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchText("");
                setSearchResults([]);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
          {isLoading && (
            <View style={styles.searchLoadingContainer}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.Zypsii_color} />
            </View>
          )}
        </View>
      </View>

      {/* Enhanced Tab Container */}
      <View style={styles.tabContainer}>
        {["People", "Places"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton,
            ]}
            onPress={() => {
              setActiveTab(tab);
              setSearchText("");
              setSearchResults([]);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Section */}
      {(searchResults.length > 0 || isLoading) && renderResultCount()}

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searchText.trim() !== "" && !isLoading ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons 
                name={activeTab === "People" ? "people-outline" : "location-outline"} 
                size={64} 
                color="#E0E0E0" 
              />
              <Text style={styles.noResultsTitle}>No {activeTab.toLowerCase()} found</Text>
              <Text style={styles.noResultsSubtitle}>
                Try adjusting your search terms or explore different keywords
              </Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 5,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "transparent",
  },
  searchBarFocused: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.Zypsii_color,
    elevation: 2,
    shadowColor: colors.Zypsii_color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "400",
  },
  clearButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tabButton: {
    paddingVertical: 16,
    paddingHorizontal: 42,
    position: "relative",
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "500",
  },
  activeTabText: {
    fontSize: 16,
    color: colors.Zypsii_color,
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.Zypsii_color,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  resultCountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  resultCount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.Zypsii_color,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 5,
  },
  itemWrapper: {
    marginVertical: 0,
  },
  itemTouchable: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  personContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F0F0",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  personDetails: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  personName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  personTagline: {
    fontSize: 13,
    color: "#666",
    fontWeight: "400",
  },
  placeInfo: {
    marginTop: 0,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 14,
    color: "#FF6B35",
    marginLeft: 4,
    fontWeight: "600",
  },
  separator: {
    width: 1,
    height: 0,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 8,
  },
  distanceText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  locationContainer: {
    marginTop: 2,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  bioText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    lineHeight: 20,
  },
  websiteContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  websiteText: {
    fontSize: 14,
    color: colors.Zypsii_color,
    marginLeft: 6,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.Zypsii_color + "20",
  },
  recommendCardWrapper: {
    marginTop: 8,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 8,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  searchLoadingContainer: {
    padding: 4,
    marginLeft: 8,
  },
});

export default SearchPage;