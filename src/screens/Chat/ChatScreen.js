import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { API_URL } from '../../config';
import { colors } from '../../utils';

const { width, height } = Dimensions.get('window');

const ChatScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const typingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeChat();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Enhanced header with gradient-style background
    navigation.setOptions({
      title: userName,
      headerStyle: {
        backgroundColor: colors.Zypsii_color,
        shadowColor: colors.Zypsii_color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 18,
      },
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="videocam" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, userName]);

  // Animation for send button
  const animateSendButton = () => {
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.9,
        duration: 100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animation for typing indicator
  const showTypingIndicator = () => {
    setIsTyping(true);
    Animated.timing(typingOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideTypingIndicator = () => {
    Animated.timing(typingOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsTyping(false));
  };

  const initializeChat = async () => {
    try {
      // Get current user ID from AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');
      const userDataString = await AsyncStorage.getItem('user');
      
      if (!token || !userDataString) {
        Alert.alert('Error', 'Authentication required');
        navigation.goBack();
        return;
      }

      // Parse the user data string to get the user ID
      const userData = JSON.parse(userDataString);
      const userIdFromStorage = userData._id;
      
      setCurrentUserId(userIdFromStorage);

      // Initialize socket connection with reconnection options
      const socketInstance = io(API_URL, {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      setSocket(socketInstance);

      // Socket event listeners
      socketInstance.on('connect', () => {
        console.log('Connected to socket server');
        
        // Join chat room
        socketInstance.emit('join-chat-room', {
          senderId: userIdFromStorage,
          receiverId: userId
        });
        
        // Fetch chat history with error handling
        try {
          console.log('Fetching chat history for:', {
            senderId: userIdFromStorage,
            receiverId: userId
          });
          
          // Add a timeout for chat history request
          // const timeoutId = setTimeout(() => {
          //   console.log('Chat history request timed out');
          //   setLoading(false);
          //   Alert.alert('Error', 'Chat history request timed out. Please try again.');
          // }, 10000);

          socketInstance.emit('chat-history', {
            senderId: userIdFromStorage,
            receiverId: userId
          }, (response) => {
            console.log('Chat history response:', response);
            // clearTimeout(timeoutId);
            if (response && response.error) {
              console.error('Chat history error response:', response.error);
              setLoading(false);
              Alert.alert('Error', response.error.message || 'Failed to load chat history');
            }
          });
        } catch (error) {
          console.error('Error emitting chat history request:', error);
          setLoading(false);
          Alert.alert('Error', 'Failed to request chat history');
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setLoading(false);
        Alert.alert('Connection Error', 'Failed to connect to chat server. Please check your internet connection.');
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Disconnected from socket server:', reason);
        if (reason === 'io server disconnect') {
          socketInstance.connect();
        }
      });

      socketInstance.on('reconnect_attempt', (attemptNumber) => {
        console.log('Attempting to reconnect:', attemptNumber);
      });

      socketInstance.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        socketInstance.emit('join-chat-room', {
          senderId: userIdFromStorage,
          receiverId: userId
        });
        socketInstance.emit('chat-history', {
          senderId: userIdFromStorage,
          receiverId: userId
        });
      });

      socketInstance.on('reconnect_error', (error) => {
        console.error('Reconnection error:', error);
      });

      socketInstance.on('reconnect_failed', () => {
        console.error('Failed to reconnect');
        Alert.alert('Connection Error', 'Unable to reconnect to chat server. Please try again later.');
      });

      socketInstance.on('is-chat-room-joined', (message) => {
        console.log('Chat room joined:', message);
      });

      socketInstance.on('receive-message', (message) => {
        console.log('Received message:', message);
        if (message && message.senderId && message.message) {
          setMessages(prevMessages => [...prevMessages, message]);
          scrollToBottom();
          // Show typing indicator briefly for received messages
          showTypingIndicator();
          setTimeout(() => hideTypingIndicator(), 1000);
        } else {
          console.warn('Received invalid message format:', message);
        }
      });

      socketInstance.on('chat-history-result', (chatHistory) => {
        console.log('Chat history received:', chatHistory);
        if (Array.isArray(chatHistory)) {
          setMessages(chatHistory);
          setLoading(false);
          setTimeout(() => scrollToBottom(), 100);
        } else {
          console.warn('Invalid chat history format:', chatHistory);
          setMessages([]);
          setLoading(false);
        }
      });

      socketInstance.on('chat-history-error', (error) => {
        console.error('Chat history error:', error);
        setLoading(false);
        Alert.alert(
          'Error',
          'Failed to load chat history. Please try again.',
          [
            {
              text: 'Retry',
              onPress: () => {
                setLoading(true);
                socketInstance.emit('chat-history', {
                  senderId: userIdFromStorage,
                  receiverId: userId
                });
              }
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      });

      socketInstance.on('chat-error', (error) => {
        console.error('Chat error:', error);
        setSending(false);
        Alert.alert('Error', 'Failed to send message');
      });

    } catch (error) {
      console.error('Initialization error:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to initialize chat');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || sending) return;

    setSending(true);
    animateSendButton();
    
    try {
      socket.emit('send-message', {
        senderId: currentUserId,
        receiverId: userId,
        message: newMessage.trim()
      });
      
      setNewMessage('');
      setSending(false);
    } catch (error) {
      console.error('Send message error:', error);
      setSending(false);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const formatMessageTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return messageDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === currentUserId;
    const isFirstInGroup = index === 0 || messages[index - 1].senderId !== item.senderId;
    const isLastInGroup = index === messages.length - 1 || messages[index + 1].senderId !== item.senderId;
    
    return (
      <Animated.View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        isFirstInGroup && styles.firstInGroup,
        isLastInGroup && styles.lastInGroup
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          isFirstInGroup && (isMyMessage ? styles.myFirstBubble : styles.otherFirstBubble),
          isLastInGroup && (isMyMessage ? styles.myLastBubble : styles.otherLastBubble)
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime
            ]}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {isMyMessage && (
              <Ionicons 
                name="checkmark-done" 
                size={14} 
                color="rgba(255, 255, 255, 0.7)" 
                style={styles.readIndicator}
              />
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <Animated.View style={[styles.typingContainer, { opacity: typingOpacity }]}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.dot1]} />
            <View style={[styles.typingDot, styles.dot2]} />
            <View style={[styles.typingDot, styles.dot3]} />
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderSeparator = () => <View style={styles.messageSeparator} />;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.Zypsii_color} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.Zypsii_color} />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.messagesContainer}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyContent}>
                <Ionicons name="chatbubbles-outline" size={64} color="#cbd5e0" />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubText}>Start the conversation with {userName}!</Text>
              </View>
            </View>
          }
          ListFooterComponent={renderTypingIndicator}
          onContentSizeChange={() => scrollToBottom()}
          onLayout={() => scrollToBottom()}
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#a0aec0"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
              editable={!sending}
            />
            <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newMessage.trim() || sending) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  headerButton: {
    marginRight: 15,
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '500',
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    color: '#4a5568',
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
  },
  messageContainer: {
    marginVertical: 1,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  firstInGroup: {
    marginTop: 12,
  },
  lastInGroup: {
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  myMessageBubble: {
    backgroundColor: colors.Zypsii_color,
    borderBottomRightRadius: 8,
  },
  otherMessageBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  myFirstBubble: {
    borderTopRightRadius: 24,
  },
  myLastBubble: {
    borderBottomRightRadius: 24,
  },
  otherFirstBubble: {
    borderTopLeftRadius: 24,
  },
  otherLastBubble: {
    borderBottomLeftRadius: 24,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#2d3748',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#a0aec0',
  },
  readIndicator: {
    marginLeft: 4,
  },
  messageSeparator: {
    height: 2,
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
  },
  typingBubble: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a0aec0',
    marginHorizontal: 2,
  },
  dot1: {
    animationDelay: '0s',
  },
  dot2: {
    animationDelay: '0.2s',
  },
  dot3: {
    animationDelay: '0.4s',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 12,
    backgroundColor: '#f7fafc',
    color: '#2d3748',
    fontWeight: '400',
  },
  sendButton: {
    backgroundColor: colors.Zypsii_color,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.Zypsii_color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e0',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ChatScreen;