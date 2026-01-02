import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Lazy initialization of R2 client (S3-compatible)
let r2Client = null;
const getR2Client = () => {
  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true, // Required for R2 - use path-style URLs
    });
  }
  return r2Client;
};

const getBucketName = () => process.env.R2_BUCKET_NAME;

/**
 * Configure CORS for the R2 bucket (run once)
 */
export const configureBucketCors = async () => {
  const corsConfig = {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedOrigins: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      },
    ],
  };

  const command = new PutBucketCorsCommand({
    Bucket: getBucketName(),
    CORSConfiguration: corsConfig,
  });

  try {
    await getR2Client().send(command);
    console.log('✅ R2 bucket CORS configured successfully');
    return true;
  } catch (error) {
    console.error('Failed to configure CORS:', error.message);
    return false;
  }
};

/**
 * Upload audio file to Cloudflare R2
 * @param {Buffer} fileBuffer - The audio file buffer
 * @param {string} userId - User ID for organizing files
 * @param {string} mimeType - Audio MIME type
 * @returns {Promise<{key: string, url: string, size: number}>}
 */
export const uploadAudio = async (fileBuffer, userId, mimeType = 'audio/webm') => {
  // Map MIME types to proper extensions
  const mimeMap = {
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
    'audio/m4a': 'm4a',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'video/webm': 'webm',
    'video/mp4': 'mp4',
  };
  const extension = mimeMap[mimeType] || 'webm';
  const key = `audio/${userId}/${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await getR2Client().send(command);

  // Generate a signed URL for access (valid for 7 days)
  const url = await getSignedUrl(getR2Client(), new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  }), { expiresIn: 604800 }); // 7 days

  return {
    key,
    url,
    size: fileBuffer.length
  };
};

/**
 * Get a signed URL for an existing audio file
 * @param {string} key - The R2 object key
 * @param {number} expiresIn - URL expiration in seconds (default 1 hour)
 * @returns {Promise<string>}
 */
export const getAudioUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  return await getSignedUrl(getR2Client(), command, { expiresIn });
};

/**
 * Delete an audio file from R2
 * @param {string} key - The R2 object key
 * @returns {Promise<void>}
 */
export const deleteAudio = async (key) => {
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  await getR2Client().send(command);
};

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType) {
  const mimeMap = {
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
    'audio/m4a': 'm4a',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'video/webm': 'webm',
    'video/mp4': 'mp4',
  };
  return mimeMap[mimeType] || 'webm';
}

/**
 * Generate a presigned URL for direct upload from client
 * @param {string} userId - User ID
 * @param {string} mimeType - Audio MIME type
 * @returns {Promise<{uploadUrl: string, key: string}>}
 */
export const getUploadUrl = async (userId, mimeType = 'audio/webm') => {
  const extension = getExtensionFromMimeType(mimeType);
  const key = `audio/${userId}/${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 });

  return { uploadUrl, key };
};

export default r2Client;
