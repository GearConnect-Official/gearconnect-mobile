import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import CustomTextInput from "../components/ui/CustomTextInput";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useSignIn, useAuth } from "@clerk/clerk-expo";
import styles from "../styles/auth/forgotPasswordStyles";
import { useMessage } from '../context/MessageContext';
import { QuickMessages } from '../utils/messageUtils';

/**
 * ForgotPasswordScreen Component
 * 
 * This component handles password reset functionality using Clerk's built-in
 * password reset system. It follows the same architecture as the backend:
 * - All password management is delegated to Clerk
 * - No backend API calls needed for password reset
 * - Backend stores users without passwords (Clerk handles authentication)
 * 
 * Flow:
 * 1. User enters email
 * 2. Clerk sends reset code via email
 * 3. User enters code + new password
 * 4. Clerk validates and resets password
 * 5. User is automatically signed in
 */
const ForgotPasswordScreen: React.FC = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { showMessage, showError, showInfo } = useMessage();
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [secondFactor, setSecondFactor] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if user is already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/(app)/(tabs)/home");
    }
  }, [isSignedIn, router]);

  if (!isLoaded) {
    return null;
  }

  // Send the password reset code to the user's email
  // Uses Clerk's reset_password_email_code strategy
  const handleSendCode = async (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!signIn) {
      setError("Sign in service is not available");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Initiate password reset with Clerk
      // This will send an email with a verification code
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      setSuccessfulCreation(true);
      setError("");
      showMessage(QuickMessages.success("Password reset code has been sent to your email"));
    } catch (err: any) {
      console.error('Error sending reset code:', err);
      const errorMessage = err.errors?.[0]?.longMessage || err.message || "Failed to send reset code";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the user's password using the verification code
  // This completes the password reset flow with Clerk
  const handleResetPassword = async (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    
    if (!code) {
      setError("Please enter the verification code");
      return;
    }

    if (!password) {
      setError("Please enter your new password");
      return;
    }

    // Password validation to match backend/Clerk requirements
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!signIn) {
      setError("Sign in service is not available");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Complete the password reset with Clerk
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'needs_second_factor') {
        setSecondFactor(true);
        setError("");
        showInfo("Two-factor authentication is required to complete the password reset");
      } else if (result.status === 'complete') {
        // Set the active session to the newly created session (user is now signed in)
        await setActive({ session: result.createdSessionId });
        setError("");
        showMessage(QuickMessages.success("Your password has been reset successfully!"));
        router.push("/(app)/(tabs)/home");
      } else {
        console.log('Unexpected result status:', result);
        setError("Password reset failed. Please try again.");
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      const errorMessage = err.errors?.[0]?.longMessage || err.message || "Failed to reset password";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/(auth)/login");
  };

  const handleTryAgain = () => {
    setSuccessfulCreation(false);
    setEmail("");
    setCode("");
    setPassword("");
    setError("");
    setSecondFactor(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" />
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackToLogin}
        activeOpacity={0.7}
      >
        <FontAwesome name="arrow-left" size={24} color="#1E232C" />
      </TouchableOpacity>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          style={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {!successfulCreation ? (
            // Step 1: Enter email to receive reset code
            <>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Don&apos;t worry! It happens. Please enter the email address associated with your account.
              </Text>

              <CustomTextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8391A1"
                editable={!isLoading}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity 
                style={[styles.sendCodeButton, isLoading && styles.disabledButton]} 
                onPress={handleSendCode}
                disabled={isLoading}
              >
                <Text style={styles.sendCodeText}>
                  {isLoading ? "Sending..." : "Send Code"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Step 2: Enter verification code and new password
            <>
              {secondFactor ? (
                <View style={styles.secondFactorContainer}>
                  <Text style={styles.title}>2FA Required</Text>
                  <Text style={styles.subtitle}>
                    Two-factor authentication is required to complete the password reset. 
                    This interface doesn&apos;t handle 2FA yet.
                  </Text>
                  <TouchableOpacity style={styles.sendCodeButton} onPress={handleTryAgain}>
                    <Text style={styles.sendCodeText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.title}>Reset Password</Text>
                  <Text style={styles.subtitle}>
                    Enter the verification code sent to {email} and your new password.
                  </Text>

                  <CustomTextInput
                    style={styles.input}
                    placeholder="Enter verification code"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    placeholderTextColor="#8391A1"
                    editable={!isLoading}
                  />

                  <CustomTextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#8391A1"
                    editable={!isLoading}
                  />

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity 
                    style={[styles.sendCodeButton, isLoading && styles.disabledButton]} 
                    onPress={handleResetPassword}
                    disabled={isLoading}
                  >
                    <Text style={styles.sendCodeText}>
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
                    <Text style={styles.tryAgainText}>Try with different email</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          <View style={styles.rememberPasswordContainer}>
            <Text style={styles.rememberPasswordText}>Remember Password? </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
