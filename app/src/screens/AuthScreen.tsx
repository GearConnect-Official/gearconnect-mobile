import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from "react-native";
import CustomTextInput from "../components/ui/CustomTextInput";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import authStyles from "../styles/auth/authStyles";
import { AppImages } from "../assets/images";
import { trackAuth, trackScreenView } from "../utils/mixpanelTracking";

const AuthScreen: React.FC = () => {
  const router = useRouter();
  const auth = useAuth();
  const login = auth?.login;
  const isLoading = auth?.isLoading ?? false;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [isDeletedAccount, setIsDeletedAccount] = useState(false);

  // Track screen view
  React.useEffect(() => {
    trackScreenView('Login');
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    setIsDeletedAccount(false);

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrors({});
    setIsDeletedAccount(false);

    if (!validateForm()) {
      return;
    }

    if (!login) return;
    const result = await login(email, password);
    if (result.success) {
      trackAuth.login('email');
    } else {
      if (result.error && /account has been deleted|deactivated|desactivated/i.test(result.error)) {
        setIsDeletedAccount(true);
        setErrors({
          general: "Your account has been deleted or deactivated.",
          email: " ",
          password: " ",
        });
      } else if (result.error === "Account not found") {
        setErrors({
          email: "Account not found",
          password: " ",
        });
      } else if (result.error === "Incorrect password") {
        setErrors({ password: "Incorrect password" });
      } else if (result.error?.toLowerCase().includes("unable to connect") || result.error?.toLowerCase().includes("check your connection")) {
        setErrors({ general: result.error || "Unable to connect to the server. Please check your connection." });
      } else {
        setErrors({ general: result.error || "An error occurred. Please try again." });
      }
    }
  };

  const clearErrors = () => {
    setErrors({});
    setIsDeletedAccount(false);
  };

  return (
    <SafeAreaView style={authStyles.container as ViewStyle}>
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity
        style={authStyles.backButton as ViewStyle}
        onPress={() => router.push("/(auth)/welcome")}
        activeOpacity={0.7}
      >
        <FontAwesome name="arrow-left" size={24} color="#1E232C" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={authStyles.keyboardAvoidingView as ViewStyle}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
      >
        <ScrollView
          style={authStyles.container as ViewStyle}
          contentContainerStyle={authStyles.scrollViewContainer as ViewStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={authStyles.contentContainer as ViewStyle}>
            <Image
              source={AppImages.logoRounded}
              style={authStyles.logo as ImageStyle}
            />

            <Text style={authStyles.title as TextStyle}>
              Welcome back! Glad to see you again!
            </Text>

            <View style={authStyles.inputContainer as ViewStyle}>
              <CustomTextInput
                style={[
                  authStyles.input as TextStyle,
                  (errors.email || isDeletedAccount) && (authStyles.inputError as TextStyle),
                ]}
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email || isDeletedAccount) {
                    clearErrors();
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8391A1"
                textContentType="emailAddress"
                autoComplete="email"
              />
              {errors.email && !isDeletedAccount && errors.email.trim() && (
                <Text style={authStyles.fieldError as TextStyle}>{errors.email}</Text>
              )}
            </View>

            <View style={authStyles.inputContainer as ViewStyle}>
              <View
                style={[
                  authStyles.passwordContainer as ViewStyle,
                  (errors.password || isDeletedAccount) &&
                    (authStyles.inputError as ViewStyle),
                ]}
              >
                <CustomTextInput
                  style={authStyles.passwordInput as TextStyle}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password || isDeletedAccount) {
                      clearErrors();
                    }
                  }}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#8391A1"
                  textContentType="password"
                  autoComplete="current-password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={authStyles.eyeIcon as ViewStyle}
                >
                  <FontAwesome
                    name={showPassword ? "eye" : "eye-slash"}
                    size={22}
                    color="#6A707C"
                  />
                </TouchableOpacity>
              </View>
              {errors.password &&
                !isDeletedAccount &&
                errors.password.trim() && (
                  <Text style={authStyles.fieldError as TextStyle}>{errors.password}</Text>
                )}
            </View>

            <TouchableOpacity
              style={authStyles.forgotPassword as ViewStyle}
              onPress={() => router.push("/(auth)/forgotPassword")}
            >
              <Text style={authStyles.forgotPasswordText as TextStyle}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <View style={authStyles.errorContainer as ViewStyle}>
              {isDeletedAccount && errors.general ? (
                <Text style={authStyles.deletedAccountError as TextStyle}>
                  {errors.general}
                </Text>
              ) : null}

              {!isDeletedAccount && errors.general ? (
                <Text style={authStyles.generalError as TextStyle}>{errors.general}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={authStyles.loginButton as ViewStyle}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={authStyles.loginButtonText as TextStyle}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={authStyles.dividerContainer as ViewStyle}>
              <View style={authStyles.dividerLine as ViewStyle} />
              <Text style={authStyles.dividerText as TextStyle}>Or Login with</Text>
              <View style={authStyles.dividerLine as ViewStyle} />
            </View>

            <View style={authStyles.socialButtonsContainer as ViewStyle}>
              <TouchableOpacity style={authStyles.socialButton as ViewStyle}>
                <FontAwesome name="facebook" size={24} color="#3b5998" />
              </TouchableOpacity>
              <TouchableOpacity style={authStyles.socialButton as ViewStyle}>
                <FontAwesome name="google" size={24} color="#db4437" />
              </TouchableOpacity>
              <TouchableOpacity style={authStyles.socialButton as ViewStyle}>
                <FontAwesome name="apple" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={authStyles.registerContainer as ViewStyle}
              onPress={() => router.push("/(auth)/register")}
            >
              <Text style={authStyles.registerText as TextStyle}>
                Don&apos;t have an account?{" "}
                <Text style={authStyles.registerLink as TextStyle}>Register Now</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreen;

