import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { termsAndConditionsData } from '@/content/termsAndConditions';
import styles, { colors } from '@/styles/screens/user/termsAndConditionsStyles';

const TermsAndConditionsScreen: React.FC = () => {
  const router = useRouter();

  const renderSection = (section: { title: string; content: string }, index: number) => {
    // Split content by lines to render them properly
    const lines = section.content.split('\n').filter(line => line.trim() !== '');
    
    return (
      <View key={index} style={styles.section}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View>
          {lines.map((line, lineIndex) => {
            const trimmedLine = line.trim();
            // Check if line starts with bullet point
            if (trimmedLine.startsWith('•')) {
              return (
                <Text key={lineIndex} style={[styles.sectionContent, styles.bulletPoint]}>
                  {trimmedLine}{'\n'}
                </Text>
              );
            }
            return (
              <Text key={lineIndex} style={styles.sectionContent}>
                {trimmedLine}{lineIndex < lines.length - 1 ? '\n\n' : ''}
              </Text>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.statusBarBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{termsAndConditionsData.title}</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Title and Metadata */}
        <Text style={styles.title}>{termsAndConditionsData.title}</Text>
        <Text style={styles.metadata}>
          Last updated: {termsAndConditionsData.lastUpdated} • Version {termsAndConditionsData.version}
        </Text>

        {/* Sections */}
        {termsAndConditionsData.sections.map((section, index) => 
          renderSection(section, index)
        )}
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsAndConditionsScreen;

