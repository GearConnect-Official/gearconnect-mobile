import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { formatPostDate } from '@/utils/dateUtils';
import postService, { Comment } from '@/services/postService';
import { useAuth } from '@/context/AuthContext';
import { commentsModalStyles } from '@/styles/modals/commentsModalStyles';
import { useMessage } from '@/context/MessageContext';
import MessageService from '@/services/messageService';
import { QuickMessages } from '@/utils/messageUtils';
import { trackPost } from '@/utils/mixpanelTracking';

interface CommentsModalProps {
  isVisible: boolean;
  postId: number;
  comments: Comment[];
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  isVisible,
  postId,
  comments: initialComments,
  onClose,
  onAddComment,
}) => {
  const authContext = useAuth();
  const user = authContext?.user;
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editText, setEditText] = useState('');
  const { showError, showConfirmation } = useMessage();

  const loadComments = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await postService.getComments(postId, page);
      const newComments = response.interactions.map((interaction: any) => ({
        id: `${interaction.postId}-${interaction.userId}`,
        postId: interaction.postId,
        userId: interaction.userId,
        content: interaction.comment || '',
        createdAt: new Date(interaction.createdAt),
        user: interaction.user
      }));

      if (page === 1) {
        setComments(newComments);
      } else {
        setComments(prev => [...prev, ...newComments]);
      }

      setHasMoreComments(newComments.length === response.pagination.itemsPerPage);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load comments:', error);
      showError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [postId, showError]);

  useEffect(() => {
    if (isVisible) {
      loadComments();
    }
  }, [isVisible, loadComments]);

  const handleLoadMore = () => {
    if (!isLoading && hasMoreComments) {
      loadComments(currentPage + 1);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user?.id) return;

    try {
      setIsLoading(true);
      await postService.addComment(postId, Number(user.id), newComment.trim());
      
      // Track comment
      trackPost.commented(String(postId), newComment.trim().length);
      
      setNewComment('');
      // Recharger les commentaires pour avoir l'ordre correct
      loadComments(1);
    } catch (error) {
      console.error('Failed to add comment:', error);
      showError('Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditComment = async (comment: Comment) => {
    try {
      setIsLoading(true);
      await postService.editComment(comment.postId, comment.userId, editText);
      setEditingComment(null);
      setEditText('');
      // Recharger les commentaires
      loadComments(1);
    } catch (error) {
      console.error('Failed to edit comment:', error);
      showError('Failed to edit comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    showConfirmation({
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment?",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      type: 'danger',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await postService.deleteComment(comment.postId, comment.userId);
          // Recharger les commentaires
          loadComments(1);
        } catch (error) {
          console.error('Failed to delete comment:', error);
          showError('Failed to delete comment');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const renderComment = ({ item: comment }: { item: Comment }) => (
    <View style={commentsModalStyles.commentContainer}>
      {editingComment?.id === comment.id ? (
        <View style={commentsModalStyles.editContainer}>
          <TextInput
            style={commentsModalStyles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            placeholder="Edit your comment..."
          />
          <View style={commentsModalStyles.editActions}>
            <TouchableOpacity
              style={commentsModalStyles.editButton}
              onPress={() => handleEditComment(comment)}
            >
              <FontAwesome name="check" size={16} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={commentsModalStyles.editButton}
              onPress={() => {
                setEditingComment(null);
                setEditText('');
              }}
            >
              <FontAwesome name="times" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={commentsModalStyles.commentHeader}>
            <Text style={commentsModalStyles.username}>{comment.user?.username || 'Unknown'}</Text>
            <Text style={commentsModalStyles.timestamp}>{formatPostDate(comment.createdAt)}</Text>
          </View>
          <Text style={commentsModalStyles.commentText}>{comment.content}</Text>
          <View style={commentsModalStyles.commentActions}>
            <TouchableOpacity
              style={commentsModalStyles.actionButton}
              onPress={() => {
                setEditingComment(comment);
                setEditText(comment.content);
              }}
            >
              <FontAwesome name="edit" size={16} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={commentsModalStyles.actionButton}
              onPress={() => handleDeleteComment(comment)}
            >
              <FontAwesome name="trash" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={commentsModalStyles.container}>
        <View style={commentsModalStyles.header}>
          <TouchableOpacity onPress={onClose} style={commentsModalStyles.closeButton}>
            <FontAwesome name="arrow-left" size={20} color="#262626" />
          </TouchableOpacity>
          <Text style={commentsModalStyles.headerTitle}>Comments</Text>
          <TouchableOpacity>
            <FontAwesome name="paper-plane-o" size={20} color="#262626" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={commentsModalStyles.commentsList}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading ? (
              <ActivityIndicator size="small" color="#000" style={commentsModalStyles.loader} />
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={commentsModalStyles.emptyContainer}>
                <FontAwesome name="comments-o" size={60} color="#CCCCCC" />
                <Text style={commentsModalStyles.emptyText}>No comments yet</Text>
                <Text style={commentsModalStyles.emptySubText}>Be the first to comment</Text>
              </View>
            ) : null
          }
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 40}
          style={commentsModalStyles.inputContainer}
        >
          <View style={commentsModalStyles.inputRow}>
            <TextInput
              style={commentsModalStyles.textInput}
              placeholder="Add a comment..."
              placeholderTextColor="#8E8E8E"
              multiline
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!newComment.trim() || isLoading}
              style={[
                commentsModalStyles.sendButton,
                (!newComment.trim() || isLoading) && commentsModalStyles.sendButtonDisabled,
              ]}
            >
              <Text style={commentsModalStyles.sendButtonText}>
                Post
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default CommentsModal; 
