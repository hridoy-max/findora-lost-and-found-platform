import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Dedicated Supabase client for storage operations.
 * Using a separate client to avoid auth state pollution.
 */
const storageClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

/**
 * Uploads a file to the 'findora-images' bucket and returns the public URL.
 *
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} The public URL of the uploaded image.
 * @throws {Error} If the upload fails.
 */
export async function uploadItemImage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Using the NEW clean bucket: 'findora-images'
  const { data, error } = await storageClient.storage
    .from('findora-images')
    .upload(filePath, file);

  if (error) {
    console.error('Supabase Storage Error Details:', error);
    throw new Error(`Supabase Upload Error: ${error.message}`);
  }

  // Get the public URL
  const { data: publicUrlData } = storageClient.storage
    .from('findora-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
