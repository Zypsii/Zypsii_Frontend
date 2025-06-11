import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, scale } from '../../utils';

const { width } = Dimensions.get('window');

const faqCategories = [
  {
    id: 'travel',
    title: 'Travel Planning',
    questions: [
      {
        id: 1,
        question: "How do I create a travel schedule?",
        answer: "To create a travel schedule:\n1. Go to 'Schedule' tab\n2. Click 'Create New Schedule'\n3. Select your destination\n4. Choose dates\n5. Add activities\n6. Save your schedule"
      },
      {
        id: 2,
        question: "How do I find best places to visit?",
        answer: "You can find best places by:\n1. Checking 'Best Destination' section\n2. Using 'Discover by Interest'\n3. Exploring 'Discover by Nearest'\n4. Viewing popular destinations in 'All Destination'"
      },
      {
        id: 3,
        question: "How do I share my travel plans?",
        answer: "To share your travel plans:\n1. Open your schedule\n2. Click the share icon\n3. Choose sharing method\n4. Select contacts to share with"
      }
    ]
  },
  {
    id: 'companions',
    title: 'Travel Companions',
    questions: [
      {
        id: 4,
        question: "How do I find travel companions?",
        answer: "To find travel companions:\n1. Create a public schedule\n2. Enable 'Find Companions' option\n3. View and accept companion requests\n4. Chat with potential companions"
      },
      {
        id: 5,
        question: "How do I manage companion requests?",
        answer: "To manage companion requests:\n1. Go to 'Companions' tab\n2. View pending requests\n3. Accept or decline requests\n4. Message accepted companions"
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Settings',
    questions: [
      {
        id: 6,
        question: "How do I update my profile?",
        answer: "To update your profile:\n1. Go to 'Profile' tab\n2. Click 'Edit Profile'\n3. Update your information\n4. Save changes"
      },
      {
        id: 7,
        question: "How do I change notification settings?",
        answer: "To change notifications:\n1. Go to 'Settings'\n2. Select 'Notifications'\n3. Toggle desired notifications\n4. Save preferences"
      }
    ]
  },
  {
    id: 'features',
    title: 'App Features',
    questions: [
      {
        id: 8,
        question: "How do I use the map feature?",
        answer: "To use the map:\n1. Open 'Discover' tab\n2. Click map icon\n3. View nearby places\n4. Get directions to locations"
      },
      {
        id: 9,
        question: "How do I save favorite places?",
        answer: "To save favorites:\n1. Find a place you like\n2. Click the heart icon\n3. View saved places in 'Favorites'\n4. Access them anytime"
      }
    ]
  }
];

const ChatSupport = ({ visible, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [customQuestion, setCustomQuestion] = useState('');

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedQuestion(null);
  };

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedQuestion(null);
  };

  const handleBackToQuestions = () => {
    setSelectedQuestion(null);
  };

  const handleSendCustomQuestion = () => {
    if (customQuestion.trim()) {
      setSelectedQuestion({
        id: 'custom',
        question: customQuestion,
        answer: "Thank you for your question. Our support team will get back to you shortly."
      });
      setCustomQuestion('');
    }
  };

  const renderContent = () => {
    if (selectedQuestion) {
      return (
        <View style={styles.messageContainer}>
          <View style={styles.questionBubble}>
            <Text style={styles.questionText}>{selectedQuestion.question}</Text>
          </View>
          <View style={styles.answerBubble}>
            <Text style={styles.answerText}>{selectedQuestion.answer}</Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToQuestions}
          >
            <Text style={styles.backButtonText}>Back to Questions</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (selectedCategory) {
      return (
        <View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToCategories}
          >
            <Text style={styles.backButtonText}>Back to Categories</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>{selectedCategory.title}</Text>
          {selectedCategory.questions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.questionItem}
              onPress={() => handleQuestionSelect(item)}
            >
              <Text style={styles.questionItemText}>{item.question}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <>
        <Text style={styles.sectionTitle}>How can we help you?</Text>
        {faqCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryItem}
            onPress={() => handleCategorySelect(category)}
          >
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.fontMainColor} />
          </TouchableOpacity>
        ))}
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Travel Support</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={20} color={colors.fontMainColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chatContainer}>
            {renderContent()}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your question here..."
              value={customQuestion}
              onChangeText={setCustomQuestion}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendCustomQuestion}
            >
              <MaterialIcons name="send" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: '60%',
    padding: scale(10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
    paddingHorizontal: scale(5),
  },
  headerText: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  closeButton: {
    padding: scale(5),
  },
  chatContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: 'bold',
    marginBottom: scale(10),
    color: colors.fontMainColor,
    paddingHorizontal: scale(5),
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.grayBackground,
    padding: scale(12),
    borderRadius: 8,
    marginBottom: scale(8),
    marginHorizontal: scale(5),
  },
  categoryTitle: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.fontMainColor,
  },
  questionItem: {
    backgroundColor: colors.grayBackground,
    padding: scale(10),
    borderRadius: 8,
    marginBottom: scale(8),
    marginHorizontal: scale(5),
  },
  questionItemText: {
    fontSize: scale(12),
    color: colors.fontMainColor,
  },
  messageContainer: {
    padding: scale(5),
  },
  questionBubble: {
    backgroundColor: colors.grayBackground,
    padding: scale(10),
    borderRadius: 8,
    marginBottom: scale(8),
    alignSelf: 'flex-start',
    maxWidth: width * 0.8,
  },
  answerBubble: {
    backgroundColor: colors.btncolor,
    padding: scale(10),
    borderRadius: 8,
    marginBottom: scale(8),
    alignSelf: 'flex-end',
    maxWidth: width * 0.8,
  },
  questionText: {
    color: colors.fontMainColor,
    fontSize: scale(12),
  },
  answerText: {
    color: colors.white,
    fontSize: scale(12),
  },
  backButton: {
    backgroundColor: colors.grayBackground,
    padding: scale(8),
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: scale(8),
    marginBottom: scale(10),
  },
  backButtonText: {
    color: colors.fontMainColor,
    fontSize: scale(11),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(8),
    paddingHorizontal: scale(5),
  },
  input: {
    flex: 1,
    backgroundColor: colors.grayBackground,
    borderRadius: 15,
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    marginRight: scale(8),
    fontSize: scale(12),
  },
  sendButton: {
    backgroundColor: colors.btncolor,
    width: scale(35),
    height: scale(35),
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatSupport; 