import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { colors } from '../../utils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PostDetail = ({ route, navigation }) => {
  const { post } = route.params;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Blur Effect */}
      <ImageBackground
        source={{ uri: post.imageUrl?.[0] }}
        style={styles.headerBackground}
        blurRadius={10}
      >
        <View style={styles.headerOverlay}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Details</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Feather name="more-vertical" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <ScrollView style={styles.scrollView} bounces={false}>
        {/* Post Image with Gradient Overlay */}
        {post.imageUrl && post.imageUrl.length > 0 && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: post.imageUrl[0] }}
              style={styles.postImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay} />
          </View>
        )}

        {/* Post Content */}
        <View style={styles.contentContainer}>
          {/* Title and Post Type */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{post.postTitle}</Text>
            <View style={styles.postTypeBadge}>
              <MaterialIcons name="public" size={14} color="#870E6B" />
              <Text style={styles.postTypeText}>{post.postType || 'Public'}</Text>
            </View>
          </View>

          {/* Post Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialIcons name="favorite" size={24} color="#870E6B" />
              <Text style={styles.statText}>{post.likes || '0'}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="comment" size={24} color="#870E6B" />
              <Text style={styles.statText}>{post.comments || '0'}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="share" size={24} color="#870E6B" />
              <Text style={styles.statText}>{post.shares || '0'}</Text>
            </View>
          </View>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.map((tag, index) => (
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Date and Author */}
          <View style={styles.metaContainer}>
            <View style={styles.dateContainer}>
              <MaterialIcons name="access-time" size={16} color="#666" />
              <Text style={styles.dateText}>
                Posted on {new Date(post.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.authorContainer}>
              <MaterialIcons name="person" size={16} color="#666" />
              <Text style={styles.authorText}>By User</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    height: 100,
    width: '100%',
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight + 10,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 8,
  },
  moreButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth,
    height: screenWidth,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundGradient: {
      colors: ['transparent', 'rgba(0,0,0,0.3)'],
    },
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8E8F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  postTypeText: {
    color: '#870E6B',
    fontSize: 12,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tagItem: {
    backgroundColor: '#F8E8F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#870E6B',
    fontSize: 12,
    fontWeight: '500',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default PostDetail; 