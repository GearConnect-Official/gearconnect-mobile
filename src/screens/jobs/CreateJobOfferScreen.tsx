import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import styles from "@/styles/screens/jobs/createJobOfferStyles";
import theme from "@/styles/config/theme";

// Couleur racing principale
const RACING_RED = "#E10600";
const PRIMARY_BLUE = "#3a86ff";

// Constantes pour les types d'emploi
const JOB_TYPES = [
  { id: "fulltime", label: "Full-time" },
  { id: "parttime", label: "Part-time" },
  { id: "contract", label: "Contract" },
  { id: "freelance", label: "Freelance" },
  { id: "internship", label: "Internship" },
];

// Styles supplémentaires locaux
const localStyles = StyleSheet.create({
  datePickerContainer: {
    width: "100%",
  },
  datePickerIOSContainer: {
    alignSelf: "center" as const,
    width: "100%",
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
  },
  datePickerStyle: {
    width: "100%",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  confirmButton: {
    backgroundColor: RACING_RED,
  },
  cancelText: {
    color: "#333",
    fontWeight: "600",
  },
  confirmText: {
    color: "white",
    fontWeight: "600",
  },
  // Nouveaux styles inspirés de la section Events
  heroSection: {
    padding: 24,
    backgroundColor: "#f0f7ff",
    marginBottom: 16,
    borderRadius: 8,
  },
  heroTitle: {
    fontSize: 24,
    color: "#1E1E1E",
    fontWeight: "bold",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#666",
    maxWidth: "90%",
  },
  sectionDivider: {
    height: 8,
    backgroundColor: "#f5f5f5",
    marginVertical: 16,
  },
  ctaSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  ctaGradient: {
    padding: 24,
  },
  ctaTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
  },
  submitButtonCta: {
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    alignSelf: "flex-start",
  },
  submitButtonCtaText: {
    color: PRIMARY_BLUE,
    fontWeight: "bold",
  },
});

const CreateJobOfferScreen: React.FC = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    price: "",
    jobType: "fulltime", // par défaut
    company: "",
    location: "",
  });

  // États pour la sélection de date
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // États temporaires pour la sélection Android
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const handleSubmit = () => {
    // TODO: Implement job offer creation logic
    console.log("Form submitted:", formData);
    router.back();
  };

  const selectJobType = (typeId: string) => {
    setFormData({ ...formData, jobType: typeId });
  };

  // Gestionnaires pour les dates sur iOS
  const openStartDatePicker = () => {
    if (Platform.OS === "ios") {
      setShowEndDatePicker(false);
      setShowStartDatePicker(true);
    } else {
      // Sur Android, on utilise un modal personnalisé
      setTempStartDate(startDate);
      setShowStartModal(true);
    }
  };

  const openEndDatePicker = () => {
    if (Platform.OS === "ios") {
      setShowStartDatePicker(false);
      setShowEndDatePicker(true);
    } else {
      // Sur Android, on utilise un modal personnalisé
      setTempEndDate(endDate);
      setShowEndModal(true);
    }
  };

  // Gestionnaires pour iOS DateTimePicker
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "ios") {
      const currentDate = selectedDate || startDate;
      setStartDate(currentDate);

      if (selectedDate) {
        const formattedDate = currentDate.toLocaleDateString("fr-FR");
        setFormData({ ...formData, startDate: formattedDate });
      }
    } else {
      setShowStartDatePicker(false);
      if (event.type === "set" && selectedDate) {
        setTempStartDate(selectedDate);
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "ios") {
      const currentDate = selectedDate || endDate;
      setEndDate(currentDate);

      if (selectedDate) {
        const formattedDate = currentDate.toLocaleDateString("fr-FR");
        setFormData({ ...formData, endDate: formattedDate });
      }
    } else {
      setShowEndDatePicker(false);
      if (event.type === "set" && selectedDate) {
        setTempEndDate(selectedDate);
      }
    }
  };

  // Gestionnaires pour les modals Android
  const confirmStartDate = () => {
    setStartDate(tempStartDate);
    const formattedDate = tempStartDate.toLocaleDateString("en-US");
    setFormData({ ...formData, startDate: formattedDate });
    setShowStartModal(false);
  };

  const confirmEndDate = () => {
    setEndDate(tempEndDate);
    const formattedDate = tempEndDate.toLocaleDateString("en-US");
    setFormData({ ...formData, endDate: formattedDate });
    setShowEndModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={24} color="#1E232C" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Create Job Offer</Text>
          <View style={{ width: 24 }}></View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
      >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero section */}
        <View style={localStyles.heroSection}>
          <Text style={localStyles.heroTitle}>Create Your Dream Team</Text>
          <Text style={localStyles.heroSubtitle}>
            Find the perfect candidates by creating an attractive job offer
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Basic Information</Text>

        {/* Title Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <FontAwesome name="briefcase" size={18} color={RACING_RED} />
            <Text style={styles.labelText}>Job Title</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Enter the job offer title"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 350, animated: true }), 100)}
          />
          <Text style={styles.inputInfo}>
            Make it descriptive and appealing to candidates
          </Text>
        </View>

        {/* Company Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <FontAwesome name="building" size={18} color={RACING_RED} />
            <Text style={styles.labelText}>Company</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Enter the company name"
            value={formData.company}
            onChangeText={(text) => setFormData({ ...formData, company: text })}
            onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 450, animated: true }), 100)}
          />
        </View>

        {/* Location Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <FontAwesome name="map-marker" size={18} color={RACING_RED} />
            <Text style={styles.labelText}>Location</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Enter job location (city, remote, etc.)"
            value={formData.location}
            onChangeText={(text) =>
              setFormData({ ...formData, location: text })
            }
            onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 550, animated: true }), 100)}
          />
        </View>

        {/* Job Type Selection */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <FontAwesome name="clock-o" size={18} color={RACING_RED} />
            <Text style={styles.labelText}>Job Type</Text>
          </View>
          <View style={styles.jobTypeRow}>
            {JOB_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.jobTypeOption,
                  formData.jobType === type.id && styles.jobTypeSelected,
                ]}
                onPress={() => selectJobType(type.id)}
              >
                <Text
                  style={[
                    styles.jobTypeText,
                    formData.jobType === type.id && styles.jobTypeSelectedText,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={localStyles.sectionDivider} />

        <Text style={styles.sectionTitle}>Detailed Information</Text>

        {/* Description Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <FontAwesome name="file-text" size={18} color={RACING_RED} />
            <Text style={styles.labelText}>Description</Text>
          </View>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            placeholder="Provide a detailed description of the job including requirements, responsibilities, and benefits"
            multiline
            numberOfLines={6}
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 800, animated: true }), 100)}
          />
          <Text style={styles.inputInfo}>
            Be specific and engaging to attract qualified candidates
          </Text>
        </View>

        <View style={localStyles.sectionDivider} />

        <Text style={styles.sectionTitle}>Timeline & Compensation</Text>

        {/* Date Picker Row */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <FontAwesome name="calendar" size={18} color={RACING_RED} />
            <Text style={styles.labelText}>Timeline</Text>
          </View>
          <View style={styles.datePickerRow}>
            <View style={styles.datePickerColumn}>
              <Text style={styles.jobTypeText}>Start Date</Text>
              <TouchableOpacity
                style={styles.datePickerInput}
                onPress={openStartDatePicker}
              >
                <Text style={styles.datePickerText}>
                  {formData.startDate || "Select date"}
                </Text>
                <FontAwesome name="calendar" size={18} color="#1E232C" />
              </TouchableOpacity>
              {Platform.OS === "ios" && showStartDatePicker && (
                <View style={localStyles.datePickerIOSContainer}>
                  <DateTimePicker
                    testID="startDatePicker"
                    value={startDate}
                    mode="date"
                    display="spinner"
                    onChange={onStartDateChange}
                    minimumDate={new Date()}
                    style={localStyles.datePickerStyle}
                  />
                </View>
              )}
            </View>
            <View style={styles.datePickerColumn}>
              <Text style={styles.jobTypeText}>End Date</Text>
              <TouchableOpacity
                style={styles.datePickerInput}
                onPress={openEndDatePicker}
              >
                <Text style={styles.datePickerText}>
                  {formData.endDate || "Select date"}
                </Text>
                <FontAwesome name="calendar" size={18} color="#1E232C" />
              </TouchableOpacity>
              {Platform.OS === "ios" && showEndDatePicker && (
                <View style={localStyles.datePickerIOSContainer}>
                  <DateTimePicker
                    testID="endDatePicker"
                    value={endDate}
                    mode="date"
                    display="spinner"
                    onChange={onEndDateChange}
                    minimumDate={startDate}
                    style={localStyles.datePickerStyle}
                  />
                </View>
              )}
            </View>
          </View>
          <Text style={styles.inputInfo}>
            The job post will be active from the start date until the end date
          </Text>
        </View>

        {/* Price Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <FontAwesome name="money" size={18} color={RACING_RED} />
            <Text style={styles.labelText}>Compensation</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Enter the salary range or compensation"
            keyboardType="default"
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 1100, animated: true }), 100)}
          />
          <Text style={styles.inputInfo}>
            Be clear about compensation to attract the right candidates
          </Text>
        </View>

        {/* CTA Section */}
        <View style={localStyles.ctaSection}>
          <LinearGradient
            colors={[theme.colors.primary.main, theme.colors.primary.dark]}
            style={localStyles.ctaGradient}
          >
            <Text style={localStyles.ctaTitle}>
              Ready to Find Your Perfect Match?
            </Text>
            <Text style={localStyles.ctaText}>
              Publish your job offer and start connecting with talented
              professionals
            </Text>
            <TouchableOpacity
              style={localStyles.submitButtonCta}
              onPress={handleSubmit}
            >
              <Text style={localStyles.submitButtonCtaText}>Publish Now</Text>
              <FontAwesome
                name="arrow-right"
                size={16}
                color={theme.colors.primary.main}
              />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal for start date selector (Android) */}
      <Modal
        visible={showStartModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStartModal(false)}
      >
        <View style={localStyles.modalContainer}>
          <View style={localStyles.modalContent}>
            <Text style={styles.labelText}>Select Start Date</Text>
            {showStartModal && (
              <DateTimePicker
                testID="startDatePickerAndroid"
                value={tempStartDate}
                mode="date"
                display="default"
                onChange={onStartDateChange}
                minimumDate={new Date()}
              />
            )}
            <View style={localStyles.modalButtons}>
              <TouchableOpacity
                style={[localStyles.modalButton, localStyles.cancelButton]}
                onPress={() => setShowStartModal(false)}
              >
                <Text style={localStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[localStyles.modalButton, localStyles.confirmButton]}
                onPress={confirmStartDate}
              >
                <Text style={localStyles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for end date selector (Android) */}
      <Modal
        visible={showEndModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndModal(false)}
      >
        <View style={localStyles.modalContainer}>
          <View style={localStyles.modalContent}>
            <Text style={styles.labelText}>Select End Date</Text>
            {showEndModal && (
              <DateTimePicker
                testID="endDatePickerAndroid"
                value={tempEndDate}
                mode="date"
                display="default"
                onChange={onEndDateChange}
                minimumDate={startDate}
              />
            )}
            <View style={localStyles.modalButtons}>
              <TouchableOpacity
                style={[localStyles.modalButton, localStyles.cancelButton]}
                onPress={() => setShowEndModal(false)}
              >
                <Text style={localStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[localStyles.modalButton, localStyles.confirmButton]}
                onPress={confirmEndDate}
              >
                <Text style={localStyles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CreateJobOfferScreen;
