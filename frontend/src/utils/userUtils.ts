/**
 * User utility functions
 * Helper functions for formatting and displaying user data
 */

/**
 * Formats a user's full name from first and last name parts
 * @param firstName - User's first name (can be null/undefined/empty)
 * @param lastName - User's last name (can be null/undefined/empty)
 * @param fallback - Fallback text when no name is available (default: 'No name provided')
 * @returns Formatted full name or fallback
 */
export function formatUserName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback: string = 'No name provided'
): string {
  const parts = [firstName, lastName].filter(
    (part) => part !== null && part !== undefined && part !== ''
  );

  if (parts.length === 0) {
    return fallback;
  }

  return parts.join(' ');
}

/**
 * Gets initials from user's name or email
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param email - User's email (fallback for initials)
 * @returns 1-2 character initials
 */
export function getUserInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email?: string | null | undefined
): string {
  // If both first and last name provided
  if (firstName && lastName) {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  }

  // Helper to get first character of email local part (before @)
  const getEmailFirstChar = (emailStr: string): string | null => {
    const localPart = emailStr.split('@')[0];
    if (localPart && localPart.length > 0) {
      return localPart.charAt(0);
    }
    return null;
  };

  // If only first name provided
  if (firstName && firstName.length > 0) {
    const firstInitial = firstName.charAt(0).toUpperCase();

    // Try to get second initial from email (first char of email, lowercase)
    if (email) {
      const emailChar = getEmailFirstChar(email);
      if (emailChar) {
        return `${firstInitial}${emailChar.toLowerCase()}`;
      }
    }

    // Fallback with 'U' as second initial
    return `${firstInitial}U`;
  }

  // If only last name provided (rare case)
  if (lastName && lastName.length > 0) {
    return lastName.charAt(0).toUpperCase();
  }

  // Try to get initials from email
  if (email) {
    const localPart = email.split('@')[0];
    if (localPart && localPart.length > 0) {
      const firstChar = localPart.charAt(0).toUpperCase();
      // If email local part has more than 1 character, use first char uppercase + first char lowercase
      // If only 1 character, use first char uppercase + 'U'
      if (localPart.length > 1) {
        return `${firstChar}${localPart.charAt(0).toLowerCase()}`;
      }
      return `${firstChar}U`;
    }
  }

  // Ultimate fallback
  return 'U';
}
