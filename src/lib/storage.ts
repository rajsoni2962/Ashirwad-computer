import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

// Supabase configuration from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseKey);
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }
  return null;
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

export interface UploadResult {
  fileUrl: string;
  storageProvider: 'supabase' | 'local';
  fileName: string;
  sizeBytes: number;
}

/**
 * Uploads an optional supplier bill attachment (image or PDF).
 * Follows the data-first architecture:
 * - Uses Supabase Storage private bucket ('supplier-bills') when configured.
 * - Falls back to local disk storage when running locally without Supabase.
 * - Never stores raw base64 or file binary blobs inside the database record.
 */
export async function uploadSupplierBillAttachment(
  buffer: Buffer,
  originalFileName: string,
  mimeType: string
): Promise<UploadResult> {
  const supabase = getSupabaseClient();
  const safeExt = path.extname(originalFileName) || (mimeType === 'application/pdf' ? '.pdf' : '.png');
  const uniqueName = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${safeExt}`;

  if (supabase) {
    try {
      const bucketName = 'supplier-bills';
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(uniqueName, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (!error && data?.path) {
        // Return reference to Supabase Storage file
        const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
        return {
          fileUrl: publicData?.publicUrl || `/storage/${bucketName}/${data.path}`,
          storageProvider: 'supabase',
          fileName: uniqueName,
          sizeBytes: buffer.length,
        };
      }
      console.warn('Supabase upload failed, falling back to local storage:', error?.message);
    } catch (err) {
      console.warn('Error during Supabase Storage upload, falling back to local:', err);
    }
  }

  // Local private storage fallback (safe on read-only serverless filesystems like Vercel)
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'bills');
    await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, uniqueName);
    await writeFile(filePath, buffer);
  } catch (fsErr) {
    console.warn('Read-only filesystem on serverless runtime; skipping local file write:', (fsErr as any)?.code);
  }

  return {
    fileUrl: `/uploads/bills/${uniqueName}`,
    storageProvider: 'local',
    fileName: uniqueName,
    sizeBytes: buffer.length,
  };
}
