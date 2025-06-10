import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../utils';

const ParticipantsSection = ({ participants, loadingParticipants }) => {
  if (loadingParticipants) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.btncolor} />
      </View>
    );
  }

  if (!participants.data || !participants.data.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No participants found</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={participants.data}
      renderItem={({ item }) => (
        <View style={styles.participantItem}>
          <View style={styles.participantInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {item.memberId.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.participantDetails}>
              <Text style={styles.participantName}>{item.memberId.fullName}</Text>
              <Text style={styles.participantContact}>{item.memberId.email}</Text>
            </View>
          </View>
        </View>
      )}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    borderRadius: 8,
    marginBottom: 8,
  },
  participantInfo: {
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  participantContact: {
    fontSize: 12,
    color: colors.fontSecondColor,
  },
});

export default ParticipantsSection; 