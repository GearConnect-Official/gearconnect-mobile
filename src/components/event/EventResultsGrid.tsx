import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getPositionColor, Performance } from '@/types/performance.types';
import { eventResultsGridStyles } from '@/styles/components/EventResults';

const styles = eventResultsGridStyles;

interface EventResultsGridProps {
  performances: Performance[];
  loading?: boolean;
}

interface PerformanceWithUser extends Performance {
  userName?: string;
  userAvatar?: string;
}

const EventResultsGrid: React.FC<EventResultsGridProps> = ({ performances, loading = false }) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleProfilePress = (userId?: number) => {
    if (userId) {
      router.push({
        pathname: '/userProfile',
        params: { userId: userId.toString() },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  // Sort performances by race position
  const sortedPerformances = performances ? [...performances].sort((a, b) => a.racePosition - b.racePosition) : [];
  const allPerformances = sortedPerformances;

  // Get top 3 for podium (always show 3 slots, even if empty)
  const topThree: (PerformanceWithUser | null)[] = [
    allPerformances[0] || null,
    allPerformances[1] || null,
    allPerformances[2] || null,
  ];

  // Get rest for pagination
  const rest = allPerformances.slice(3);
  const totalPages = Math.ceil(rest.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageResults = rest.slice(startIndex, endIndex);

  const getPodiumHeight = (position: number) => {
    if (position === 1) return 120; // Highest
    if (position === 2) return 90;  // Middle
    return 70; // Lowest
  };

  const getPodiumColor = (position: number) => {
    if (position === 1) return '#FFD700'; // Gold
    if (position === 2) return '#C0C0C0'; // Silver
    return '#CD7F32'; // Bronze
  };

  const renderPodiumSlot = (position: number, performance: PerformanceWithUser | null) => {
    const isPlaceholder = !performance;
    const height = getPodiumHeight(position);
    const color = getPodiumColor(position);
    
    return (
      <View style={styles.podiumItem} key={position}>
        {/* Avatar above the podium */}
        <TouchableOpacity
          style={styles.podiumAvatarContainer}
          onPress={() => !isPlaceholder && handleProfilePress(performance.userId)}
          disabled={isPlaceholder}
          activeOpacity={0.7}
        >
          <View style={styles.podiumAvatar}>
            {isPlaceholder ? (
              <FontAwesome name="user" size={24} color="rgba(0, 0, 0, 0.3)" />
            ) : performance.userAvatar ? (
              <Image 
                source={{ uri: performance.userAvatar }} 
                style={styles.podiumAvatarImage}
              />
            ) : (
              <FontAwesome name="user" size={24} color="#666" />
            )}
          </View>
        </TouchableOpacity>
        
        {/* Podium box with number and name */}
        <View style={[styles.podiumBase, { height, backgroundColor: color }]}>
          <Text style={styles.podiumNumber}>{position}</Text>
          <Text style={styles.podiumName} numberOfLines={1}>
            {isPlaceholder ? '—' : (performance.userName || `User ${performance.userId}`)}
          </Text>
        </View>
        
        {/* Time below the podium */}
        <Text style={styles.podiumTime}>
          {isPlaceholder ? '—:—.———' : performance.lapTime}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Results</Text>

      {/* Podium Section - Always show 3 slots */}
      <View style={styles.podiumContainer}>
        {/* Second Place */}
        {renderPodiumSlot(2, topThree[1])}
        
        {/* First Place */}
        {renderPodiumSlot(1, topThree[0])}
        
        {/* Third Place */}
        {renderPodiumSlot(3, topThree[2])}
      </View>

      {/* Table Section for remaining positions (4th and beyond) - Always show */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: 50 }]}>Pos</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Name</Text>
          <Text style={[styles.tableHeaderText, { width: 100 }]}>Lap Time</Text>
        </View>
        
        {rest.length > 0 ? (
          <>
            <ScrollView>
              {currentPageResults.map((performance) => {
                const positionColor = getPositionColor(performance.racePosition);
                const perfWithUser = performance as PerformanceWithUser;
                
                return (
                  <View key={performance.id} style={styles.tableRow}>
                    <View style={[styles.positionCell, { backgroundColor: `${positionColor}20` }]}>
                      <View style={styles.flagContainer}>
                        <FontAwesome name="flag" size={16} color={positionColor} />
                        <Text style={[styles.positionText, { color: positionColor, marginLeft: 4 }]}>
                          {performance.racePosition}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.tableCell, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}
                      onPress={() => handleProfilePress(performance.userId)}
                      activeOpacity={0.7}
                    >
                      {perfWithUser.userAvatar ? (
                        <Image 
                          source={{ uri: perfWithUser.userAvatar }} 
                          style={styles.tableAvatar}
                        />
                      ) : (
                        <View style={[styles.tableAvatar, styles.tableAvatarPlaceholder]}>
                          <FontAwesome name="user" size={12} color="#999" />
                        </View>
                      )}
                      <Text style={styles.tableCellText} numberOfLines={1}>
                        {perfWithUser.userName || `User ${performance.userId}`}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.tableCell, { width: 100, fontFamily: 'monospace' }]}>
                      {performance.lapTime}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                  onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <FontAwesome name="chevron-left" size={14} color={currentPage === 1 ? "#ccc" : "#E10600"} />
                </TouchableOpacity>
                
                <Text style={styles.paginationText}>
                  {startIndex + 1}-{Math.min(endIndex, rest.length)} of {rest.length}
                </Text>
                
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                  onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <FontAwesome name="chevron-right" size={14} color={currentPage === totalPages ? "#ccc" : "#E10600"} />
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyTableMessage}>
            <FontAwesome name="table" size={32} color="#ccc" />
            <Text style={styles.emptyTableText}>
              Results for positions 4 and beyond will be displayed here
            </Text>
          </View>
        )}
      </View>

      {/* If no results at all */}
      {sortedPerformances.length === 0 && (
        <Text style={styles.emptyText}>No results available yet</Text>
      )}
    </View>
  );
};

export default EventResultsGrid;
