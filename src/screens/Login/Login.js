import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, Dimensions, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../components/Auth/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import { colors } from '../../utils/colors';
import { base_url } from '../../utils/base_url';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const SignInScreen = () => {
  const [userNameOrEmail, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigation = useNavigation();
  const { user, login } = useAuth();

  // Google login state and function
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.select({
      ios: '1041802076420-3aomh29ianv3jto94ve7pa8748kg5mkb.apps.googleusercontent.com',
      android: '1041802076420-ebfavrc88drh2ooealh4i5qv6efjivab.apps.googleusercontent.com',
      default: '1041802076420-pi7qln0r9tqb2nj8gju3286qti3alkj4.apps.googleusercontent.com'
    }),
  });

  useEffect(() => {
    const checkUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');

      if (storedUser) {
        // If user is already logged in, navigate to MainLanding
        navigation.navigate('Drawer', { screen: 'MainLanding' });
      }
    };

    checkUser();
  }, [navigation]);

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.brownColor,
      });
    }

    return token;
  };

  const handleLogin = async () => {
    if (!userNameOrEmail || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      //const expoPushToken = await registerForPushNotificationsAsync();

      const response = await fetch(`${base_url}/user/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userNameOrEmail,
          password,
          //expoPushToken
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.error) {
          Alert.alert('Success', 'Logged in successfully');
          const { token, userDetails } = data;
          // Store the accessToken and user info
          await AsyncStorage.setItem('accessToken', token);
          console.log('Access Token:', token);
          await AsyncStorage.setItem('user', JSON.stringify(userDetails));
          // Use the login function from AuthContext to set the user
          login(userDetails);

          navigation.navigate('Drawer', { screen: 'MainLanding' });
        } else {
          Alert.alert('Error', data.message || 'Login failed');
        }
      } else {
        Alert.alert('Error', 'Login failed, please try again.');
      }
    } catch (error) {
      console.error('Network or fetch error:', error);
      Alert.alert('Error', 'Login failed due to a network error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const { id_token } = result.params;
        const expoPushToken = await registerForPushNotificationsAsync();

        setLoading(true);
        const response = await fetch(`${base_url}/user/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            googleToken: id_token,
            expoPushToken
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (!data.error) {
            Alert.alert('Success', 'Logged in successfully');
            const { token, userDetails } = data;
            // Store the accessToken and user info
            await AsyncStorage.setItem('accessToken', token);
            await AsyncStorage.setItem('user', JSON.stringify(userDetails));

            // Use the login function from AuthContext to set the user
            login(userDetails);

            navigation.navigate('Drawer', { screen: 'MainLanding' });
          } else {
            Alert.alert('Error', data.message || 'Google login failed');
          }
        } else {
          Alert.alert('Error', 'Google login failed, please try again.');
        }
      } else {
        Alert.alert('Error', 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Google login failed due to a network error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await fetch(`${base_url}/user/forgotPassword/getOTP/${forgotPasswordEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'OTP has been sent to your email');
        setForgotPasswordModal(false);
        setOtpModal(true);
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error in forgot password:', error);
      Alert.alert(
        'Error',
        'Failed to process your request. Please check your internet connection and try again.'
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await fetch(`${base_url}/user/forgotPassword/updatePassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword,
          otp: parseInt(otp),
          email: forgotPasswordEmail
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Password has been updated successfully');
        setOtpModal(false);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotPasswordEmail('');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to update password. Please try again.');
      }
    } catch (error) {
      console.error('Error in updating password:', error);
      Alert.alert(
        'Error',
        'Failed to process your request. Please check your internet connection and try again.'
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.topSection}>
          <Text style={styles.title}>Login</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your Email"
              placeholderTextColor="#999"
              value={userNameOrEmail}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => setForgotPasswordModal(true)}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signupButtonText}>SIGNUP</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>LOGIN</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.orText}>or login with</Text>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity onPress={handleGoogleLogin}>
              <Image source={require('../../assets/icons/google.png')} style={styles.socialIcon} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image source={require('../../assets/icons/facebook.png')} style={styles.socialIcon} />
            </TouchableOpacity>
            {/* <TouchableOpacity>
              <Image source={require('../../assets/icons/twitter.png')} style={styles.socialIcon} />
            </TouchableOpacity> */}
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupText}>Don't have an account? <Text style={styles.signupLink}>SIGN UP</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setForgotPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your email address and we'll send you an OTP to reset your password.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={forgotPasswordEmail}
              onChangeText={setForgotPasswordEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleForgotPassword}
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setForgotPasswordModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OTP Verification Modal */}
      <Modal
        visible={otpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalSubtitle}>
              Please enter the 4-digit OTP sent to your email.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter OTP"
              placeholderTextColor="#999"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={4}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleUpdatePassword}
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setOtpModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a60f93',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: Dimensions.get('window').height,
  },
  topSection: {
    flex: 1,
    backgroundColor: '#a60f93',
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 30,
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  label: {
    color: '#FFFFFF',
    marginBottom: 8,
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 25,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  signupButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#a60f93',
  },
  loginButton: {
    flex: 1,
    backgroundColor: '#a60f93',
    paddingVertical: 15,
    borderRadius: 25,
    marginLeft: 10,
  },
  signupButtonText: {
    color: '#a60f93',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  socialIcon: {
    width: 40,
    height: 40,
    marginHorizontal: 15,
  },
  signupText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  },
  signupLink: {
    color: '#a60f93',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.btncolor,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: colors.btncolor,
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.btncolor,
  },
  modalCloseButtonText: {
    color: colors.btncolor,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignInScreen;

