import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import theme from '@/theme';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

// Waveform indicator component with realistic audio patterns
const WaveformIndicator: React.FC<{ isPaused: boolean; duration: number }> = ({ isPaused, duration }) => {
  const [heights, setHeights] = useState<number[]>([]);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseHeightsRef = useRef<number[]>([]);

  useEffect(() => {
    // Initialize with 24 bars for better visual
    const numBars = 24;
    const initialHeights = Array.from({ length: numBars }, () => 4);
    setHeights(initialHeights);
    baseHeightsRef.current = initialHeights;

    if (!isPaused) {
      // More realistic waveform animation - only animate when there's actual sound
      // Use duration to determine if recording is active (if duration increases, there's sound)
      let lastDuration = duration;
      animationRef.current = setInterval(() => {
        setHeights(prev => {
          const currentDuration = duration;
          const isActive = currentDuration > lastDuration || currentDuration > 0.1; // Only animate if recording is progressing
          lastDuration = currentDuration;
          
          const newHeights = prev.map((current, i) => {
            if (!isActive) {
              // If no sound detected, keep bars at minimum
              return 4;
            }
            
            // Create wave patterns - simulate speech rhythm with controlled variation
            const time = Date.now() / 150; // Slower time for less sensitivity
            const position = i / numBars;
            
            // Multiple wave patterns at different frequencies
            const wave1 = Math.sin(time * 0.3 + position * Math.PI * 3) * 0.3 + 0.3;
            const wave2 = Math.sin(time * 0.5 + position * Math.PI * 5) * 0.25 + 0.25;
            const wave3 = Math.sin(time * 0.7 + position * Math.PI * 7) * 0.15 + 0.15;
            
            // Reduced random variations - less sensitive
            const randomVariation = Math.random() * 0.3;
            
            // Combine patterns with less weight on random
            const combined = (wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.2 + randomVariation * 0.1);
            
            // Scale to realistic heights (4px to 24px)
            const minHeight = 4;
            const maxHeight = 24;
            const height = minHeight + combined * (maxHeight - minHeight);
            
            // Ensure minimum height
            return Math.max(minHeight, Math.min(maxHeight, height));
          });
          
          // Update base heights for smooth transitions
          baseHeightsRef.current = newHeights;
          return newHeights;
        });
      }, 150); // Update every 150ms - less frequent for less sensitivity
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      // Gradually fade to minimum height when paused
      setHeights(prev => prev.map(() => 4));
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPaused, duration]);

  return (
    <View style={styles.waveformContainer}>
      {heights.map((height, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveformBar,
            {
              height: isPaused ? 4 : height,
              opacity: isPaused ? 0.5 : 0.7 + (height / 24) * 0.3, // Opacity based on height
            },
          ]}
        />
      ))}
    </View>
  );
};

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [duration, setDuration] = useState(0);
  const [pausedStartTime, setPausedStartTime] = useState(0);
  
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Use refs to access current values in setInterval
  const isPausedRef = useRef(false);
  const recordingStartTimeRef = useRef(0);
  const pausedDurationRef = useRef(0);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record voice messages.');
        if (onCancel) onCancel();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // createAsync() already starts the recording automatically
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      const startTime = Date.now();
      
      setRecording(newRecording);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      
      // Update refs
      isPausedRef.current = false;
      recordingStartTimeRef.current = startTime;
      pausedDurationRef.current = 0;

      // Start duration counter
      durationInterval.current = setInterval(() => {
        if (!isPausedRef.current && recordingStartTimeRef.current > 0) {
          const elapsed = (Date.now() - recordingStartTimeRef.current - pausedDurationRef.current) / 1000;
          setDuration(Math.max(0, elapsed));
        }
      }, 100);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      if (onCancel) onCancel();
    }
  };

  const pauseRecording = async () => {
    if (!recording || isPaused) return;

    try {
      await recording.pauseAsync();
      setIsPaused(true);
      const pauseTime = Date.now();
      setPausedStartTime(pauseTime);
      isPausedRef.current = true;
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const resumeRecording = async () => {
    if (!recording || !isPaused) return;

    try {
      await recording.startAsync();
      const pauseTime = Date.now() - pausedStartTime;
      const newPausedDuration = pausedDurationRef.current + pauseTime;
      
      setIsPaused(false);
      pausedDurationRef.current = newPausedDuration;
      recordingStartTimeRef.current = Date.now();
      
      // Update refs
      isPausedRef.current = false;
      pausedDurationRef.current = newPausedDuration;
      recordingStartTimeRef.current = Date.now();
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  };

  const stopRecording = async (shouldCancel: boolean = false) => {
    if (!recording) return;

    try {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri && !shouldCancel && duration >= 0.5) {
        // Minimum 0.5 seconds
        onRecordingComplete(uri, Math.round(duration));
      } else if (shouldCancel && onCancel) {
        onCancel();
      }

      setRecording(null);
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      pausedDurationRef.current = 0;
      
      // Reset refs
      isPausedRef.current = false;
      recordingStartTimeRef.current = 0;
      pausedDurationRef.current = 0;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
      setRecording(null);
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      
      // Reset refs
      isPausedRef.current = false;
      recordingStartTimeRef.current = 0;
      pausedDurationRef.current = 0;
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => stopRecording(true),
        },
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Request audio permissions on mount
    Audio.requestPermissionsAsync().catch(console.error);
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    }).catch(console.error);

    // Start recording automatically when component mounts
    startRecording();

    // Start slide in animation
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0], // Slide in from right
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Show loading state while starting recording
  if (!isRecording) {
    return (
      <View style={styles.recordingContainer}>
        <Text style={styles.timer}>0:00</Text>
      </View>
    );
  }

  // Recording interface
  return (
    <Animated.View
      style={[
        styles.recordingContainer,
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      {/* Timer */}
      <Text style={styles.timer}>{formatDuration(duration)}</Text>

      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        activeOpacity={0.7}
      >
        <FontAwesome name="trash" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Pause/Resume button */}
      <TouchableOpacity
        style={styles.pauseButton}
        onPress={handlePauseResume}
        activeOpacity={0.7}
      >
        <FontAwesome
          name={isPaused ? 'play' : 'pause'}
          size={16}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* Waveform indicator */}
      <WaveformIndicator isPaused={isPaused} duration={duration} />

      {/* Send button */}
      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => stopRecording(false)}
        activeOpacity={0.7}
      >
        <FontAwesome name="send" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  microphoneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  microphoneButtonDisabled: {
    opacity: 0.5,
  },
  recordingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.grey[800] || '#1F2937',
    borderRadius: 21,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
  },
  timer: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    marginRight: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pauseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    marginRight: 8,
    gap: 2,
  },
  waveformBar: {
    width: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoiceRecorder;
