/**
 * Image Utilities for CBT System
 * Handles image URL construction and validation
 */

/**
 * Get the base storage URL from environment
 * Default fallback if not configured
 */
export const getStorageBaseUrl = (): string => {
     const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://cbt-app.me:8000/api';
     // Remove /api suffix and add /storage
     const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
     return `${baseUrl}/storage`;
};

/**
 * Construct full image URL from storage path
 * @param imagePath - Relative path from storage (e.g., "question_images/abc123.jpg")
 * @returns Full URL or null if path is invalid
 */
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
     if (!imagePath || imagePath.trim() === '') {
          return null;
     }

     const storageBaseUrl = getStorageBaseUrl();
     // Remove leading slash if present
     const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

     return `${storageBaseUrl}/${cleanPath}`;
};

/**
 * Get image URL for a question
 * @param questionImage - Question image path from backend
 * @returns Full URL or null
 */
export const getQuestionImageUrl = (questionImage: string | null | undefined): string | null => {
     return getImageUrl(questionImage);
};

/**
 * Get image URL for a choice
 * @param choiceImagePath - Choice image path from backend
 * @returns Full URL or null
 */
export const getChoiceImageUrl = (choiceImagePath: string | null | undefined): string | null => {
     return getImageUrl(choiceImagePath);
};

/**
 * Check if a question has an image
 * @param questionImage - Question image path
 * @returns boolean
 */
export const hasQuestionImage = (questionImage: string | null | undefined): boolean => {
     return !!questionImage && questionImage.trim() !== '';
};

/**
 * Check if a choice has an image
 * @param choiceImages - Choices images object
 * @param choiceKey - The choice key to check (e.g., "0", "1", "A", "B")
 * @returns boolean
 */
export const hasChoiceImage = (
     choiceImages: Record<string, string | null> | null | undefined,
     choiceKey: string
): boolean => {
     if (!choiceImages || typeof choiceImages !== 'object') {
          return false;
     }

     const imagePath = choiceImages[choiceKey];
     return !!imagePath && imagePath.trim() !== '';
};

/**
 * Get all choice images URLs
 * @param choiceImages - Choices images object from backend
 * @returns Map of choice key to image URL
 */
export const getChoiceImagesMap = (
     choiceImages: Record<string, string | null> | null | undefined
): Record<string, string | null> => {
     if (!choiceImages || typeof choiceImages !== 'object') {
          return {};
     }

     const imagesMap: Record<string, string | null> = {};

     Object.entries(choiceImages).forEach(([key, path]) => {
          imagesMap[key] = getChoiceImageUrl(path);
     });

     return imagesMap;
};

/**
 * Validate image URL format
 * @param url - Image URL to validate
 * @returns boolean
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
     if (!url) return false;

     try {
          const urlObj = new URL(url);
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
     } catch {
          return false;
     }
};

/**
 * Get image file extension
 * @param imagePath - Image path or URL
 * @returns File extension (e.g., "jpg", "png") or null
 */
export const getImageExtension = (imagePath: string | null | undefined): string | null => {
     if (!imagePath) return null;

     const match = imagePath.match(/\.([a-zA-Z0-9]+)$/);
     return match ? match[1].toLowerCase() : null;
};

/**
 * Check if image is a valid format
 * @param imagePath - Image path or URL
 * @returns boolean
 */
export const isValidImageFormat = (imagePath: string | null | undefined): boolean => {
     const extension = getImageExtension(imagePath);
     const validFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
     return extension ? validFormats.includes(extension) : false;
};
