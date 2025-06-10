import React, { useContext } from 'react';
import { TouchableOpacity, View, Image, ScrollView, Share } from 'react-native';
import styles from './styles';
import { Feather, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TextDefault } from '../../../components';
import { useAuth } from '../../../components/Auth/AuthContext';
import { colors } from '../../../utils';

function ProfileContainer({profileInfo}) {
  const navigation = useNavigation();
  const { user } = useAuth();

  const handleShare = async () => {
    try {
      const shareOptions = {
        message: `Check out ${user?.fullName || profileInfo?.name}'s profile on Zypsii!`,
        url: `Zypsii://profile/${profileInfo?.id}`,
        title: `Share ${user?.fullName || profileInfo?.name}'s Profile`
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.protractorShape} />
      <View style={styles.backgroundCurvedContainer} />
      <View style={styles.maincontainer}>

        {/* Icons Row */}
        <View style={styles.topIconsRow}>
          <View style={styles.circle}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.circle}>
            <TouchableOpacity onPress={handleShare}>
              <MaterialCommunityIcons name="share-all-outline" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Picture and Name */}
        <View style={styles.profileSection}>
          <Image 
            source={{uri: user?.profilePicture || profileInfo?.image}} 
            style={styles.profileImage} 
          />
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => navigation.navigate('PageCreation')}>
            <Feather name="edit" size={18} color={colors.white} />
          </TouchableOpacity>
          <TextDefault style={styles.profileName} H4>
            {user?.fullName || profileInfo?.name || 'User Name'}
          </TextDefault>
        </View>

        {/* Stats Section */}
        {/* <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <TextDefault style={styles.statLabel}>Posts</TextDefault>
            <TextDefault style={styles.statNumber}>{profileInfo?.Posts || '0'}</TextDefault>
          </View>
          <TouchableOpacity 
            style={styles.stat}
            onPress={() => navigation.navigate('FollowersList', { initialTab: 'Followers' })}
          >
            <TextDefault style={styles.statLabel}>Followers</TextDefault>
            <TextDefault style={styles.statNumber}>{profileInfo?.Followers || '0'}</TextDefault>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statLast}
            onPress={() => navigation.navigate('FollowersList', { initialTab: 'Following' })}
          >
            <TextDefault style={styles.statLabel}>Following</TextDefault>
            <TextDefault style={styles.statNumber}>{profileInfo?.Following || '0'}</TextDefault>
          </TouchableOpacity>
        </View> */}

        {/* Settings Options */}
        <View style={styles.settingsSection} H5>
          {[
            // { label: 'Your Profile', icon: 'person-outline', route: 'DummyScreen' },
            // { label: 'Expense Calculator', icon: 'calculate', route: 'ExpenseCalculator' },
            { label: 'Delete', icon: 'delete', route: 'DeleteButton' },
            { label: 'Logout', icon: 'logout', route: 'Logout' },
            { label: 'Favourites', icon: 'star-outline', route: 'Favourite' },
            { label: 'FAQ', icon: 'help-outline', route: 'FAQ' },
            { label: 'My Schedule', icon: 'list', route: 'MySchedule' },
            // { label: 'Help Center', icon: 'help', route: 'HelpCenter' },
            // { label: 'Privacy Policy', icon: 'lock', route: 'PrivacyPolicy' },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingsItem}
              onPress={() => navigation.navigate(item.route)}>
              <View style={styles.settingsItemContent}>
                <MaterialIcons name={item.icon} size={24} color={colors.darkGrayText} />
                <TextDefault style={styles.settingsItemText} H5>
                  {item.label}
                </TextDefault>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={colors.darkGrayText}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

export default ProfileContainer;
