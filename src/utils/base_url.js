import { View, Text } from 'react-native'
import React from 'react'
import Constants from 'expo-constants'

const ENV = {
  development: {
    SERVER_URL: 'http://192.168.2.10:3030',
  },
  staging: {
    SERVER_URL: 'http://192.168.2.10:3030',
  },
  production: {
    SERVER_URL: 'http://192.168.2.10:3030',
  }
}

const getEnvVars = () => {
  // Use Constants.expoConfig instead of Constants.manifest
  const config = Constants.expoConfig || Constants.manifest;
  const env = config?.releaseChannel || 'development';
  
  if (__DEV__) {
    return ENV.development;
  } else if (env === 'production') {
    return ENV.production;
  } else if (env === 'staging') {
    return ENV.staging;
  } else {
    return ENV.development;
  }
}

export const base_url = getEnvVars().SERVER_URL;
