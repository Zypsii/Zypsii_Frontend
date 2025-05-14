import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { BackHeader, BottomTab } from '../../components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For location icons
import { alignment, colors } from '../../utils'; // Ensure you define appropriate colors in your utils.
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

const TripDetail = ({ route }) => {
  const navigation = useNavigation();
  const { tripData } = route.params;
  const [activeDay, setActiveDay] = useState(1);
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placeDescriptions, setPlaceDescriptions] = useState([]);
  
  useEffect(() => {
    fetchScheduleData();
    getPlaceDescriptions();
  }, []);

  const fetchScheduleData = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(
        `${base_url}/schedule/listing/scheduleDescription/${tripData.id}?offset=0&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.data) {
        // Transform the data to organize by days
        const transformedData = response.data.data.map((item, index) => ({
          day: index + 1,
          description: item.Description,
          date: item.date,
          locations: item.planDescription || []
        }));
        setScheduleData(transformedData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      setLoading(false);
      // Set empty array as fallback
      setScheduleData([]);
    }
  };

  const getPlaceDescriptions = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(
        `${base_url}/places/descriptions`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.data) {
        const descriptions = response.data.data.map(place => ({
          id: place.id,
          name: place.name,
          description: place.description,
          location: place.location
        }));
        setPlaceDescriptions(descriptions);
      }
    } catch (error) {
      console.error('Error fetching place descriptions:', error);
      // Set empty array as fallback
      setPlaceDescriptions([]);
    }
  };

  const backPressed = () => {
    navigation.goBack();
  };

  // Function to get locations for current day
  const getLocationsForDay = (day) => {
    // First check if we have schedule data for this day
    if (scheduleData && scheduleData.length > 0) {
      const dayData = scheduleData.find(item => item.day === day);
      if (dayData && dayData.locations && dayData.locations.length > 0) {
        // Enhance locations with place descriptions
        return dayData.locations.map(location => {
          const placeInfo = placeDescriptions.find(place => place.id === location.id);
          return {
            ...location,
            description: placeInfo?.description || location.description
          };
        });
      }
    }
    
    // Fallback to original logic if no schedule data for this day
    const locationsPerDay = Math.ceil(tripData.locationDetails.length / parseInt(tripData.numberOfDays));
    const startIndex = (day - 1) * locationsPerDay;
    const endIndex = Math.min(startIndex + locationsPerDay, tripData.locationDetails.length);
    const locations = tripData.locationDetails.slice(startIndex, endIndex);
    
    // Enhance locations with place descriptions
    return locations.map(location => {
      const placeInfo = placeDescriptions.find(place => place.id === location.id);
      return {
        ...location,
        description: placeInfo?.description || location.description
      };
    });
  };

  // Function to get day title
  const getDayTitle = (day) => {
    // First check if we have schedule data for this day
    if (scheduleData && scheduleData.length > 0) {
      const dayData = scheduleData.find(item => item.day === day);
      if (dayData && dayData.description) {
        return dayData.description;
      }
    }
    
    // Fallback to original logic
    const dayLocations = getLocationsForDay(day);
    if (dayLocations.length > 0) {
      return dayLocations[0].name || `Day ${day}`;
    }
    return `Day ${day}`;
  };

  // Get all days that have locations
  const daysWithLocations = Array.from(
    { length: parseInt(tripData.numberOfDays) }, 
    (_, i) => i + 1
  ).filter(day => getLocationsForDay(day).length > 0);

  const renderDayPlan = ({ item, index, arrayLength }) => (
    <View style={styles.dayPlanItem}>
      <View style={styles.iconAndLineContainer}>
        <Icon name="map-marker" size={20} color={colors.black} />
        {index < arrayLength - 1 && <View style={styles.dottedLine} />}
      </View>
      <View style={styles.locationDetails}>
        <Text style={styles.location}>{item.name}</Text>
        <Text style={styles.locationAddress}>{item.address}</Text>
        <Text style={styles.locationDistance}>{item.distanceInKilometer}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.protractorShape} />
      <View style={styles.backgroundCurvedContainer} />
      <View style={styles.maincontainer}>
        <BackHeader backPressed={backPressed} />

        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.topSection}>
            <View style={styles.fromToSection}>
              <View style={styles.locationInfo}>
                <Icon name="map-marker-outline" size={20} color={colors.darkGray} />
                <Text style={styles.locationText}>
                  {getLocationsForDay(activeDay)[0]?.name?.slice(0, 5) + '...' || 'Starting Point'}
                </Text>
              </View>
              <Text style={styles.dottedLineHorizontal}></Text>
              <View style={styles.locationInfo}>
                <Icon name="map-marker-outline" size={20} color={colors.darkGray} />
                <Text style={styles.locationText}>
                  {getLocationsForDay(activeDay)[getLocationsForDay(activeDay).length - 1]?.name?.slice(0, 5) + '...' || 'End Point'}
                </Text>
              </View>
            </View>

            <Image source={{ uri: tripData.imageUrl }} style={styles.image} />
          </View>

          <View style={styles.ridersDateContainer}>
            <Text style={styles.date}>
              <Icon name="calendar-outline" size={20} color={colors.darkGray} /> 
              {scheduleData[activeDay - 1]?.date 
                ? new Date(scheduleData[activeDay - 1].date).toLocaleDateString() 
                : tripData.date}
            </Text>
            <Text style={styles.riders}>
              🏍️ Riders: {tripData.riders}
            </Text>
          </View>

          <View style={styles.tripPlanSection}>
            <Text style={styles.sectionTitle}>Trip Detail Plan</Text>
            <Text style={styles.sectionTitleplan}>Locations</Text>

            <View style={styles.daysTabs}>
              {daysWithLocations.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayTab, activeDay === day && styles.activeTab]}
                  onPress={() => setActiveDay(day)}
                >
                  <Text style={[styles.dayTabText, activeDay === day && styles.activeTabText]}>
                    {getDayTitle(day)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dayPlanList}>
              <FlatList
                data={getLocationsForDay(activeDay)}
                renderItem={({ item, index }) =>
                  renderDayPlan({
                    item,
                    index,
                    arrayLength: getLocationsForDay(activeDay).length,
                  })
                }
                keyExtractor={(item) => item._id}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('MakeSchedule')}
        >
          <Text style={styles.buttonText}>Change Plan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, !daysWithLocations.includes(activeDay + 1) && styles.disabledButton]}
          onPress={() => {
            const nextDay = daysWithLocations.find(day => day > activeDay);
            if (nextDay) {
              setActiveDay(nextDay);
            }
          }}
          disabled={!daysWithLocations.includes(activeDay + 1)}
        >
          <Text style={styles.buttonText}>Next Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate('Map', { 
              locations: getLocationsForDay(activeDay).map(location => ({
                name: location.name,
                address: location.address,
                location: location.location,
                distanceInKilometer: location.distanceInKilometer
              }))
            })
          }
        >
          <Text style={styles.buttonText}>Map</Text>
        </TouchableOpacity>
      </View>
      <BottomTab screen="WhereToGo" style={styles.BottomTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, zIndex:2 },
  topSection: { flexDirection: 'row', ...alignment.Pmedium, alignItems: 'center', top: 160, zIndex: 2 },
  maincontainer:{
    flex: 1,
    zIndex: 2
  },
  fromToSection: { flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: -50 },
  locationInfo: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 22, fontWeight: 'bold', ...alignment.MLmedium, color: colors.darkGray },
  dottedLineHorizontal: {
    fontSize: 16,
    color: colors.lightGray,
    paddingLeft: 20, // You can change 10 to any value you prefer
  },
  
  image: { width: 110, height: 110, borderRadius: 30, marginTop: -60 },
  title: { fontSize: 30, fontWeight: 'bold', ...alignment.MBsmall, ...alignment.MLmedium },

  tripPlanSection: { paddingHorizontal: 20, top: 140 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  sectionTitleplan: {
    fontSize: 18,
    fontWeight: 'bold',
    ...alignment.MBmedium,
    textAlign: 'center',
    ...alignment.Psmall,
    backgroundColor: colors.btncolor,
    borderRadius: 10,
    color: colors.white,
    width: 130,
    alignSelf: 'center',
  },
  backgroundCurvedContainer: {
    backgroundColor: colors.btncolor,
    height: 200,
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
  protractorShape: {
    backgroundColor: colors.white,
    height: 500,
    width: 1000,
    borderTopLeftRadius: 500,
    borderTopRightRadius: 500,
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    zIndex: 1,
    overflow: 'hidden',
  },
  ridersDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: -5,
    marginHorizontal: 15,
    ...alignment.MBlarge,
    top: 150
  },
  riders: { fontSize: 16, color: colors.darkGray, fontWeight: 'bold' },
  date: { fontSize: 16, color: colors.darkGray, fontWeight: 'bold' },

  daysTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    ...alignment.MBsmall,
    borderBottomWidth: 2,
    borderColor: colors.graycolor,
    backgroundColor: colors.grayLinesColor,
  },
  dayTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: { borderColor: colors.black },
  dayTabText: { fontSize: 16, color: colors.fontMainColor, fontWeight: 'bold' },
  activeTabText: { color: colors.black },

  dayPlanList: { paddingVertical: 2 , zIndex: 2},
  dayPlanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    ...alignment.MLmedium,
  },
  iconAndLineContainer: {
    alignItems: 'center',
    ...alignment.MRsmall,
  },
  dottedLine: {
    width: 1,
    height: 20,
    backgroundColor: colors.black,
    marginVertical: 4,
  },
  locationDetails: {
    flex: 1,
    marginLeft: 10,
  },
  location: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  locationDistance: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', ...alignment.Psmall },
  button: { flex: 1, marginHorizontal: 5, ...alignment.Psmall, backgroundColor: colors.btncolor, borderRadius: 5 },
  buttonText: { textAlign: 'center', color: colors.white, fontWeight: 'bold' },
  disabledButton: {
    opacity: 0.5,
  },
});

export default TripDetail;