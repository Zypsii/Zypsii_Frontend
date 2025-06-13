import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, Dimensions, Modal, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../components/Auth/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import { colors } from '../../utils/colors';
import { base_url } from '../../utils/base_url';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  // OTP Login states
  const [otpLoginModal, setOtpLoginModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [requestId, setRequestId] = useState('');
  const [otpLoginStep, setOtpLoginStep] = useState('phone'); // 'phone' or 'verify'
  const [otpLoginLoading, setOtpLoginLoading] = useState(false);

  const navigation = useNavigation();
  const { user, login } = useAuth();

  // Google login state and function
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '515987030322-bru7j7ju5a8kono09pgg27454c8aij3h.apps.googleusercontent.com',
    iosClientId: '515987030322-bru7j7ju5a8kono09pgg27454c8aij3h.apps.googleusercontent.com',
    expoClientId: '515987030322-bru7j7ju5a8kono09pgg27454c8aij3h.apps.googleusercontent.com1041802076420-pi7qln0r9tqb2nj8gju3286qti3alkj4.apps.googleusercontent.com',
    webClientId: '515987030322-bru7j7ju5a8kono09pgg27454c8aij3h.apps.googleusercontent.com',
    responseType: 'id_token',
    scopes: ['profile', 'email'],
    redirectUri: 'https://auth.expo.io/@abithjvinith/zypsii'
  });

  useEffect(() => {
    console.log('Google Auth Response:', response);
    if (response?.type === 'success') {
      console.log('Success Response Params:', response.params);
      const { id_token } = response.params;
      console.log('ID Token:', id_token);
      handleGoogleAuthentication(id_token);
    } else if (response?.type === 'error') {
      console.error('Google Auth Error:', response.error);
      Alert.alert('Error', 'Google authentication failed. Please try again.');
    } else if (response) {
      console.log('Other Response Type:', response.type);
      console.log('Response Params:', response.params);
    }
  }, [response]);

  console.log(user);
  useEffect(() => {
    const checkUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');

      if (storedUser) {
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
      const response = await fetch(`${base_url}/user/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userNameOrEmail,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.error) {
          Alert.alert('Success', 'Logged in successfully');
          const { token, userDetails } = data;
          await AsyncStorage.setItem('accessToken', token);
          console.log('Access Token:', token);
          await AsyncStorage.setItem('user', JSON.stringify(userDetails));
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

  const handleGoogleAuthentication = async (id_token) => {
    try {
      setLoading(true);
      const expoPushToken = await registerForPushNotificationsAsync();

      let response = await fetch(`${base_url}/user/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          googleToken: id_token,
          expoPushToken
        }),
      });

      let data = await response.json();
      console.log('Google auth response:', data);

      if (!response.ok && response.status === 404) {
        response = await fetch(`${base_url}/user/signup/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            googleToken: id_token,
            expoPushToken
          }),
        });
        data = await response.json();
        console.log('Google signup response:', data);
      }

      if (response.ok && !data.error) {
        const { token, userDetails } = data;
        await AsyncStorage.setItem('accessToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(userDetails));
        login(userDetails);
        navigation.navigate('Drawer', { screen: 'MainLanding' });
      } else {
        console.error('Authentication failed:', data);
        Alert.alert('Error', data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      Alert.alert('Error', 'Authentication failed due to a network error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('Initiating Google login prompt...');
      const result = await promptAsync();
      console.log('Prompt result:', result);
    } catch (error) {
      console.error('Google login prompt error:', error);
      Alert.alert('Error', 'Failed to open Google login');
    }
  };

  // OTP Login Functions
  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setOtpLoginLoading(true);
    try {
      const response = await fetch(`${base_url}/user/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          countryCode: countryCode
        }),
      });

      const data = await response.json();
      console.log('Send OTP response:', data);

      if (response.ok) {
        setRequestId(data.requestId);
        setOtpLoginStep('verify');
        Alert.alert('Success', 'OTP sent successfully to your phone');
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert('Error', 'Failed to send OTP due to network error');
    } finally {
      setOtpLoginLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 4) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    setOtpLoginLoading(true);
    try {
      const response = await fetch(`${base_url}/user/verify-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: parseInt(phoneNumber),
          countryCode: countryCode,
          code: parseInt(otpCode),
          requestId: requestId
        }),
      });

      const data = await response.json();
      console.log('Verify OTP response:', data);

      if (response.ok && !data.error) {
        const { token, userDetails } = data;
        await AsyncStorage.setItem('accessToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(userDetails));
        login(userDetails);
        
        // Close modal and reset states
        setOtpLoginModal(false);
        setOtpLoginStep('phone');
        setPhoneNumber('');
        setOtpCode('');
        setRequestId('');
        
        Alert.alert('Success', 'Logged in successfully');
        navigation.navigate('Drawer', { screen: 'MainLanding' });
      } else {
        Alert.alert('Error', data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('Error', 'Failed to verify OTP due to network error');
    } finally {
      setOtpLoginLoading(false);
    }
  };

  const resetOtpLogin = () => {
    setOtpLoginStep('phone');
    setPhoneNumber('');
    setOtpCode('');
    setRequestId('');
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
          otp: otp,
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
    <>
      <StatusBar barStyle="light-content" backgroundColor="#A60F93" />
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
          <LinearGradient
            colors={['#A60F93', '#FF69B4', '#9932CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.topSection}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="lock-closed" size={40} color="#fff" />
              </View>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.8)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your Email"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={userNameOrEmail}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.8)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your Password"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <Ionicons 
                    name={passwordVisible ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="rgba(255,255,255,0.8)" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => setForgotPasswordModal(true)}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.bottomSection}>
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>LOGIN</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                <Image source={require('../../assets/icons/google.png')} style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialButton} 
                onPress={() => setOtpLoginModal(true)}
              >
                <Ionicons name="phone-portrait-outline" size={24} color="#A60F93" />
                <Text style={styles.socialButtonText}>Phone</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* OTP Login Modal */}
        <Modal
          visible={otpLoginModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setOtpLoginModal(false);
            resetOtpLogin();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="phone-portrait" size={40} color="#A60F93" />
                <Text style={styles.modalTitle}>
                  {otpLoginStep === 'phone' ? 'Phone Login' : 'Verify OTP'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {otpLoginStep === 'phone' 
                    ? 'Enter your phone number to receive OTP'
                    : 'Enter the OTP sent to your phone'
                  }
                </Text>
              </View>

              {otpLoginStep === 'phone' ? (
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Phone Number"
                    placeholderTextColor="#999"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              ) : (
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter OTP"
                  placeholderTextColor="#999"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="numeric"
                  maxLength={6}
                  textAlign="center"
                  fontSize={20}
                  letterSpacing={5}
                />
              )}

              <TouchableOpacity
                style={[styles.modalButton, otpLoginLoading && styles.buttonDisabled]}
                onPress={otpLoginStep === 'phone' ? handleSendOTP : handleVerifyOTP}
                disabled={otpLoginLoading}
              >
                {otpLoginLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {otpLoginStep === 'phone' ? 'Send OTP' : 'Verify & Login'}
                  </Text>
                )}
              </TouchableOpacity>

              {otpLoginStep === 'verify' && (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleSendOTP}
                  disabled={otpLoginLoading}
                >
                  <Text style={styles.resendButtonText}>Resend OTP</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setOtpLoginModal(false);
                  resetOtpLogin();
                }}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Forgot Password Modal */}
        <Modal
          visible={forgotPasswordModal}
          transparent
          animationType="slide"
          onRequestClose={() => setForgotPasswordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="key" size={40} color="#A60F93" />
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Text style={styles.modalSubtitle}>
                  Enter your email address and we'll send you an OTP to reset your password.
                </Text>
              </View>

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
                style={[styles.modalButton, forgotPasswordLoading && styles.buttonDisabled]}
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

        {/* OTP Verification Modal for Password Reset */}
        <Modal
          visible={otpModal}
          transparent
          animationType="slide"
          onRequestClose={() => setOtpModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="shield-checkmark" size={40} color="#A60F93" />
                <Text style={styles.modalTitle}>Enter OTP</Text>
                <Text style={styles.modalSubtitle}>
                  Please enter the 4-digit OTP sent to your email.
                </Text>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Enter OTP"
                placeholderTextColor="#999"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={4}
                textAlign="center"
                fontSize={20}
                letterSpacing={5}
              />

              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="New Password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!newPasswordVisible}
                />
                <TouchableOpacity
                  style={styles.modalEyeIcon}
                  onPress={() => setNewPasswordVisible(!newPasswordVisible)}
                >
                  <Ionicons 
                    name={newPasswordVisible ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!confirmPasswordVisible}
                />
                <TouchableOpacity
                  style={styles.modalEyeIcon}
                  onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                >
                  <Ionicons 
                    name={confirmPasswordVisible ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.modalButton, forgotPasswordLoading && styles.buttonDisabled]}
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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: Dimensions.get('window').height,
  },
  topSection: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
    minHeight: Dimensions.get('window').height * 0.65,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    marginTop: -30,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loginButton: {
    backgroundColor: '#A60F93',
    paddingVertical: 18,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#A60F93',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#999',
    fontSize: 14,
    marginHorizontal: 15,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 15,
    borderRadius: 15,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  socialButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#A60F93',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInput: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  countryCodeContainer: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 18,
    marginRight: 10,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    height: 55,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  modalButton: {
    backgroundColor: '#A60F93',
    width: '100%',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#A60F93',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  resendButtonText: {
    color: '#A60F93',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalCloseButton: {
    width: '100%',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  modalCloseButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordInputWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  modalEyeIcon: {
    position: 'absolute',
    right: 15,
    top: 17,
    padding: 5,
  },
});

export default SignInScreen;