import React, { useState, useEffect, useRef, useCallback, ComponentProps } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Switch,
  Vibration,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../context/AuthContext";
import PerformanceService from "../services/performanceService";
import {
  Performance,
  UserPerformanceStats,
  RACE_CATEGORIES,
  RaceCategory,
  getPositionColor,
  getPositionIcon,
  getPositionLabel,
} from "../types/performance.types";
import {
  performanceStyles,
  THEME_COLORS,
  LAYOUT,
} from "../styles/screens/user/performanceStyles";   

const PerformancesScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth() || {};

  // State management
  const {userId: paramUserId} = useLocalSearchParams<{userId: string}>();
  const targetUserId = paramUserId ? Number(paramUserId) : user?.id;
  const isOwnProfile = !paramUserId || String(paramUserId) === String(user?.id);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [stats, setStats] = useState<UserPerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    RaceCategory | "all"
  >("all");
  const [fadeAnim] = useState(new Animated.Value(0));

  // ISOLATED: Performance preferences state
  const [performanceNotifications, setPerformanceNotifications] =
    useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [detailedAnalytics, setDetailedAnalytics] = useState(false);
  const [personalRecordAlerts, setPersonalRecordAlerts] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // ISOLATED: Separate timeout refs for each performance switch
  const performanceNotificationsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const autoSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detailedAnalyticsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const personalRecordAlertsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup function for performance switches
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (performanceNotificationsTimeoutRef.current) {
        clearTimeout(performanceNotificationsTimeoutRef.current);
      }
      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current);
      }
      if (detailedAnalyticsTimeoutRef.current) {
        clearTimeout(detailedAnalyticsTimeoutRef.current);
      }
      if (personalRecordAlertsTimeoutRef.current) {
        clearTimeout(personalRecordAlertsTimeoutRef.current);
      }
    };
  }, []);

  // ISOLATED: Success notification for performance settings
  const showPerformanceNotification = useCallback((message: string) => {
    if (!isMountedRef.current) return;
    Alert.alert("Performance Settings", message, [{ text: "OK" }]);
  }, []);

  // ISOLATED: Completely separate toggle handlers for each performance switch
  const handlePerformanceNotificationsToggle = useCallback(
    (value: boolean) => {
      if (!isMountedRef.current) return;

      if (performanceNotificationsTimeoutRef.current) {
        clearTimeout(performanceNotificationsTimeoutRef.current);
      }

      setPerformanceNotifications(value);
      Vibration.vibrate(30);

      performanceNotificationsTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          showPerformanceNotification(
            `Performance notifications ${value ? "enabled" : "disabled"}! 🏁`
          );
        }
      }, 100);
    },
    [showPerformanceNotification]
  );

  const handleAutoSyncToggle = useCallback(
    (value: boolean) => {
      if (!isMountedRef.current) return;

      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current);
      }

      setAutoSync(value);
      Vibration.vibrate(30);

      autoSyncTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          showPerformanceNotification(
            `Auto sync ${value ? "enabled" : "disabled"}! 🔄`
          );
        }
      }, 100);
    },
    [showPerformanceNotification]
  );

  const handleDetailedAnalyticsToggle = useCallback(
    (value: boolean) => {
      if (!isMountedRef.current) return;

      if (detailedAnalyticsTimeoutRef.current) {
        clearTimeout(detailedAnalyticsTimeoutRef.current);
      }

      setDetailedAnalytics(value);
      Vibration.vibrate(30);

      detailedAnalyticsTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          showPerformanceNotification(
            `Detailed analytics ${value ? "enabled" : "disabled"}! 📊`
          );
        }
      }, 100);
    },
    [showPerformanceNotification]
  );

  const handlePersonalRecordAlertsToggle = useCallback(
    (value: boolean) => {
      if (!isMountedRef.current) return;

      if (personalRecordAlertsTimeoutRef.current) {
        clearTimeout(personalRecordAlertsTimeoutRef.current);
      }

      setPersonalRecordAlerts(value);
      Vibration.vibrate(30);

      personalRecordAlertsTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          showPerformanceNotification(
            `Personal record alerts ${value ? "enabled" : "disabled"}! 🏆`
          );
        }
      }, 100);
    },
    [showPerformanceNotification]
  );

  // ISOLATED: Individual switch components for performance settings
  const PerformanceNotificationsSwitch = React.memo(() => {
    const switchAnim = useRef(
      new Animated.Value(performanceNotifications ? 1 : 0)
    ).current;
    const switchMountedRef = useRef(true);

    useEffect(() => {
      const animation = Animated.timing(switchAnim, {
        toValue: performanceNotifications ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      });
      animation.start();
      return () => {
        switchMountedRef.current = false;
        animation.stop();
      };
    }, [performanceNotifications]);

    useEffect(() => {
      return () => {
        switchMountedRef.current = false;
        switchAnim.stopAnimation();
      };
    }, []);

    return (
      <Switch
        value={performanceNotifications}
        onValueChange={handlePerformanceNotificationsToggle}
        trackColor={{ false: "#E5E7EB", true: THEME_COLORS.SUCCESS }}
        thumbColor={performanceNotifications ? "#FFFFFF" : "#9CA3AF"}
        style={{ transform: [{ scale: 0.9 }] }}
      />
    );
  });

  const AutoSyncSwitch = React.memo(() => {
    const switchAnim = useRef(new Animated.Value(autoSync ? 1 : 0)).current;
    const switchMountedRef = useRef(true);

    useEffect(() => {
      const animation = Animated.timing(switchAnim, {
        toValue: autoSync ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      });
      animation.start();
      return () => {
        switchMountedRef.current = false;
        animation.stop();
      };
    }, [autoSync]);

    useEffect(() => {
      return () => {
        switchMountedRef.current = false;
        switchAnim.stopAnimation();
      };
    }, []);

    return (
      <Switch
        value={autoSync}
        onValueChange={handleAutoSyncToggle}
        trackColor={{ false: "#E5E7EB", true: THEME_COLORS.INFO }}
        thumbColor={autoSync ? "#FFFFFF" : "#9CA3AF"}
        style={{ transform: [{ scale: 0.9 }] }}
      />
    );
  });

  const DetailedAnalyticsSwitch = React.memo(() => {
    const switchAnim = useRef(
      new Animated.Value(detailedAnalytics ? 1 : 0)
    ).current;
    const switchMountedRef = useRef(true);

    useEffect(() => {
      const animation = Animated.timing(switchAnim, {
        toValue: detailedAnalytics ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      });
      animation.start();
      return () => {
        switchMountedRef.current = false;
        animation.stop();
      };
    }, [detailedAnalytics]);

    useEffect(() => {
      return () => {
        switchMountedRef.current = false;
        switchAnim.stopAnimation();
      };
    }, []);

    return (
      <Switch
        value={detailedAnalytics}
        onValueChange={handleDetailedAnalyticsToggle}
        trackColor={{ false: "#E5E7EB", true: THEME_COLORS.WARNING }}
        thumbColor={detailedAnalytics ? "#FFFFFF" : "#9CA3AF"}
        style={{ transform: [{ scale: 0.9 }] }}
      />
    );
  });

  const PersonalRecordAlertsSwitch = React.memo(() => {
    const switchAnim = useRef(
      new Animated.Value(personalRecordAlerts ? 1 : 0)
    ).current;
    const switchMountedRef = useRef(true);

    useEffect(() => {
      const animation = Animated.timing(switchAnim, {
        toValue: personalRecordAlerts ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      });
      animation.start();
      return () => {
        switchMountedRef.current = false;
        animation.stop();
      };
    }, [personalRecordAlerts]);

    useEffect(() => {
      return () => {
        switchMountedRef.current = false;
        switchAnim.stopAnimation();
      };
    }, []);

    return (
      <Switch
        value={personalRecordAlerts}
        onValueChange={handlePersonalRecordAlertsToggle}
        trackColor={{ false: "#E5E7EB", true: THEME_COLORS.VICTORY_GOLD }}
        thumbColor={personalRecordAlerts ? "#FFFFFF" : "#9CA3AF"}
        style={{ transform: [{ scale: 0.9 }] }}
      />
    );
  });

  PerformanceNotificationsSwitch.displayName = "PerformanceNotificationsSwitch";
  AutoSyncSwitch.displayName = "AutoSyncSwitch";
  DetailedAnalyticsSwitch.displayName = "DetailedAnalyticsSwitch";
  PersonalRecordAlertsSwitch.displayName = "PersonalRecordAlertsSwitch";

  /**
   * Load performances and statistics
   */
  const loadData = React.useCallback(async () => {
    if (!targetUserId) return;
    try {
      setIsLoading(true);

      const [performancesResponse, statsResponse] = await Promise.all([
        PerformanceService.getUserPerformances(
          targetUserId,
          selectedCategory !== "all" ? { category: selectedCategory } : {}
        ),
        PerformanceService.getUserStats(targetUserId),
      ]);

      if (performancesResponse.success && performancesResponse.data) {
        setPerformances(performancesResponse.data);
      } else {
        showError("Failed to load your race data");
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        showError("Failed to load your statistics");
      }
    } catch {
      showError("Unable to load your racing data");
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, selectedCategory]);

  /**
   * Load performances only (for filter changes)
   */
  const loadPerformances = React.useCallback(async () => {
    if (!targetUserId) return;

    try {
      const response = await PerformanceService.getUserPerformances(
        targetUserId,
        selectedCategory !== "all" ? { category: selectedCategory } : {}
      );

      if (response.success && response.data) {
        setPerformances(response.data);
      }
    } catch {
      // Silently fail for filter changes
    }
  }, [targetUserId, selectedCategory]);

  // Load data on component mount and when returning to screen
  useEffect(() => {
    if (targetUserId) {
      loadData();
      // Animate screen entrance
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [user?.id, loadData, fadeAnim]);

  // Load data when category filter changes
  useEffect(() => {
    if (user?.id && !isLoading) {
      loadPerformances();
    }
  }, [selectedCategory, user?.id, isLoading, loadPerformances]);

  /**
   * Refresh data
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  /**
   * Handle category filter change
   */
  const handleCategoryChange = (category: RaceCategory | "all") => {
    if (category === selectedCategory) return;
    setSelectedCategory(category);
  };

  /**
   * Navigate to add performance screen
   */
  const handleAddPerformance = () => {
    router.push("/addPerformance");
  };

  /**
   * Show error alert
   */
  const showError = (message: string) => {
    Alert.alert("Error", message);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /**
   * Render hero section with stats
   */
  const renderHero = () => {
    if (!stats) return null;

    return (
      <Animated.View
        style={[performanceStyles.heroSection, { opacity: fadeAnim }]}
      >
        <LinearGradient
          colors={[
            THEME_COLORS.RACING_GRADIENT_START,
            THEME_COLORS.RACING_GRADIENT_END,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={performanceStyles.heroGradient}
        >
          <Text style={performanceStyles.heroTitle}>Racing Dashboard</Text>
          <Text style={performanceStyles.heroSubtitle}>
            Track your progress and celebrate your achievements on the track
          </Text>

          <View style={performanceStyles.heroStats}>
            <View style={performanceStyles.heroStatItem}>
              <Text style={performanceStyles.heroStatValue}>
                {stats.totalRaces}
              </Text>
              <Text style={performanceStyles.heroStatLabel}>Total Races</Text>
            </View>
            <View style={performanceStyles.heroStatItem}>
              <Text style={performanceStyles.heroStatValue}>
                {stats.bestPosition > 0
                  ? `${stats.bestPosition}${getOrdinalSuffix(
                      stats.bestPosition
                    )}`
                  : "-"}
              </Text>
              <Text style={performanceStyles.heroStatLabel}>Best Finish</Text>
            </View>
            <View style={performanceStyles.heroStatItem}>
              <Text style={performanceStyles.heroStatValue}>
                {stats.averagePosition > 0
                  ? stats.averagePosition.toFixed(1)
                  : "-"}
              </Text>
              <Text style={performanceStyles.heroStatLabel}>Avg Position</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  /**
   * Render stats cards
   */
  const renderStatsCards = () => {
    if (!stats || stats.totalRaces === 0) return null;

    const podiumRate =
      stats.totalRaces > 0
        ? (((stats.podiumFinishes || 0) / stats.totalRaces) * 100).toFixed(0)
        : "0";
    const winRate =
      stats.totalRaces > 0
        ? (((stats.wins || 0) / stats.totalRaces) * 100).toFixed(0)
        : "0";

    return (
      <View style={performanceStyles.statsContainer}>
        <View style={performanceStyles.statsGrid}>
          <View style={performanceStyles.statsCard}>
            <FontAwesome
              name="trophy"
              size={20}
              color={THEME_COLORS.VICTORY_GOLD}
              style={performanceStyles.statsIcon}
            />
            <Text style={performanceStyles.statsValue}>{stats.wins || 0}</Text>
            <Text style={performanceStyles.statsLabel}>Victories</Text>
          </View>

          <View style={performanceStyles.statsCard}>
            <FontAwesome
              name="certificate"
              size={20}
              color={THEME_COLORS.PODIUM_BRONZE}
              style={performanceStyles.statsIcon}
            />
            <Text style={performanceStyles.statsValue}>
              {stats.podiumFinishes || 0}
            </Text>
            <Text style={performanceStyles.statsLabel}>Podiums</Text>
          </View>
        </View>

        <View style={performanceStyles.statsGrid}>
          <View style={performanceStyles.statsCard}>
            <FontAwesome
              name="percent"
              size={20}
              color={THEME_COLORS.SUCCESS}
              style={performanceStyles.statsIcon}
            />
            <Text style={performanceStyles.statsValue}>{winRate}%</Text>
            <Text style={performanceStyles.statsLabel}>Win Rate</Text>
          </View>

          <View style={performanceStyles.statsCard}>
            <FontAwesome
              name="line-chart"
              size={20}
              color={THEME_COLORS.INFO}
              style={performanceStyles.statsIcon}
            />
            <Text style={performanceStyles.statsValue}>{podiumRate}%</Text>
            <Text style={performanceStyles.statsLabel}>Podium Rate</Text>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render category filters
   */
  const renderFilters = () => {
    const categories: (RaceCategory | "all")[] = [
      "all",
      ...RACE_CATEGORIES.map((cat) => cat.value),
    ];

    return (
      <View style={performanceStyles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={performanceStyles.filtersList}
        >
          {categories.map((category) => {
            const categoryData =
              category === "all"
                ? {
                    label: "All Races",
                    color: THEME_COLORS.PRIMARY,

                  }
                : RACE_CATEGORIES.find((cat) => cat.value === category);

            if (!categoryData) return null;

            const isActive = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                style={[
                  performanceStyles.filterChip,
                  isActive && performanceStyles.filterChipActive,
                  isActive && { backgroundColor: categoryData.color },
                ]}
                onPress={() => handleCategoryChange(category)}
              >
                <Text style={performanceStyles.filterChipText}>
                  {categoryData.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  /**
   * Render individual performance card
   */
  const renderPerformanceCard = (performance: Performance, index: number) => {
    const positionColor = getPositionColor(performance.racePosition);
    const positionIcon = getPositionIcon(performance.racePosition);
    const positionLabel = getPositionLabel(
      performance.racePosition,
      performance.totalParticipants
    );

    const categoryData = RACE_CATEGORIES.find(
      (cat) => cat.value === performance.category
    );

    return (
      <Animated.View
        key={performance.id}
        style={[
          performanceStyles.performanceCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={performanceStyles.performanceHeader}>
          <View style={{ flex: 1 }}>
            <Text style={performanceStyles.performanceTitle}>
              {performance.circuitName}
            </Text>
            <Text style={performanceStyles.performanceDate}>
              {formatDate(performance.date)}
            </Text>
          </View>
        </View>

        <View style={performanceStyles.performanceDetails}>
          <View style={performanceStyles.performanceRow}>
            <View style={performanceStyles.performanceMetric}>
              <View style={performanceStyles.metricIcon}>
                <FontAwesome name={positionIcon as ComponentProps<typeof FontAwesome>['name']} size={20} color={positionColor} />              </View>
                <Text style={performanceStyles.metricLabel}>Position</Text>
                <Text
                  style={[
                    performanceStyles.positionValue,
                    { color: positionColor },
                  ]}
                >
                {positionLabel}
              </Text>
            </View>
          </View>

          <View style={performanceStyles.performanceRow}>
            <View style={performanceStyles.performanceMetric}>
              <View style={performanceStyles.metricIcon}>
                <FontAwesome
                  name="clock-o"
                  size={16}
                  color={THEME_COLORS.PRIMARY}
                />
              </View>
              <Text style={performanceStyles.metricLabel}>Lap Time</Text>
              <Text style={performanceStyles.lapTimeValue}>
                {performance.lapTime}
              </Text>
            </View>
          </View>

          <View style={performanceStyles.performanceRow}>
            <View style={performanceStyles.performanceMetric}>
              <View style={performanceStyles.metricIcon}>
                <FontAwesome name="flag-checkered" size={16} color={THEME_COLORS.PRIMARY} />        
              </View>
              <Text style={performanceStyles.metricLabel}>Category</Text>
              <Text style={performanceStyles.metricValue}>
                {categoryData?.label || performance.category}
              </Text>
            </View>
          </View>

          {performance.notes && (
            <View style={performanceStyles.notesContainer}>
                <FontAwesome name="comment-o" size={16} color={THEME_COLORS.TEXT_SECONDARY} />      
              <Text style={performanceStyles.notesText}>
                💭 {performance.notes}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    return (
      <View style={performanceStyles.emptyContainer}>
        <FontAwesome
          name="trophy"
          size={80}
          color={THEME_COLORS.TEXT_MUTED}
          style={performanceStyles.emptyIcon}
        />
        <Text style={performanceStyles.emptyTitle}>No Race Data Yet</Text>
        <Text style={performanceStyles.emptySubtitle}>
          Start tracking your racing performance and see your progress over
          time. Every lap counts on your journey to the podium!
        </Text>
        {isOwnProfile &&
        <TouchableOpacity
          style={performanceStyles.primaryButton}
          onPress={handleAddPerformance}
        >
          <FontAwesome name="plus" size={16} color="#FFFFFF" />
          <Text style={performanceStyles.primaryButtonText}>
            Add First Race
          </Text>
        </TouchableOpacity>
      }
        </View>
    );
  };

  /**
   * Helper function for ordinal suffixes
   */
  const getOrdinalSuffix = (num: number): string => {
    const suffix =
      num === 1 ? "st" : num === 2 ? "nd" : num === 3 ? "rd" : "th";
    return suffix;
  };

  /**
   * Render performance settings panel
   */
  const renderPerformanceSettings = () => {
    if (!showSettingsPanel) return null;

    return (
      <Animated.View
        style={{
          backgroundColor: "#F9FAFB",
          marginHorizontal: LAYOUT.SPACING_MD,
          marginBottom: LAYOUT.SPACING_MD,
          borderRadius: 12,
          padding: LAYOUT.SPACING_MD,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: LAYOUT.SPACING_MD,
          }}
        >
          <FontAwesome name="cog" size={20} color={THEME_COLORS.PRIMARY} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: THEME_COLORS.TEXT_PRIMARY,
              marginLeft: 8,
            }}
          >
            Performance Settings
          </Text>
        </View>

        {/* Performance Notifications */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                color: THEME_COLORS.TEXT_PRIMARY,
                fontWeight: "500",
              }}
            >
              🏁 Performance Notifications
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: THEME_COLORS.TEXT_SECONDARY,
                marginTop: 2,
              }}
            >
              Get notified about race updates
            </Text>
          </View>
          <PerformanceNotificationsSwitch />
        </View>

        {/* Auto Sync */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                color: THEME_COLORS.TEXT_PRIMARY,
                fontWeight: "500",
              }}
            >
              🔄 Auto Sync
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: THEME_COLORS.TEXT_SECONDARY,
                marginTop: 2,
              }}
            >
              Automatically sync race data
            </Text>
          </View>
          <AutoSyncSwitch />
        </View>

        {/* Detailed Analytics */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                color: THEME_COLORS.TEXT_PRIMARY,
                fontWeight: "500",
              }}
            >
              📊 Detailed Analytics
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: THEME_COLORS.TEXT_SECONDARY,
                marginTop: 2,
              }}
            >
              Show advanced performance metrics
            </Text>
          </View>
          <DetailedAnalyticsSwitch />
        </View>

        {/* Personal Record Alerts */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                color: THEME_COLORS.TEXT_PRIMARY,
                fontWeight: "500",
              }}
            >
              🏆 Personal Record Alerts
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: THEME_COLORS.TEXT_SECONDARY,
                marginTop: 2,
              }}
            >
              Get notified when you set new records
            </Text>
          </View>
          <PersonalRecordAlertsSwitch />
        </View>
      </Animated.View>
    );
  };

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={performanceStyles.safeArea}>
        <View style={performanceStyles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLORS.PRIMARY} />
          <Text style={performanceStyles.loadingText}>
            Loading your racing data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={performanceStyles.container}>
      {/* Header */}
      <View style={performanceStyles.header}>
        <TouchableOpacity
          style={performanceStyles.headerButton}
          onPress={() => router.back()}
        >
          <FontAwesome
            name="arrow-left"
            size={20}
            color={THEME_COLORS.TEXT_PRIMARY}
          />
        </TouchableOpacity>

        <Text style={performanceStyles.headerTitle}>Performance Tracker</Text>

        <View style={{ flexDirection: "row" }}>
          {/* <TouchableOpacity
            style={[performanceStyles.headerButton, { marginRight: 8 }]}
            onPress={() => setShowSettingsPanel(!showSettingsPanel)}
          >
            <FontAwesome
              name="cog"
              size={20}
              color={
                showSettingsPanel
                  ? THEME_COLORS.PRIMARY
                  : THEME_COLORS.TEXT_SECONDARY
              }
            />
          </TouchableOpacity> */}

          {isOwnProfile &&
          <TouchableOpacity
            style={performanceStyles.headerButton}
            onPress={handleAddPerformance}
          >
            <FontAwesome name="plus" size={20} color={THEME_COLORS.PRIMARY} />
          </TouchableOpacity>
          }
        </View>
      </View>

      <ScrollView
        style={performanceStyles.scrollContainer}
        contentContainerStyle={performanceStyles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[THEME_COLORS.PRIMARY]}
            tintColor={THEME_COLORS.PRIMARY}
          />
        }
      >
        {/* Hero Section */}
        {renderHero()}

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Category Filters */}
        {renderFilters()}

        {/* Performance List */}
        <View style={{ paddingHorizontal: 0 }}>
          {performances.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <View
                style={{
                  paddingHorizontal: LAYOUT.SPACING_MD,
                  marginBottom: LAYOUT.SPACING_MD,
                }}
              >
                <Text style={performanceStyles.headerTitle}>
                  {selectedCategory === "all"
                    ? `All Races (${performances.length})`
                    : `${
                        RACE_CATEGORIES.find(
                          (cat) => cat.value === selectedCategory
                        )?.label || selectedCategory
                      } (${performances.length})`}
                </Text>
              </View>
              {performances.map((performance, index) =>
                renderPerformanceCard(performance, index)
              )}
            </>
          )}
        </View>

        {/* Performance Settings */}
        {renderPerformanceSettings()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PerformancesScreen;
