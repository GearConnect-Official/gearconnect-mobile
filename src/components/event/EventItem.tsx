import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import theme from '@/theme';
import eventService from '@/services/eventService';
import { checkMissingEventInfo } from '@/utils/eventMissingInfo';
import EventTag from '@/components/event/EventTag';
import { trackEvent } from '@/utils/mixpanelTracking';
import { AspectBannerImage } from '@/components/media/AspectBannerImage';

interface EventItemProps {
  title: string;
  subtitle: string;
  date: string;
  icon?: string;
  logoPublicId?: string;
  images?: string[];
  imagePublicIds?: string[];
  emoji?: string;
  location?: string;
  attendees?: number;
  onPress?: () => void;
  eventId?: number;
  creatorId?: number;
  currentUserId?: number;
  isJoined?: boolean;
  onJoinSuccess?: () => void;
  onLeaveSuccess?: () => void;
  winner?: {
    userName: string;
    lapTime: string;
  } | null;
  eventDate?: Date | string;
  meteo?: {
    trackCondition?: 'dry' | 'wet' | 'mixed' | 'damp' | 'slippery' | 'drying';
    [key: string]: any;
  };
  finished?: boolean;
  participationTagText?: string;
  participationTagColor?: string;
  organizers?: { userId: number | null; name: string }[];
}

const EventItem: React.FC<EventItemProps> = ({
  title,
  subtitle,
  date,
  icon,
  logoPublicId,
  images,
  imagePublicIds,
  emoji,
  location,
  attendees = 0,
  onPress,
  eventId,
  creatorId,
  currentUserId,
  isJoined: initialIsJoined = false,
  onJoinSuccess,
  onLeaveSuccess,
  winner,
  eventDate,
  meteo,
  finished = false,
  participationTagText,
  participationTagColor,
  organizers = [],
}) => {
  // Vérifier si l'événement est terminé : soit finished = true, soit la date est passée
  const eventDateObj = eventDate ? (typeof eventDate === 'string' ? new Date(eventDate) : eventDate) : null;
  const isDatePassed = eventDateObj ? new Date(eventDateObj) < new Date() : false;
  const isEventFinished = finished === true || isDatePassed;
  
  const [isJoined, setIsJoined] = useState(!isEventFinished && (initialIsJoined || (creatorId && currentUserId && creatorId === currentUserId)));
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Vérifier si des infos manquent (seulement pour les organisateurs)
  const isOrganizer = creatorId && currentUserId && creatorId === currentUserId;
  const missingInfo = isOrganizer && eventDate ? checkMissingEventInfo({
    date: typeof eventDate === 'string' ? new Date(eventDate) : eventDate,
    meteo: meteo || {},
  } as any) : null;

  // Synchroniser l'état local avec les props
  useEffect(() => {
    const isOrganizer = creatorId && currentUserId && creatorId === currentUserId;
    // Un événement est "joined" seulement s'il n'est pas terminé
    const eventDateObj = eventDate ? (typeof eventDate === 'string' ? new Date(eventDate) : eventDate) : null;
    const isDatePassed = eventDateObj ? new Date(eventDateObj) < new Date() : false;
    const isEventFinished = finished === true || isDatePassed;
    setIsJoined(!isEventFinished && (initialIsJoined || isOrganizer));
  }, [initialIsJoined, creatorId, currentUserId, finished, eventDate]);

  const handleJoin = async () => {
    // Ne pas permettre de rejoindre un événement terminé
    if (!eventId || !currentUserId || isJoined || isJoining || isEventFinished) {
      return;
    }

    setIsJoining(true);
    try {
      await eventService.joinEvent(eventId, currentUserId);
      setIsJoined(true);
      
      // Track event join
      trackEvent.joined(String(eventId), title);
      
      if (onJoinSuccess) {
        onJoinSuccess();
      }
    } catch (error: any) {
      console.error("Error joining event:", error);
      // On pourrait afficher un message d'erreur ici
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = () => {
    if (!eventId || !currentUserId || !isJoined || isLeaving) {
      return;
    }

    // Ne pas permettre au créateur de quitter son propre événement
    if (creatorId && creatorId === currentUserId) {
      return;
    }

    Alert.alert(
      "Leave Event",
      "Are you sure you want to leave this event?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            setIsLeaving(true);
            try {
              await eventService.leaveEvent(eventId, currentUserId);
              setIsJoined(false);
              if (onLeaveSuccess) {
                onLeaveSuccess();
              }
            } catch (error: any) {
              console.error("Error leaving event:", error);
              Alert.alert("Error", "Failed to leave the event. Please try again.");
            } finally {
              setIsLeaving(false);
            }
          },
        },
      ]
    );
  };

  // Si l'événement est terminé (finished = true OU date passée), toujours afficher "End"
  // Sinon, afficher "Joined" si l'utilisateur a rejoint ou est le créateur
  const showFinished = isEventFinished;
  const showJoined = !showFinished && (isJoined || isOrganizer);

  const imgList = images && Array.isArray(images) ? images : [];
  const mainUrl = icon || imgList[0];

  return (
    <TouchableOpacity style={itemStyles.container} onPress={onPress}>
      {/* Bannière carrée: logo (pp) ou 1re image, adaptée au format carré — badge carrousel retiré (on voit les photos dans le détail) */}
      <AspectBannerImage
        sourceUri={mainUrl || null}
        placeholder={
          <View style={itemStyles.bannerPlaceholder}>
            {emoji ? (
              <Text style={itemStyles.bannerPlaceholderEmoji}>{emoji}</Text>
            ) : (
              <FontAwesome name="calendar" size={36} color="rgba(255,255,255,0.7)" />
            )}
          </View>
        }
        fallbackHeight={120}
        forceSquare
      >
        <View style={itemStyles.bannerDateBadge} pointerEvents="none">
          <Text style={itemStyles.bannerDateText}>{date}</Text>
        </View>
      </AspectBannerImage>

      <View style={itemStyles.contentContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              <Text style={itemStyles.titleText} numberOfLines={2}>{title}</Text>
              {participationTagText && participationTagColor && (
                <EventTag
                  text={participationTagText}
                  color={participationTagColor}
                />
              )}
            </View>
            {/* Afficher les organisateurs si disponibles, sinon le subtitle par défaut */}
            {organizers.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                <Text style={[itemStyles.subtitleText, { marginRight: 4 }]}>Organized by:</Text>
                {organizers.map((org, index) => (
                  <Text key={index} style={itemStyles.subtitleText}>
                    {org.name}{index < organizers.length - 1 ? ', ' : ''}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={itemStyles.subtitleText} numberOfLines={1}>{subtitle}</Text>
            )}
          </View>
          {missingInfo?.hasMissingInfo && (
            <View style={itemStyles.missingInfoBadge}>
              <FontAwesome name="exclamation-triangle" size={14} color="#F59E0B" />
              <Text style={itemStyles.missingInfoText}>{missingInfo.missingCount}</Text>
            </View>
          )}
        </View>
        
        {location && (
          <View style={itemStyles.locationRow}>
            <FontAwesome name="map-marker" size={14} color="#666" />
            <Text style={itemStyles.locationText}>{location}</Text>
          </View>
        )}

        {winner && (
          <View style={itemStyles.winnerContainer}>
            <FontAwesome name="trophy" size={14} color="#FFD700" />
            <Text style={itemStyles.winnerText}>
              Winner: {winner.userName} ({winner.lapTime})
            </Text>
          </View>
        )}

      </View>

      <View style={itemStyles.footer}>
        <View style={itemStyles.attendeesContainer}>
          <FontAwesome name="users" size={14} color="#666" />
          <Text style={itemStyles.attendeesText}>{attendees} participants</Text>
        </View>
        
        {/* Priorité : afficher "End" si l'événement est terminé, sinon "Joined" si rejoint */}
        {isEventFinished ? (
          <View style={itemStyles.finishedBadge}>
            <FontAwesome name="flag-checkered" size={14} color={theme.colors.primary.main} />
            <Text style={itemStyles.finishedBadgeText}>End</Text>
          </View>
        ) : showJoined ? (
          <TouchableOpacity 
            style={itemStyles.joinedBadge}
            onPress={isOrganizer ? undefined : handleLeave}
            disabled={isOrganizer || isLeaving}
          >
            {isLeaving ? (
              <ActivityIndicator size="small" color="#10b981" />
            ) : (
              <>
                <FontAwesome name="check-circle" size={14} color="#10b981" />
                <Text style={itemStyles.joinedBadgeText}>Joined</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[itemStyles.joinButton, isJoining && itemStyles.joinButtonDisabled]} 
            onPress={handleJoin}
            disabled={isJoining || !eventId || !currentUserId || isEventFinished}
          >
            {isJoining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={itemStyles.joinButtonText}>Join</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={itemStyles.shimmer} />
    </TouchableOpacity>
  );
};

const itemStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerPlaceholder: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#E10600",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerPlaceholderEmoji: {
    fontSize: 48,
  },
  bannerDateBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  bannerDateText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  contentContainer: {
    padding: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
    paddingTop: 12,
  },
  attendeesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attendeesText: {
    fontSize: 14,
    color: "#666",
  },
  joinButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  joinedBadgeText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  missingInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  missingInfoText: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 12,
  },
  winnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  winnerText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  finishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  finishedBadgeText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
    fontSize: 14,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 20,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transform: [{ skewX: "-20deg" }],
  },
});

export default EventItem;
