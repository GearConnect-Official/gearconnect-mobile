import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import CustomTextInput from '../ui/CustomTextInput';
import { useAuth } from "../../context/AuthContext";
import commentService, {
  HierarchicalComment,
  CommentsResponse,
} from "../../services/commentService";
import HierarchicalCommentComponent from "../Feed/HierarchicalComment";
import { hierarchicalCommentsStyles } from "../../styles/modals/hierarchicalCommentsStyles";
import { useMessage } from '../../context/MessageContext';
import MessageService from '../../services/messageService';
import { QuickMessages } from '../../utils/messageUtils';
import { trackPost } from '../../utils/mixpanelTracking';

// Modal pour affichage des commentaires hiérarchiques
interface HierarchicalCommentsModalProps {
  isVisible: boolean;
  postId: number;
  onClose: () => void;
}

const HierarchicalCommentsModal: React.FC<HierarchicalCommentsModalProps> = ({
  isVisible,
  postId,
  onClose,
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<HierarchicalComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [replyToComment, setReplyToComment] = useState<{
    commentId: number;
    username: string;
  } | null>(null);
  const textInputRef = useRef<React.ElementRef<typeof CustomTextInput>>(null);
  const { showError, showConfirmation } = useMessage();

  const loadComments = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const response: CommentsResponse =
          await commentService.getCommentsByPost(postId, page);

        if (page === 1) {
          setComments(response.comments);
        } else {
          setComments((prev) => [...prev, ...response.comments]);
        }

        setHasMoreComments(
          response.pagination.currentPage < response.pagination.totalPages
        );
        setCurrentPage(page);
      } catch (error) {
        console.error("Error loading comments:", error);
        showError("Unable to load comments");
      } finally {
        setIsLoading(false);
      }
    },
    [postId]
  );

  useEffect(() => {
    if (isVisible && postId) {
      loadComments();
    }
  }, [isVisible, postId, loadComments]);

  const handleLoadMore = () => {
    if (!isLoading && hasMoreComments) {
      loadComments(currentPage + 1);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user?.id || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const commentData = {
        postId,
        userId: parseInt(user.id),
        content: newComment.trim(),
        parentId: replyToComment?.commentId,
      };

      // Track comment before creating
      trackPost.commented(String(postId), newComment.trim().length);
      
      const newCommentResponse = await commentService.createComment(
        commentData
      );

      if (replyToComment) {
        // Si c'est une réponse, mettre à jour le commentaire parent
        setComments((prev) =>
          updateCommentWithReply(
            prev,
            replyToComment.commentId,
            newCommentResponse
          )
        );
        setReplyToComment(null);
      } else {
        // Si c'est un nouveau commentaire de niveau racine, l'ajouter en haut
        setComments((prev) => [newCommentResponse, ...prev]);
      }

      setNewComment("");
      // Fermer le clavier après envoi
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error adding comment:", error);
      showError("Unable to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCommentWithReply = (
    comments: HierarchicalComment[],
    parentId: number,
    newReply: HierarchicalComment
  ): HierarchicalComment[] => {
    return comments.map((comment) => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
          _count: {
            ...comment._count,
            replies: comment._count.replies + 1,
          },
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentWithReply(comment.replies, parentId, newReply),
        };
      }
      return comment;
    });
  };

  const handleReply = (commentId: number, parentUsername: string) => {
    setReplyToComment({ commentId, username: parentUsername });
    setNewComment(`@${parentUsername} `);
    // Focus sur le champ de saisie
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const handleLike = async (commentId: number) => {
    if (!user?.id) return;

    try {
      await commentService.toggleCommentLike(commentId, parseInt(user.id));

      // Mettre à jour l'état local
      setComments((prev) =>
        updateCommentLike(prev, commentId, parseInt(user.id))
      );
    } catch (error) {
      console.error("Error toggling comment like:", error);
      showError("Unable to like comment");
      // Revert optimistic update
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { ...comment, liked: !comment.liked, likes: comment.liked ? comment.likes + 1 : comment.likes - 1 }
            : comment
        )
      );
    }
  };

  const updateCommentLike = (
    comments: HierarchicalComment[],
    commentId: number,
    userId: number
  ): HierarchicalComment[] => {
    return comments.map((comment) => {
      if (comment.id === commentId) {
        const hasLiked = comment.likes.some((like) => like.userId === userId);
        const newLikes = hasLiked
          ? comment.likes.filter((like) => like.userId !== userId)
          : [...comment.likes, { commentId, userId, createdAt: new Date() }];

        return {
          ...comment,
          likes: newLikes,
          _count: {
            ...comment._count,
            likes: newLikes.length,
          },
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentLike(comment.replies, commentId, userId),
        };
      }
      return comment;
    });
  };

  const handleEdit = async (commentId: number, content: string) => {
    if (!user?.id) return;

    try {
      const updatedComment = await commentService.updateComment(
        commentId,
        content,
        parseInt(user.id)
      );

      setComments((prev) =>
        updateCommentContent(prev, commentId, updatedComment)
      );
    } catch (error) {
      console.error("Error updating comment:", error);
      showError("Unable to update comment");
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!user?.id) return;

    showConfirmation({
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment?",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      type: 'danger',
      onConfirm: async () => {
        try {
          await commentService.deleteComment(commentId, parseInt(user.id));
          setComments((prev) => removeComment(prev, commentId));
        } catch (error) {
          console.error("Error deleting comment:", error);
          showError("Unable to delete comment");
        }
      }
    });
  };

  const updateCommentContent = (
    comments: HierarchicalComment[],
    commentId: number,
    updatedComment: HierarchicalComment
  ): HierarchicalComment[] => {
    return comments.map((comment) => {
      if (comment.id === commentId) {
        return updatedComment;
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentContent(
            comment.replies,
            commentId,
            updatedComment
          ),
        };
      }
      return comment;
    });
  };

  const removeComment = (
    comments: HierarchicalComment[],
    commentId: number
  ): HierarchicalComment[] => {
    return comments
      .filter((comment) => comment.id !== commentId)
      .map((comment) => {
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: removeComment(comment.replies, commentId),
          };
        }
        return comment;
      });
  };

  const handleLoadMoreReplies = async (commentId: number) => {
    try {
      const response = await commentService.getCommentReplies(commentId);
      setComments((prev) =>
        updateCommentReplies(prev, commentId, response.replies)
      );
    } catch (error) {
      console.error("Error loading replies:", error);
      showError("Unable to load replies");
    }
  };

  const updateCommentReplies = (
    comments: HierarchicalComment[],
    commentId: number,
    replies: HierarchicalComment[]
  ): HierarchicalComment[] => {
    return comments.map((comment) => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: replies,
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentReplies(comment.replies, commentId, replies),
        };
      }
      return comment;
    });
  };

  const cancelReply = () => {
    setReplyToComment(null);
    setNewComment("");
    Keyboard.dismiss();
  };

  const renderComment = ({ item }: { item: HierarchicalComment }) => (
    <HierarchicalCommentComponent
      comment={item}
      currentUserId={parseInt(user?.id || "0")}
      onReply={handleReply}
      onLike={handleLike}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onLoadMoreReplies={handleLoadMoreReplies}
    />
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={hierarchicalCommentsStyles.container}>
        <KeyboardAvoidingView
          style={hierarchicalCommentsStyles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {/* Header */}
          <View style={hierarchicalCommentsStyles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={hierarchicalCommentsStyles.closeButton}
            >
              <FontAwesome name="arrow-left" size={20} color="#14171a" />
            </TouchableOpacity>
            <Text style={hierarchicalCommentsStyles.headerTitle}>
              Commentaires
            </Text>
            <View style={hierarchicalCommentsStyles.headerSpacer} />
          </View>

          {/* Comments */}
          <View style={hierarchicalCommentsStyles.contentContainer}>
            <ScrollView
              style={hierarchicalCommentsStyles.commentsList}
              contentContainerStyle={
                hierarchicalCommentsStyles.commentsContentContainer
              }
              showsVerticalScrollIndicator={false}
              onScrollEndDrag={handleLoadMore}
              scrollEventThrottle={400}
              keyboardShouldPersistTaps="handled"
            >
              {/* Empty state */}
              {comments.length === 0 && !isLoading && (
                <View style={hierarchicalCommentsStyles.emptyContainer}>
                  <FontAwesome name="comments-o" size={50} color="#ccc" />
                  <Text style={hierarchicalCommentsStyles.emptyText}>
                    Aucun commentaire
                  </Text>
                  <Text style={hierarchicalCommentsStyles.emptySubText}>
                    Soyez le premier à commenter!
                  </Text>
                </View>
              )}

              {/* Comments list */}
              {comments.map((item) => (
                <View key={item.id}>{renderComment({ item })}</View>
              ))}

              {isLoading && (
                <View style={hierarchicalCommentsStyles.loadingContainer}>
                  <ActivityIndicator size="small" color="#1da1f2" />
                </View>
              )}
            </ScrollView>
          </View>

          {/* Fixed Input Container */}
          <View style={hierarchicalCommentsStyles.inputContainer}>
            {/* Reply indicator */}
            {replyToComment && (
              <View style={hierarchicalCommentsStyles.replyIndicator}>
                <Text style={hierarchicalCommentsStyles.replyText}>
                  En réponse à @{replyToComment.username}
                </Text>
                <TouchableOpacity
                  onPress={cancelReply}
                  style={hierarchicalCommentsStyles.cancelReplyButton}
                >
                  <FontAwesome name="times" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            {/* Input */}
            <View style={hierarchicalCommentsStyles.inputRow}>
              <CustomTextInput
                ref={textInputRef}
                style={hierarchicalCommentsStyles.textInput}
                placeholder={
                  replyToComment
                    ? "Écrivez votre réponse..."
                    : "Ajoutez un commentaire..."
                }
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
                textAlignVertical="top"
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity
                style={[
                  hierarchicalCommentsStyles.sendButton,
                  (!newComment.trim() || isSubmitting) &&
                    hierarchicalCommentsStyles.sendButtonDisabled,
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <FontAwesome name="send" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default HierarchicalCommentsModal;

