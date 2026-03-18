import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from "@expo/vector-icons";
import styles from "@/styles/screens/jobs/jobsStyles";
import { jobsScreenStyles, RACING_COLORS } from "@/styles/screens/jobs/jobsScreenStyles";
import JobItem from "@/components/items/JobItem";
import { useRouter } from "expo-router";
import { trackScreenView } from "@/utils/mixpanelTracking";

const JobsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState("suggested");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Track screen view
  React.useEffect(() => {
    trackScreenView('Jobs');
  }, []);

  interface TabItem {
    key: string;
    label: string;
    icon: keyof typeof FontAwesome.glyphMap;
  }
  interface Job {
    icon: keyof typeof FontAwesome.glyphMap;
    title: string;
    subtitle: string;
    type: string;
  }

  interface JobsData {
    followed: Job[];
    suggested: Job[];
    applied: Job[];
  }

  const jobsData: JobsData = {
    followed: [
      {
        icon: "microphone",
        title: "Marketing Manager",
        subtitle: "Join our creative team",
        type: "Full-time",
      },
    ],
    suggested: [
      {
        icon: "car",
        title: "Manager",
        subtitle: "Join our creative team",
        type: "Part-time",
      },
      {
        icon: "wrench",
        title: "Race Engineer",
        subtitle: "Ferrari Racing Team",
        type: "Full-time",
      },
      {
        icon: "tachometer",
        title: "Performance Analyst",
        subtitle: "Alpine F1 Team",
        type: "Full-time",
      },
    ],
    applied: [
      {
        icon: "car",
        title: "F1 Driver Position",
        subtitle: "Click to learn more",
        type: "F1 Driver Career",
      },
    ],
  };

  const tabs: TabItem[] = [
    { key: "followed", label: "Following", icon: "users" },
    { key: "suggested", label: "Suggestions", icon: "star" },
    { key: "applied", label: "Applications", icon: "history" },
  ];

  const handleSearch = () => {
    if (searchQuery.length >= 3) {
      setIsLoading(true);
      // Simuler la recherche
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleJobPress = (job: Job) => {
    // Navigation vers le détail du job
    console.log("Job pressed:", job.title);
  };

  const handleCreateJob = () => {
    router.push('/(app)/createJobOffer');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={24} color="#1E232C" />
          </TouchableOpacity>
          <Text style={styles.title}>Jobs</Text>
          <View style={styles.topBarIcons}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateJob}
            >
              <FontAwesome name="plus" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome name="bell" size={24} color="#1E232C" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={jobsScreenStyles.scrollContent}>
        {/* Search Section */}
        <View style={jobsScreenStyles.searchSection}>
          <View style={jobsScreenStyles.searchBar}>
            <FontAwesome name="search" size={18} color={RACING_COLORS.textSecondary} />
            <TextInput
              style={jobsScreenStyles.searchInput}
              placeholder="Search for a job or company"
              placeholderTextColor={RACING_COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <FontAwesome name="times-circle" size={18} color={RACING_COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <Text style={jobsScreenStyles.searchInfo}>Enter at least 3 characters</Text>
          )}
        </View>

        {/* Tabs Section */}
        <View style={jobsScreenStyles.tabGroup}>
          {tabs.map((tab: TabItem) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                jobsScreenStyles.tab,
                activeTab === tab.key ? jobsScreenStyles.activeTab : {},
              ]}
            >
              <FontAwesome
                name={tab.icon}
                size={18}
                color={activeTab === tab.key ? "#FFFFFF" : RACING_COLORS.textPrimary}
                style={jobsScreenStyles.tabIcon}
              />
              <Text
                style={[
                  jobsScreenStyles.tabText,
                  activeTab === tab.key ? jobsScreenStyles.activeTabText : {},
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Jobs List Section */}
        <View style={jobsScreenStyles.jobsSection}>
          <View style={jobsScreenStyles.sectionHeader}>
            <Text style={jobsScreenStyles.sectionTitle}>
              {activeTab === "followed" && "Followed Jobs"}
              {activeTab === "suggested" && "Job Suggestions"}
              {activeTab === "applied" && "Submitted Applications"}
            </Text>
            <Text style={jobsScreenStyles.jobCount}>
              {jobsData[activeTab as keyof typeof jobsData].length} results
            </Text>
          </View>

          {isLoading ? (
            <View style={jobsScreenStyles.loadingContainer}>
              <ActivityIndicator size="large" color={RACING_COLORS.primary} />
              <Text style={jobsScreenStyles.loadingText}>Searching...</Text>
            </View>
          ) : jobsData[activeTab as keyof typeof jobsData].length === 0 ? (
            <View style={jobsScreenStyles.emptyContainer}>
              <FontAwesome name="search" size={50} color={RACING_COLORS.textSecondary} />
              <Text style={jobsScreenStyles.emptyText}>No jobs found</Text>
              <Text style={jobsScreenStyles.emptySubtext}>
                Try modifying your search criteria
              </Text>
            </View>
          ) : (
            jobsData[activeTab as keyof typeof jobsData].map((job, index) => (
              <JobItem
                key={index}
                icon={job.icon}
                title={job.title}
                subtitle={job.subtitle}
                type={job.type}
                onPress={() => handleJobPress(job)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobsScreen;
