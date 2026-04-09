import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HierarchicalComment as CommentType } from '../../services/commentService';
import { formatPostDate } from '../../utils/dateUtils';
import { hierarchicalCommentStyles as styles } from '../../styles/components/hierarchicalCommentStyles';
import { CloudinaryAvatar } from '../media/CloudinaryImage';
import { defaultImages } from '../../config/defaultImages';

interface HierarchicalCommentProps {
  comment: CommentType;
  currentUserId: number;
  onReply: (commentId: number, parentUsername: string) => void;
  onLike: (commentId: number) => void;
  onEdit: (commentId: number, content: string) => void;
  onDelete: (commentId: number) => void;
  onLoadMoreReplies?: (commentId: number) => void;
  level?: number; // Niveau de profondeur pour l'indentation
  maxLevel?: number; // Niveau maximum d'indentation
}

const HierarchicalComment: React.FC<HierarchicalCommentProps> = ({
  comment,
  currentUserId,
  onReply,
  onLike,
  onEdit,
  onDelete,
  onLoadMoreReplies,
  level = 0,
  maxLevel = 3,
}) => {
  const router = useRouter();
  const [showReplies, setShowReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleProfilePress = () => {
    if (comment.userId) {
      router.push({
        pathname: '/userProfile',
        params: { userId: comment.userId.toString() },
      });
    }
  };

  const isOwnComment = comment.userId === currentUserId;
  const hasLiked = comment.likes.some(like => like.userId === currentUserId);
  const likesCount = comment._count?.likes || 0;
  const repliesCount = comment._count?.replies || 0;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(comment.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = () => {
    Alert.prompt(
      'Modifier le commentaire',
      'Modifiez votre commentaire',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Modifier',
          onPress: (text: string | undefined) => {
            if (text && text.trim()) {
              onEdit(comment.id, text.trim());
            }
          },
        },
      ],
      'plain-text',
      comment.content
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le commentaire',
      'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDelete(comment.id),
        },
      ]
    );
  };

  const handleReply = () => {
    onReply(comment.id, comment.user.username);
  };

  const toggleReplies = () => {
    if (!showReplies && repliesCount > 0 && (!comment.replies || comment.replies.length === 0)) {
      // Charger les rÃ©ponses si elles ne sont pas encore chargÃ©es
      onLoadMoreReplies?.(comment.id);
    }
    setShowReplies(!showReplies);
  };

  const marginLeft = Math.min(level, maxLevel) * 16; // Indentation limitÃ©e

  return (
    <View style={[styles.container, { marginLeft }]}>
      {/* Main comment */}
      <View style={styles.commentContainer}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          {comment.user.profilePicturePublicId ? (
            <CloudinaryAvatar
              publicId={comment.user.profilePicturePublicId}
              size={32}
              quality="auto"
              format="auto"
              style={styles.avatar}
              fallbackUrl={comment.user.profilePicture}
            />
          ) : comment.user.profilePicture ? (
            <Image
              source={{
                uri: comment.user.profilePicture
              }}
              style={styles.avatar}
            />
          ) : (
            <Image
              source={defaultImages.profile}
              style={styles.avatar}
            />
          )}
          {level > 0 && <View style={styles.threadLine} />}
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.username}>{comment.user.username}</Text>
            <Text style={styles.timestamp}>{formatPostDate(comment.createdAt)}</Text>
          </View>

          <Text style={styles.content}>{comment.content}</Text>

          <View style={styles.actions}>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleLike}
              disabled={isLiking}
            >
              {isLiking ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <FontAwesome 
                  name={hasLiked ? "heart" : "heart-o"} 
                  size={14} 
                  color={hasLiked ? "#e91e63" : "#666"} 
                />
              )}
              {likesCount > 0 && (
                <Text style={[styles.actionText, hasLiked && styles.likedText]}>
                  {likesCount}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleReply}
              disabled={level >= maxLevel}
            >
              <FontAwesome 
                name="reply" 
                size={14} 
                color={level >= maxLevel ? "#ccc" : "#666"} 
              />
              <Text style={[styles.actionText, level >= maxLevel && styles.disabledText]}>
                Répondre
              </Text>
            </TouchableOpacity>

            {isOwnComment && (
              <>
                <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                  <FontAwesome name="edit" size={14} color="#666" />
                  <Text style={styles.actionText}>Modifier</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                  <FontAwesome name="trash" size={14} color="#666" />
                  <Text style={styles.actionText}>Supprimer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Show replies toggle */}
          {repliesCount > 0 && (
            <TouchableOpacity style={styles.showRepliesButton} onPress={toggleReplies}>
              <View style={styles.repliesIndicator} />
              <Text style={styles.showRepliesText}>
                {showReplies ? 'Masquer' : 'Afficher'} {repliesCount} rÃ©ponse{repliesCount > 1 ? 's' : ''}
              </Text>
              <FontAwesome 
                name={showReplies ? "chevron-up" : "chevron-down"} 
                size={12} 
                color="#666" 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <HierarchicalComment
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
              onLoadMoreReplies={onLoadMoreReplies}
              level={level + 1}
              maxLevel={maxLevel}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default HierarchicalComment; 
