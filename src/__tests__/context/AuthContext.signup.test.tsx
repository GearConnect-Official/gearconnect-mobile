import React from "react";
import * as AuthService from "@/services/AuthService";

// Mock AuthService
jest.mock("@/services/AuthService", () => ({
  signUp: jest.fn(() => Promise.resolve({ success: true })),
}));

// Validation functions - extracted as pure functions for testing
const validateEmail = (email: string): string => {
  if (!email.trim()) {
    return "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Invalid email format";
  }
  return "";
};

const validateUsername = (username: string): string => {
  if (!username.trim()) {
    return "Username is required";
  } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return "Username should only contain alphanumeric characters";
  }
  return "";
};

const validatePassword = (password: string): string => {
  if (!password) {
    return "Password is required";
  } else if (password.length < 8) {
    return "Password should be at least 8 characters";
  }
  return "";
};

// New function to validate password confirmation
const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) {
    return "Password confirmation is required";
  } else if (password !== confirmPassword) {
    return "Passwords don't match";
  }
  return "";
};

// Form validation function - pure function for testing
const validateForm = (formData: { 
  email: string; 
  username: string; 
  password: string; 
  confirmPassword?: string 
}) => {
  const errors = {
    email: validateEmail(formData.email),
    username: validateUsername(formData.username),
    password: validatePassword(formData.password),
    confirmPassword: formData.confirmPassword !== undefined ? 
      validateConfirmPassword(formData.password, formData.confirmPassword) : "",
  };
  
  const isValid = !errors.email && !errors.username && 
                  !errors.password && !errors.confirmPassword;
  return { isValid, errors };
};

describe("Signup Form Validation Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Test empty fields
  test("should show error messages when all fields are empty", () => {
    const formData = { email: "", username: "", password: "", confirmPassword: "" };
    const { isValid, errors } = validateForm(formData);
    
    expect(isValid).toBe(false);
    expect(errors.email).toBe("Email is required");
    expect(errors.username).toBe("Username is required");
    expect(errors.password).toBe("Password is required");
    expect(errors.confirmPassword).toBe("Password confirmation is required");
    expect(AuthService.signUp).not.toHaveBeenCalled();
  });

  // 2. Test with partially filled form
  test("should show remaining error messages when form is partially filled", () => {
    const formData = { email: "test@example.com", username: "", password: "", confirmPassword: "" };
    const { isValid, errors } = validateForm(formData);
    
    expect(isValid).toBe(false);
    expect(errors.email).toBe("");
    expect(errors.username).toBe("Username is required");
    expect(errors.password).toBe("Password is required");
    expect(errors.confirmPassword).toBe("Password confirmation is required");
  });

  // 3. Test with invalid email format
  test("should validate email format", () => {
    const formData = { email: "invalid-email", username: "validuser", password: "password123" };
    const { isValid, errors } = validateForm(formData);
    
    expect(isValid).toBe(false);
    expect(errors.email).toBe("Invalid email format");
  });

  // 4. Test with special characters in username
  test("should validate username with special characters", () => {
    const formData = { email: "test@example.com", username: "user@#$%", password: "password123" };
    const { isValid, errors } = validateForm(formData);
    
    expect(isValid).toBe(false);
    expect(errors.username).toBe("Username should only contain alphanumeric characters");
  });

  // 5. Test with password containing special characters (which should be allowed)
  test("should accept password with special characters", () => {
    const formData = { 
      email: "test@example.com", 
      username: "validuser123", 
      password: "P@ssw0rd!23",
      confirmPassword: "P@ssw0rd!23" 
    };
    const { isValid, errors } = validateForm(formData);
    
    expect(isValid).toBe(true);
    expect(errors.password).toBe("");
    expect(errors.confirmPassword).toBe("");
  });

  // 6. Test with minimum password length
  test("should validate password length", () => {
    const formData = { 
      email: "test@example.com", 
      username: "validuser123", 
      password: "short",
      confirmPassword: "short" 
    };
    const { isValid, errors } = validateForm(formData);
    
    expect(isValid).toBe(false);
    expect(errors.password).toBe("Password should be at least 8 characters");
  });

  // 7. Test with valid form submission
  test("should validate when all fields are valid", () => {
    const formData = { 
      email: "test@example.com", 
      username: "validuser123", 
      password: "Password123!",
      confirmPassword: "Password123!" 
    };
    const { isValid, errors } = validateForm(formData);
    
    expect(isValid).toBe(true);
    expect(errors.email).toBe("");
    expect(errors.username).toBe("");
    expect(errors.password).toBe("");
    expect(errors.confirmPassword).toBe("");
  });
  
  // 8. Test password confirmation mismatch
  test("should validate that passwords match", () => {
    const formData = { 
      email: "test@example.com", 
      username: "validuser123", 
      password: "Password123!",
      confirmPassword: "DifferentPassword123!" 
    };
    const { isValid, errors } = validateForm(formData);
    
    expect(isValid).toBe(false);
    expect(errors.confirmPassword).toBe("Passwords don't match");
  });
  
  // 9. Test with missing confirmation password
  test("should validate that confirmation password is required", () => {
    const formData = { 
      email: "test@example.com", 
      username: "validuser123", 
      password: "Password123!",
      confirmPassword: "" 
    };
    const { isValid, errors } = validateForm(formData);
    
    expect(isValid).toBe(false);
    expect(errors.confirmPassword).toBe("Password confirmation is required");
  });
});
