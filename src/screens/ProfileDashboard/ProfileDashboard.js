import React, { useContext } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import styles from './ProfileContainer/styles';
import ProfileContainer from './ProfileContainer/ProfileContainer';
import { BottomTab, TextDefault } from '../../components';
// import CardContainer from './CardContainer/CardContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { colors } from '../../utils';
import { base_url } from '../../utils/base_url';
import { useStatusBar } from '../../utils/useStatusBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

//const baseUrl = 'https://admin.zypsii.com';
function ProfileDashboard(props) {
  useStatusBar(colors.btncolor, 'light-content');
  const navigation = useNavigation();
  const [profileInfo, setProfileInfo] = useState({
    id: '',
    name: '',
    userName: '',
    email: '',
    website: '',
    bio: '',
    Posts: '0',
    Followers: '0',
    Following: '0',
    image: null
  });

  useEffect(() => {
    fetchProfileInfo();
  }, []);

  const fetchProfileInfo = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${base_url}/user/getProfile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const userData = result.data[0];
        setProfileInfo({
          id: userData._id || '',
          name: userData.fullName || '',
          userName: userData.userName || '',
          email: userData.email || '',
          website: userData.website || '',
          bio: userData.bio || '',
          Posts: userData.posts?.length?.toString() || '0',
          Followers: userData.followers?.length?.toString() || '0',
          Following: userData.following?.length?.toString() || '0',
          image: userData.profileImage || null
        });
      } else {
        throw new Error('No profile data found');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.flex, styles.safeAreaStyle]}>
      <ScrollView 
        contentContainerStyle={[styles.flex, styles.mainContainer]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileContainer profileInfo={profileInfo}/>
       
      </ScrollView>
      <View style={{height:200,backgroundColor:'white'}}></View>
    </SafeAreaView>
  );
}

export default ProfileDashboard;