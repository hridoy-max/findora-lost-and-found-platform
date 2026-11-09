import { supabase } from './supabase';

/**
 * Uploads a file to the 'findora-items' bucket and returns the public URL.
 *
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} The public URL of the uploaded image.
 * @throws {Error} If the upload fails.
 */
export async function uploadItemImage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Use the Supabase client initialized with the ANON key.
  // We REMOVED the manual setSession call because the local JWT
  // is incompatible with Supabase Storage.
  const { error } = await supabase.storage
    .from('findora-items')
    .upload(filePath, file);

  if (error) {
    console.error('Supabase Storage Error Details:', error);
    throw new Error(`Supabase Upload Error: ${error.message}`);
  }

  // Get the public URL for the uploaded file
  const { publicUrlData } = supabase.storage
    .from('findora-items')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
