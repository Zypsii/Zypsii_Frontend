import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';

const SplitTabBar = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'participants' && styles.activeTab]}
        onPress={() => onTabPress('participants')}
      >
        <Ionicons 
          name="people-outline" 
          size={20} 
          color={activeTab === 'participants' ? colors.btncolor : colors.fontSecondColor} 
        />
        <Text style={[styles.tabText, activeTab === 'participants' && styles.activeTabText]}>
          Participants
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
        onPress={() => onTabPress('expenses')}
      >
        <Ionicons 
          name="receipt-outline" 
          size={20} 
          color={activeTab === 'expenses' ? colors.btncolor : colors.fontSecondColor} 
        />
        <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
          Expenses
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'balance' && styles.activeTab]}
        onPress={() => onTabPress('balance')}
      >
        <Ionicons 
          name="wallet-outline" 
          size={20} 
          color={activeTab === 'balance' ? colors.btncolor : colors.fontSecondColor} 
        />
        <Text style={[styles.tabText, activeTab === 'balance' && styles.activeTabText]}>
          Balance
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 8,
  },
  activeTab: {
    borderBottomColor: colors.btncolor,
    backgroundColor: colors.grayBackground,
    borderRadius: 8,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  activeTabText: {
    color: colors.btncolor,
    fontWeight: '600',
  },
});

export default SplitTabBar; 