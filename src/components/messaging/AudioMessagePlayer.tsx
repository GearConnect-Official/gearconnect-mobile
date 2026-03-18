import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';
import theme from '@/theme';

const { width: screenWidth } = Dimensions.get('window');

interface AudioMessagePlayerProps {
  audioUrl: string;
  isOwn: boolean;
  duration?: number; // Duration in seconds (optional, will be fetched if not provided)
  onDurationLoaded?: (duration: number) => void; // Callback to expose duration
  onPositionUpdate?: (position: number) => void; // Callback to expose current position
}

const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({
  audioUrl,
  isOwn,
  duration: initialDuration,
  onDurationLoaded,
  onPositionUpdate,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0); // Start at 1.0x
  const [isSeeking, setIsSeeking] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [waveformWidth, setWaveformWidth] = useState(0);
  const positionUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformRef = useRef<View | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const onDurationLoadedRef = useRef(onDurationLoaded);
  const onPositionUpdateRef = useRef(onPositionUpdate);
  const isSeekingRef = useRef(isSeeking);
  onDurationLoadedRef.current = onDurationLoaded;
  onPositionUpdateRef.current = onPositionUpdate;
  isSeekingRef.current = isSeeking;

  const generateWaveformData = (durationSeconds: number) => {
    // Calculate responsive number of bars based on duration and available width
    // Shorter audio = fewer bars, longer audio = more bars
    // But also consider screen width to ensure it fits in the bubble
    const maxBubbleWidth = screenWidth * 0.75 - 80; // Account for padding and buttons
    const barWidth = 2; // Width of each bar
    const gap = 2; // Gap between bars
    const availableWidth = maxBubbleWidth - 60; // Reserve space for play button, duration, speed button
    
    // Calculate max bars that fit
    const maxBarsByWidth = Math.floor(availableWidth / (barWidth + gap));
    
    // Calculate bars by duration (1 bar per 0.08 seconds for short, 0.12 for long)
    const barsByDuration = durationSeconds < 10 
      ? Math.floor(durationSeconds * 12.5) // More bars for short audio
      : Math.floor(durationSeconds * 8); // Fewer bars per second for long audio
    
    // Use the smaller of the two to ensure it fits
    const numBars = Math.min(maxBarsByWidth, Math.max(20, barsByDuration));
    
    const bars: number[] = [];
    
    // Generate random heights for each bar (simulating audio waveform)
    // Heights vary between 4px (minimum) and 20px (maximum)
    for (let i = 0; i < numBars; i++) {
      // Create some variation - not completely random, some patterns
      const baseHeight = 4 + Math.random() * 16;
      bars.push(Math.max(4, Math.min(20, baseHeight)));
    }
    
    setWaveformData(bars);
  };

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPosition(0);
      onPositionUpdateRef.current?.(0);
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
        positionUpdateInterval.current = null;
      }
    } else if (!isSeekingRef.current) {
      const newPosition = status.positionMillis / 1000;
      setPosition(newPosition);
      onPositionUpdateRef.current?.(newPosition);
    }
  }, []);

  useEffect(() => {
    isSeekingRef.current = isSeeking;
  }, [isSeeking]);

  useEffect(() => {
    if (!audioUrl) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    const doLoad = async () => {
      try {
        setIsLoading(true);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );

        if (cancelled) {
          newSound.unloadAsync().catch(() => {});
          return;
        }

        soundRef.current = newSound;
        setSound(newSound);

        const status = await newSound.getStatusAsync();
        if (status.isLoaded && status.durationMillis && !cancelled) {
          const durationSeconds = status.durationMillis / 1000;
          setDuration(durationSeconds);
          onDurationLoadedRef.current?.(durationSeconds);
          generateWaveformData(durationSeconds);
        }

        if (!cancelled) setIsLoading(false);
      } catch (error) {
        console.error('Error loading audio:', error);
        if (!cancelled) setIsLoading(false);
      }
    };

    if (initialDuration && initialDuration > 0) {
      generateWaveformData(initialDuration);
    }
    doLoad();

    return () => {
      cancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
        positionUpdateInterval.current = null;
      }
    };
  }, [audioUrl]);

  const togglePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
        if (positionUpdateInterval.current) {
          clearInterval(positionUpdateInterval.current);
          positionUpdateInterval.current = null;
        }
      } else {
        // If playback finished, restart from beginning
        if (duration > 0 && position >= Math.max(0, duration - 0.1)) {
          await sound.setPositionAsync(0);
          setPosition(0);
          if (onPositionUpdate) {
            onPositionUpdate(0);
          }
        }
        await sound.playAsync();
        setIsPlaying(true);
        
        // Update position periodically
        positionUpdateInterval.current = setInterval(async () => {
          if (sound && !isSeeking) {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              const newPosition = status.positionMillis / 1000;
              setPosition(newPosition);
              if (onPositionUpdate) {
                onPositionUpdate(newPosition);
              }
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handleSeek = async (value: number) => {
    if (!sound || isSeeking) return;

    try {
      setIsSeeking(true);
      const positionMillis = value * 1000;
      await sound.setPositionAsync(positionMillis);
      setPosition(value);
    } catch (error) {
      console.error('Error seeking:', error);
    } finally {
      setIsSeeking(false);
    }
  };

  const togglePlaybackRate = async () => {
    if (!sound) return;

    const rates = [0.75, 1.0, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const nextRate = rates[nextIndex];

    try {
      await sound.setRateAsync(nextRate, true);
      setPlaybackRate(nextRate);
    } catch (error) {
      console.error('Error changing playback rate:', error);
    }
  };

  const handleWaveformSeek = async (x: number) => {
    if (!sound || !duration || waveformWidth === 0 || waveformData.length === 0) return;
    
    try {
      // Calculate percentage based on the width of the waveform bars area
      const percentage = Math.max(0, Math.min(1, x / waveformWidth));
      const seekPosition = percentage * duration;
      
      await handleSeek(seekPosition);
    } catch (error) {
      console.error('Error seeking from waveform:', error);
    }
  };

  // PanResponder for smooth dragging on waveform
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Handle initial press
        const { locationX } = evt.nativeEvent;
        handleWaveformSeek(locationX);
      },
      onPanResponderMove: (evt) => {
        // Handle dragging
        const { locationX } = evt.nativeEvent;
        handleWaveformSeek(locationX);
      },
      onPanResponderRelease: () => {
        // Gesture ended
      },
    })
  ).current;

  if (isLoading) {
    return (
      <View style={[styles.container, isOwn && styles.containerOwn]}>
        <ActivityIndicator size="small" color={isOwn ? '#FFFFFF' : theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isOwn && styles.containerOwn]}>
      {/* Play/Pause Icon (no background) */}
      <TouchableOpacity
        style={styles.playIconButton}
        onPress={togglePlayPause}
        activeOpacity={0.7}
      >
        <FontAwesome
          name={isPlaying ? 'pause' : 'play'}
          size={16}
          color={isOwn ? '#FFFFFF' : theme.colors.primary.main}
        />
      </TouchableOpacity>

      {/* Waveform (Discord-style) */}
      <View
        style={styles.waveformContainer}
        ref={waveformRef}
        {...panResponder.panHandlers}
      >
        <View 
          style={styles.waveformBars}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width > 0) {
              setWaveformWidth(width);
            }
          }}
          pointerEvents="box-none"
        >
          {waveformData.map((height, index) => {
            const progress = duration > 0 ? position / duration : 0;
            const barProgress = index / waveformData.length;
            const isPlayed = barProgress <= progress;
            
            return (
              <View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: height,
                    backgroundColor: isPlayed
                      ? (isOwn ? 'rgba(255, 255, 255, 0.9)' : theme.colors.primary.main)
                      : (isOwn ? 'rgba(255, 255, 255, 0.5)' : 'rgba(225, 6, 0, 0.3)'),
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Speed Button */}
      <TouchableOpacity
        style={[styles.speedButton, isOwn && styles.speedButtonOwn]}
        onPress={togglePlaybackRate}
        activeOpacity={0.7}
      >
        <Text style={[styles.speedText, isOwn && styles.speedTextOwn]}>
          {playbackRate}x
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    zIndex: 10, // Ensure audio player is above reply preview
    position: 'relative',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: screenWidth * 0.8, // More elongated: 80% of screen width
    minWidth: 250, // Minimum width for very short audio
    height: 36, // Reduced height for elongated look
    alignSelf: 'flex-start', // Don't stretch to full width
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  containerOwn: {
    backgroundColor: theme.colors.primary.main,
    borderColor: 'transparent',
  },
  playIconButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  waveformContainer: {
    flex: 1,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 0, // Allow shrinking
    zIndex: 10, // Ensure waveform is above reply preview
  },
  waveformBars: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 20,
    gap: 2,
    minWidth: 0, // Allow shrinking
  },
  waveformBar: {
    width: 2,
    minHeight: 4,
    borderRadius: 1,
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  timeTextOwn: {
    color: 'rgba(255, 255, 255, 0.95)',
  },
  speedButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.grey[200],
    minWidth: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  speedButtonOwn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  speedText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  speedTextOwn: {
    color: '#FFFFFF',
  },
});

export default AudioMessagePlayer;
