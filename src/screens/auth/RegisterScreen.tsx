import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import styles from "@/styles/auth/registerStyles";
import componentStyles from "@/styles/auth/registerComponentStyles";
import { useAuth } from "@/context/AuthContext"; // Import useAuth hook
import { trackAuth, trackScreenView } from "@/utils/mixpanelTracking";

const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const auth = useAuth();
  const register = auth?.register;
  const isLoading = auth?.isLoading ?? false;
  const scrollViewRef = useRef<ScrollView>(null);

  // Input states
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Track screen view
  React.useEffect(() => {
    trackScreenView('Register');
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Username validation
    if (!username) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must contain at least 3 characters";
    }

    // Name validation
    if (!name) {
      newErrors.name = "Name is required";
    }

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Please provide a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Password confirmation is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle registration
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    if (!register) {
      setErrors({ general: "Registration function not available" });
      return;
    }

    const result = await register(username, email, password, name);

    if (result.success) {
      trackAuth.register('email');
      router.push("/(auth)/login");
    } else {
      // Réinitialiser les erreurs précédentes
      setErrors({});

      // Gestion des différents types d'erreurs
      if (result.error?.toLowerCase().includes("email")) {
        setErrors({ email: result.error });
      } else if (result.error?.toLowerCase().includes("username")) {
        setErrors({ username: result.error });
      } else if (result.error?.toLowerCase().includes("password")) {
        setErrors({ password: result.error });
      } else if (result.error && /server|serveur|unable to connect|connexion|connection|vérifiez|check your connection/i.test(result.error)) {
        setErrors({ general: "Unable to connect to the server. Please check your connection." });
      } else {
        setErrors({ general: result.error || "An error occurred. Please try again." });
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/(auth)/welcome")}
        activeOpacity={0.7}
      >
        <FontAwesome name="arrow-left" size={24} color="#1E232C" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={componentStyles.flexContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Title */}
            <Text style={styles.title}>Welcome! Glad to see you!</Text>

            {/* General error message */}
            {errors.general && (
              <Text style={styles.generalError}>{errors.general}</Text>
            )}

            {/* Input fields */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.username ? styles.inputError : null,
                ]}
                placeholder="Username"
                placeholderTextColor="#8391A1"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username) {
                    setErrors({ ...errors, username: "" });
                  }
                }}
                onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 300, animated: true }), 100)}
              />
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : null]}
                placeholder="Name"
                placeholderTextColor="#8391A1"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors({ ...errors, name: "" });
                  }
                }}
                onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 380, animated: true }), 100)}
              />
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="Email"
                placeholderTextColor="#8391A1"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({ ...errors, email: "" });
                  }
                }}
                onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 460, animated: true }), 100)}
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.password ? styles.inputError : null,
                ]}
                placeholder="Password"
                placeholderTextColor="#8391A1"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors({ ...errors, password: "" });
                  }
                }}
                onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 540, animated: true }), 100)}
              />
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.confirmPassword ? styles.inputError : null,
                ]}
                placeholder="Confirm password"
                placeholderTextColor="#8391A1"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: "" });
                  }
                }}
                onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 620, animated: true }), 100)}
              />
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            {/* Register button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.registerButtonText}>
                  Accept and Register
                </Text>
              )}
            </TouchableOpacity>

            {/* Social network registration */}
            <Text style={styles.orText}>Or register with</Text>
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome name="facebook" size={26} color="#3b5998" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome name="apple" size={26} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome name="google" size={26} color="#db4437" />
              </TouchableOpacity>
            </View>

            {/* Login text link - Fixed structure */}
            <TouchableOpacity
              style={{ marginTop: 20 }}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text
                style={{ color: "#6A707C", fontSize: 15, textAlign: "center" }}
              >
                Already have an account?{" "}
                <Text style={{ color: "#E53935", fontWeight: "bold" }}>
                  Log in
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

