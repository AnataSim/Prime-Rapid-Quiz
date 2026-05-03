/**
 * Validates a password based on strict security requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special symbol (!@#$%^&* etc.)
 * 
 * @param password The password string to validate
 * @returns An error message string if invalid, or null if valid
 */
export const validatePassword = (password: string): string | null => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  // Matches most common special symbols, including underscore, dash, etc.
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=~]/.test(password);

  if (password.length < minLength) {
    return "Password must be at least 8 characters long.";
  }
  if (!hasUppercase) {
    return "Password must contain at least one uppercase letter (A-Z).";
  }
  if (!hasLowercase) {
    return "Password must contain at least one lowercase letter (a-z).";
  }
  if (!hasNumber) {
    return "Password must contain at least one number (0-9).";
  }
  if (!hasSymbol) {
    return "Password must contain at least one special symbol (!@#$%^&* etc.).";
  }
  
  return null;
};
