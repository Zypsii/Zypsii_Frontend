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

    // Only ask for permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Stop if permissions are not granted
    if (finalStatus !== 'granted') {
      return;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.brownColor,
      });
    }
  }

  // Show a spinner while fonts and data are loading
  if (!fontLoaded) {
    return <Spinner spinnerColor={colors.spinnerColor} />;
  }

  // Render the main app once everything is loaded
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.headerbackground}
      />

      <Provider store={store}>
        <AuthProvider>
          <ScheduleProvider>
            <AppContainer />
          </ScheduleProvider>
        </AuthProvider>
      </Provider>

      {/* FlashMessage for global notifications */}
      <FlashMessage position="top" />
    </>
  );
}