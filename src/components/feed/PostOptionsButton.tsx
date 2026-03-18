import React, { useState, useRef } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import PostOptionsMenu from './PostOptionsMenu';
import { useMessage } from '@/context/MessageContext';
import { MessageService } from '@/services/messageService';

interface PostOptionsButtonProps {
  postId: string;
  username: string;
  currentUsername?: string;
  userId?: number;
}

const PostOptionsButton: React.FC<PostOptionsButtonProps> = ({
  postId,
  username,
  currentUsername = 'Vous',
  userId,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);
  const { showError, showMessage } = useMessage();

  const handleOptionsPress = () => {
    if (buttonRef.current) {
      (buttonRef.current as any).measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setButtonPosition({
          x: pageX + width,
          y: pageY + height,
        });
        setShowOptions(true);
      });
    }
  };

  const handleCloseOptions = () => {
    setShowOptions(false);
  };

  const handleCopyLink = async () => {
    try {
      // TODO: En production, remplacer par le vrai lien du post (ex: https://gearconnect.app/post/${postId})
      const postLink = `https://gearconnect.app/post/${postId}`;
      await Clipboard.setStringAsync(postLink);
      showMessage(MessageService.SUCCESS.CONTENT_COPIED);
    } catch (error) {
      console.error('Error copying link:', error);
      showError('Failed to copy link');
    }
    setShowOptions(false);
  };

  const handleReport = () => {
    console.log(`Reporting post ${postId}`);
    setShowOptions(false);
  };

  return (
    <>
      <TouchableOpacity 
        ref={buttonRef}
        onPress={handleOptionsPress}
        style={styles.optionsButton}
        activeOpacity={0.7}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <FontAwesome name="ellipsis-h" size={16} color="#262626" />
      </TouchableOpacity>

      <PostOptionsMenu
        visible={showOptions}
        onClose={handleCloseOptions}
        onReport={handleReport}
        onCopyLink={handleCopyLink}
        isOwnPost={username === currentUsername}
        position={buttonPosition}
        postUserId={userId}
      />
    </>
  );
};

const styles = StyleSheet.create({
  optionsButton: {
    padding: 8,
  }
});

export default PostOptionsButton; 