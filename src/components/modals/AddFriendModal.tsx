import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from '@/styles/modals/addFriendModalStyles';

interface UserSuggestion {
  id: string;
  name: string;
  imageUrl?: string;
}

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFriend: (userId: string) => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({
  visible,
  onClose,
  onAddFriend,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSuggestion[]>([]);

  // Simulate user search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length > 2) {
      setIsSearching(true);
      
      // Simulate an API call with a timeout
      setTimeout(() => {
        const mockResults: UserSuggestion[] = [
          { id: "1", name: "John Doe", imageUrl: "https://via.placeholder.com/50" },
          { id: "2", name: "Jane Smith", imageUrl: "https://via.placeholder.com/50" },
          { id: "3", name: "Robert Johnson", imageUrl: "https://via.placeholder.com/50" },
        ].filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase())
        );
        
        setSearchResults(mockResults);
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddFriend = (userId: string) => {
    onAddFriend(userId);
    setSearchQuery("");
    setSearchResults([]);
  };

  const renderUserItem = ({ item }: { item: UserSuggestion }) => (
    <View style={styles.userItem}>
      <Image
        source={{ uri: item.imageUrl || "https://via.placeholder.com/50" }}
        style={styles.userAvatar}
      />
      <Text style={styles.userName}>{item.name}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddFriend(item.id)}
      >
        <FontAwesome name="user-plus" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add a Friend</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesome name="times" size={24} color="#1E232C" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={20} color="#6A707C" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <FontAwesome name="times-circle" size={18} color="#6A707C" />
              </TouchableOpacity>
            )}
          </View>

          {isSearching ? (
            <ActivityIndicator size="large" color="#1E232C" style={styles.loader} />
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
            />
          ) : searchQuery.length > 2 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="users" size={50} color="#E0E0E0" />
              <Text style={styles.emptyStateText}>No users found</Text>
            </View>
          ) : searchQuery.length > 0 ? (
            <View style={styles.tipContainer}>
              <Text style={styles.tipText}>
                Enter at least 3 characters to start searching
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="user-plus" size={50} color="#E0E0E0" />
              <Text style={styles.emptyStateText}>
                Search for a friend to add to your network
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AddFriendModal; 
