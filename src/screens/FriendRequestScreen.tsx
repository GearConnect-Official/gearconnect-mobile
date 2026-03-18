import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import AddFriendModal from "@/components/modals/AddFriendModal";
import styles from "@/styles/screens/social/friendRequestStyles";

// Racing color palette inspired by automotive and racing world
const THEME_COLORS = {
  primary: "#E10600", // Racing Red
  secondary: "#1E1E1E", // Racing Black
  tertiary: "#2D9CDB", // Accent Blue
  background: "#FFFFFF",
  card: "#F2F2F2",
  cardLight: "#F8F8F8",
  textPrimary: "#1E1E1E",
  textSecondary: "#6E6E6E",
  border: "#E0E0E0",
};

const FriendsScreen: React.FC = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");
  const [isAddFriendModalVisible, setIsAddFriendModalVisible] = useState(false);
  const scrollY = new Animated.Value(0);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate loading
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAcceptRequest = () => {
    // Implement accept request logic
  };

  const handleAddFriend = (userId: string) => {
    // Implement add friend logic
    console.log(`Adding friend with ID: ${userId}`);
    setIsAddFriendModalVisible(false);
  };

  const handleAddNewFriend = () => {
    setIsAddFriendModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome
            name="arrow-left"
            size={20}
            color="#1A1A1A"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Friends
        </Text>
        <View style={styles.placeholderRight}></View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME_COLORS.primary}
          />
        }
      >
        {/* Tabs navigation section */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "friends" && styles.activeTab]}
            onPress={() => setActiveTab("friends")}
          >
            <FontAwesome
              name="users"
              size={22}
              color={
                activeTab === "friends"
                  ? THEME_COLORS.primary
                  : THEME_COLORS.textSecondary
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "friends"
                      ? THEME_COLORS.primary
                      : THEME_COLORS.textSecondary,
                },
              ]}
            >
              My friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "requests" && styles.activeTab]}
            onPress={() => setActiveTab("requests")}
          >
            <FontAwesome
              name="user-plus"
              size={22}
              color={
                activeTab === "requests"
                  ? THEME_COLORS.primary
                  : THEME_COLORS.textSecondary
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "requests"
                      ? THEME_COLORS.primary
                      : THEME_COLORS.textSecondary,
                },
              ]}
            >
              Received
            </Text>
            {/* Badge for new requests */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "sent" && styles.activeTab]}
            onPress={() => setActiveTab("sent")}
          >
            <FontAwesome
              name="paper-plane"
              size={22}
              color={
                activeTab === "sent"
                  ? THEME_COLORS.primary
                  : THEME_COLORS.textSecondary
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "sent"
                      ? THEME_COLORS.primary
                      : THEME_COLORS.textSecondary,
                },
              ]}
            >
              Sent
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        <View style={styles.mainContainer}>
          {/* Friends tab */}
          {activeTab === "friends" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My friends • 12</Text>

              {/* Friends list */}
              <View style={styles.friendCard}>
                <Image
                  source={{
                    uri: "https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg",
                  }}
                  style={styles.avatarImage}
                />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>Marc Dubois</Text>
                  <Text style={styles.friendStatus}>
                    🏁 GT3 Driver • Online
                  </Text>
                </View>
                <TouchableOpacity style={styles.messageButton}>
                  <FontAwesome
                    name="comment"
                    size={18}
                    color={THEME_COLORS.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.friendCard}>
                <Image
                  source={{
                    uri: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg",
                  }}
                  style={styles.avatarImage}
                />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>Sophie Martin</Text>
                  <Text style={styles.friendStatus}>
                    🏎️ Formula 4 • Offline
                  </Text>
                </View>
                <TouchableOpacity style={styles.messageButton}>
                  <FontAwesome
                    name="comment"
                    size={18}
                    color={THEME_COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Received requests tab */}
          {activeTab === "requests" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Friend requests</Text>
              <View style={styles.requestCard}>
                <Image
                  source={{
                    uri: "https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg",
                  }}
                  style={styles.avatarImage}
                />
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>John Doe</Text>
                  <Text style={styles.requestMutual}>
                    🏁 5 mutual friends • Amateur driver
                  </Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={handleAcceptRequest}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineButton}>
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.requestCard}>
                <Image
                  source={{
                    uri: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg",
                  }}
                  style={styles.avatarImage}
                />
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>Jane Smith</Text>
                  <Text style={styles.requestMutual}>
                    🏎️ 2 mutual friends • Karting
                  </Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={handleAcceptRequest}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineButton}>
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Sent requests tab */}
          {activeTab === "sent" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sent requests</Text>

              <View style={styles.sentCard}>
                <Image
                  source={{
                    uri: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg",
                  }}
                  style={styles.avatarImage}
                />
                <View style={styles.sentInfo}>
                  <Text style={styles.sentName}>Alex Rodriguez</Text>
                  <Text style={styles.sentStatus}>
                    🏁 Request sent 2 days ago
                  </Text>
                </View>
                <TouchableOpacity style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sentCard}>
                <Image
                  source={{
                    uri: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg",
                  }}
                  style={styles.avatarImage}
                />
                <View style={styles.sentInfo}>
                  <Text style={styles.sentName}>Lisa Chen</Text>
                  <Text style={styles.sentStatus}>
                    🏎️ Request sent 5 days ago
                  </Text>
                </View>
                <TouchableOpacity style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: THEME_COLORS.primary }]}
        onPress={handleAddNewFriend}
      >
        <FontAwesome name="user-plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <AddFriendModal
        visible={isAddFriendModalVisible}
        onClose={() => setIsAddFriendModalVisible(false)}
        onAddFriend={handleAddFriend}
      />
    </SafeAreaView>
  );
};

export default FriendsScreen;
