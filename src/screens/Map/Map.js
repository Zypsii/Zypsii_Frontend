import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, ScrollView, Image } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { BackHeader, BottomTab } from "../../components";
import { alignment, colors } from "../../utils";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { TextDefault } from '../../components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DiscoverByNearest from '../../components/DiscoverByNearest/DiscoverByNearest';
import { base_url } from '../../utils/base_url';
//const baseUrl = 'https://admin.zypsii.com';
const Map = ({ route }) => {
  const navigation = useNavigation();
  const backPressed = () => {
    navigation.goBack();
  };
  const [discoverbynearest, setDiscoverbyNearest] = useState([]);
  const { locations = [] } = route.params || {};

  // Calculate initial region based on locations
  const getInitialRegion = () => {
    if (locations.length === 0) {
      return {
        latitude: 13.0827,
        longitude: 80.2707,
        latitudeDelta: 4.5,
        longitudeDelta: 4.5,
      };
    }

    const latitudes = locations.map(loc => loc.location.lat);
    const longitudes = locations.map(loc => loc.location.lng);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.abs(maxLat - minLat) * 1.5,
      longitudeDelta: Math.abs(maxLng - minLng) * 1.5,
    };
  };

  // Get route coordinates from locations
  const getRouteCoordinates = () => {
    return locations.map(loc => ({
      latitude: loc.location.lat,
      longitude: loc.location.lng
    }));
  };

  useEffect(() => {
    const fetchDiscoverbyNearest = async () => {
      try {
        const response = await fetch(`${base_url}/schedule/places/getNearest`);
        const data = await response.json();
        const formattedData = data.slice(0, 100).map(item => ({
          id: item.id,
          image: item.image,
          title: item.name,
          subtitle: item.subtitle,
        }));
        setDiscoverbyNearest(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchDiscoverbyNearest();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.protractorShape} />
      <View style={styles.backgroundCurvedContainer} />

      {/* Back Header */}
      <BackHeader backPressed={backPressed} /> 

      <View style={styles.mainContent}>
        <Text style={styles.title}>Trip Locations</Text>

        <View style={styles.fromToContainer}>
          {locations.length > 0 && (
            <>
              <View style={styles.locationInfo}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.darkGray} />
                <Text style={styles.locationText}>
                  {locations[0].name}
                </Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={20} color={colors.darkGray} style={styles.arrowIcon} />
              <View style={styles.locationInfo}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.darkGray} />
                <Text style={styles.locationText}>
                  {locations[locations.length - 1].name}
                </Text>
              </View>
            </>
          )}
        </View>

        <MapView
          style={styles.map}
          initialRegion={getInitialRegion()}
        >
          {locations.map((location, index) => (
            <Marker
              key={location._id}
              coordinate={{
                latitude: location.location.lat,
                longitude: location.location.lng
              }}
              title={location.name}
              description={location.address}
            />
          ))}

          {locations.length > 1 && (
            <Polyline
              coordinates={getRouteCoordinates()}
              strokeColor="#007AFF"
              strokeWidth={4}
            />
          )}
        </MapView>

        <Text style={styles.explore}>Explore Travel</Text>

        <View style={styles.discoverRow}>
          <TextDefault style={styles.discoverText}>Discover by Nearest</TextDefault>
          <TouchableOpacity onPress={() => navigation.navigate('DiscoverPlace')}>
            <TextDefault style={styles.viewAllText}>View All</TextDefault>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => item.id}
        data={discoverbynearest}
        renderItem={({ item, index }) => (
          <DiscoverByNearest styles={styles.itemCardContainer} {...item} />
        )}
        style={styles.discoverList}
      />

      <View style={styles.bottomTabContainer}>
        <BottomTab screen={"WhereToGo"} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backgroundCurvedContainer: {
    backgroundColor: colors.btncolor,
    height: 200,
    width: "100%",
    position: "absolute",
    top: 0,
    zIndex: 0,
  },
  protractorShape: {
    backgroundColor: colors.white,
    height: 500,
    width: 1000,
    borderTopLeftRadius: 500,
    borderTopRightRadius: 500,
    position: "absolute",
    top: 80,
    alignSelf: "center",
    zIndex: 1,
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
    paddingTop: 90,
    zIndex: 2,
  },
  fromToContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 16,
    fontWeight: "bold",
    ...alignment.MLmedium,
    color: colors.darkGray,
  },
  arrowIcon: {
    marginHorizontal: 5,
  },
  title: {
    textAlign: "center",
    marginVertical: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: colors.fontMainColor,
  },
  map: {
    width: Dimensions.get("window").width * 0.9,
    alignSelf: "center",
    height: Dimensions.get("window").height * 0.4,
  },
  discoverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginVertical: 10,
    ...alignment.MBmedium,
  },
  discoverText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.fontMainColor,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.btncolor,
    fontWeight: "500",
  },
  explore: {
    ...alignment.Psmall,
    fontWeight: "bold",
    alignSelf: "center",
    fontSize: 16,
  },
  discoverList: {
    marginBottom: 80,
  },
  bottomTabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
});

export default Map;
