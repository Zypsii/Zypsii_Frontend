import React, { useState, useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';
import FlashMessage from 'react-native-flash-message';
import AppContainer from './src/routes/routes';
import { colors } from './src/utils/colors';
import { Spinner } from './src/components';
import { ScheduleProvider } from './src/context/ScheduleContext';
import { AuthProvider } from './src/components/Auth/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import { FollowProvider } from './src/components/Follow/FollowContext';

export default function App() {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    loadAppData();
  }, []);

  async function loadAppData() {
    // Load custom fonts
    await Font.loadAsync({
      'Poppins-Regular': require('./src/assets/font/Poppins/Poppins-Regular.ttf'),
      'Poppins-Bold': require('./src/assets/font/Poppins/Poppins-Bold.ttf'),
    });

    // Request permissions for push notifications
    await permissionForPushNotificationsAsync();

    // Set fontLoaded to true once all data is loaded
    setFontLoaded(true);
  }

  async function permissionForPushNotificationsAsync() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.brownColor,
      });
    }
  }

  if (!fontLoaded) {
    return <Spinner spinnerColor={colors.spinnerColor} />;
  }

  return (
    <Provider store={store}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.headerbackground}
      />
      <AuthProvider>
        <ScheduleProvider>
          <FollowProvider>
            <AppContainer />
          </FollowProvider>
        </ScheduleProvider>
      </AuthProvider>
      <FlashMessage position="top" />
    </Provider>
  );
}