import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSplits } from '../../redux/slices/splitSlice';

const { width } = Dimensions.get('window');

function SplitDashboard() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { splits, splitsLoading, splitsError } = useSelector((state) => state.split);

  useEffect(() => {
    dispatch(fetchSplits({ page: 1, limit: 10 }));
  }, [dispatch]);

  const handleSplitPress = (split) => {
    navigation.navigate('SplitDetail', { split });
  };

  const renderSplitItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.splitItem,
        { transform: [{ scale: 1 }] },
        index === 0 && styles.firstItem
      ]}
      onPress={() => handleSplitPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.splitCardContent}>
        <View style={styles.splitIconContainer}>
          <Ionicons 
            name="receipt-outline" 
            size={24} 
            color={colors.btncolor} 
          />
        </View>
        
        <View style={styles.splitInfo}>
          <Text style={styles.splitTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.splitMeta}>
            <Text style={styles.splitAmount}>
                              ₹{Math.round(item.totalSplitAmount || 0)}
            </Text>
            {/* <View style={styles.splitBadge}>
              <Text style={styles.splitBadgeText}>
                {item.participants?.length || 0} members
              </Text>
            </View> */}
          </View>
        </View>
        
        <View style={styles.chevronContainer}>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={colors.fontSecondColor} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (splitsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={colors.btncolor} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.btncolor} />
            <Text style={styles.loadingText}>Loading your splits...</Text>
            <Text style={styles.loadingSubText}>Please wait a moment</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (splitsError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={colors.btncolor} barStyle="light-content" />
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="cloud-offline-outline" size={64} color={colors.error} />
            </View>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorText}>{splitsError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => dispatch(fetchSplits({ page: 1, limit: 10 }))}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color={colors.white} style={styles.retryIcon} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.btncolor} barStyle="light-content" />
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>My Splits</Text>
            <Text style={styles.headerSubtitle}>
              {splits?.length || 0} active {splits?.length === 1 ? 'split' : 'splits'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateSplit')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced List */}
      <FlatList
        data={splits}
        renderItem={renderSplitItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={80} color={colors.grayLinesColor} />
              </View>
              <Text style={styles.emptyTitle}>No splits yet</Text>
              <Text style={styles.emptyText}>
                Create your first split to start tracking shared expenses with friends
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => navigation.navigate('CreateSplit')}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color={colors.white} style={styles.createFirstIcon} />
                <Text style={styles.createFirstButtonText}>Create Your First Split</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Header Styles
  header: {
    backgroundColor: colors.btncolor,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: colors.btncolor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '400',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // List Styles
  listContainer: {
    padding: 20,
    paddingTop: 24,
  },
  splitItem: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  firstItem: {
    marginTop: 0,
  },
  splitCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  splitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.btncolor}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  splitInfo: {
    flex: 1,
  },
  splitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  splitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.btncolor,
  },
  splitBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  splitBadgeText: {
    fontSize: 12,
    color: colors.fontSecondColor,
    fontWeight: '500',
  },
  chevronContainer: {
    marginLeft: 12,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: colors.white,
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: width * 0.8,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: colors.fontMainColor,
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.fontSecondColor,
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: colors.white,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: width * 0.85,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.fontMainColor,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.btncolor,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.btncolor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyCard: {
    backgroundColor: colors.white,
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    width: width * 0.85,
  },
  emptyIconContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.fontMainColor,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.btncolor,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: colors.btncolor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  createFirstIcon: {
    marginRight: 8,
  },
  createFirstButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default SplitDashboard;