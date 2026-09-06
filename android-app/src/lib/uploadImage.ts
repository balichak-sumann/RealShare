import { Platform } from 'react-native';

export const uploadImageToFirebase = async (uri: string, path: string): Promise<string> => {
  try {
    console.log('Skipping Firebase Storage, converting image to Base64...');
    
    // For web, fetch the blob and convert to base64
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to Base64:', error);
    throw error;
  }
};
