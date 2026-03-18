import React from 'react';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import postService from '@/services/postService';
import { useMessage } from '@/context/MessageContext';
import MessageService from '@/services/messageService';

interface ShareOption {
  id: string;
  name: string;
  icon: string;
  action: () => void;
}

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  postId,
}) => {
  const { showMessage } = useMessage();
  
  const handleShareToApp = async () => {
    try {
      await postService.sharePost(parseInt(postId), 1); // Utiliser l'ID de l'utilisateur connecté
      showMessage(MessageService.SUCCESS.POST_SHARED);
      onClose();
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      showMessage(MessageService.ERROR.FAILED_TO_SHARE_POST);
    }
  };

  // Sharing options
  const shareOptions: ShareOption[] = [
    { 
      id: '1', 
      name: 'Share to Feed', 
      icon: 'share', 
      action: handleShareToApp
    },
    { 
      id: '2', 
      name: 'Messages', 
      icon: 'comment', 
      action: () => console.log(`Sharing post ${postId} via Messages`)
    },
    { 
      id: '3', 
      name: 'WhatsApp', 
      icon: 'whatsapp', 
      action: () => console.log(`Sharing post ${postId} via WhatsApp`)
    },
    { 
      id: '4', 
      name: 'Facebook', 
      icon: 'facebook', 
      action: () => console.log(`Sharing post ${postId} via Facebook`)
    },
    { 
      id: '5', 
      name: 'Email', 
      icon: 'envelope', 
      action: () => console.log(`Sharing post ${postId} via Email`)
    },
    { 
      id: '6', 
      name: 'Copy link', 
      icon: 'link', 
      action: () => console.log(`Copying link for post ${postId}`)
    },
  ];

  // Sample recent contacts
  const recentContacts = [
    { id: 'c1', name: 'Mary Smith', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
    { id: 'c2', name: 'John Martin', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { id: 'c3', name: 'Sophie Brown', avatar: 'https://randomuser.me/api/portraits/women/22.jpg' },
    { id: 'c4', name: 'Thomas Green', avatar: 'https://randomuser.me/api/portraits/men/33.jpg' },
    { id: 'c5', name: 'Julie Davis', avatar: 'https://randomuser.me/api/portraits/women/32.jpg' },
  ];

  const handleShareToContact = (contactId: string) => {
    console.log(`Sharing post ${postId} with contact ${contactId}`);
    onClose();
  };

  const handleShareOption = (option: ShareOption) => {
    option.action();
    if (option.id !== '1') { // Ne fermer que si ce n'est pas le partage vers le feed (qui gère sa propre fermeture)
      onClose();
    }
  };

  // Render a recent contact
  const renderRecentContact = ({ item }: { item: { id: string; name: string; avatar: string } }) => (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => handleShareToContact(item.id)}
    >
      <Image source={{ uri: item.avatar }} style={styles.contactAvatar} />
      <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Render a sharing option
  const renderShareOption = ({ item }: { item: ShareOption }) => (
    <TouchableOpacity 
      style={styles.shareOption}
      onPress={() => handleShareOption(item)}
    >
      <View style={styles.shareIconContainer}>
        <FontAwesome name={item.icon as any} size={24} color="#262626" />
      </View>
      <Text style={styles.shareOptionText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <View style={styles.indicator} />
                <Text style={styles.title}>Share</Text>
              </View>

              <Text style={styles.sectionTitle}>Recent</Text>
              <FlatList
                data={recentContacts}
                renderItem={renderRecentContact}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.contactsList}
              />

              <View style={styles.divider} />

              <FlatList
                data={shareOptions}
                renderItem={renderShareOption}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.shareOptionsContainer}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30, // Extra for iPhone X and newer
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: '#DEDEDE',
    borderRadius: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  contactsList: {
    paddingHorizontal: 8,
  },
  contactItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 72,
  },
  contactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#262626',
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginVertical: 16,
  },
  shareOptionsContainer: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  shareOption: {
    width: '33.33%',
    alignItems: 'center',
    padding: 12,
  },
  shareIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#262626',
  },
});

export default ShareModal; 