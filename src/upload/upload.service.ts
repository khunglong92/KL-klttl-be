import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import sharp, { Sharp, Metadata } from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { MinioService } from '../minio/minio.service';

// Constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_IMAGE_TYPES = ['jpeg', 'jpg', 'png', 'webp'];
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/html',
  'text/plain',
  'application/pdf',
];
const UPLOAD_BASE_PATH =
  process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');

type UploadOptions = {
  skipWatermark?: boolean;
};

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
}

export interface FileUrlResult {
  url: string;
  key: string;
}

@Injectable()
export class UploadService {
  private logoBuffer: Buffer | null = null;

  constructor(private readonly minioService: MinioService) {
    this.loadLogo();
  }

  private loadLogo() {
    // Try multiple paths to support both dev (src/) and production (dist/ or root)
    const possiblePaths = [
      path.join(process.cwd(), 'dist', 'images', 'logo.png'),
      path.join(process.cwd(), 'src', 'images', 'logo.png'),
      path.join(process.cwd(), 'images', 'logo.png'),
    ];

    for (const logoPath of possiblePaths) {
      try {
        if (fs.existsSync(logoPath)) {
          this.logoBuffer = fs.readFileSync(logoPath);
          console.log('✅ Logo loaded from:', logoPath);
          return;
        }
      } catch {
        console.warn('⚠️ Could not load logo from:', logoPath);
      }
    }

    console.error('❌ Logo file not found in any of:', possiblePaths);
    this.logoBuffer = null;
  }

  /**
   * Sanitize folder path để đảm bảo an toàn và tương thích với filesystem
   */
  private sanitizeFolderPath(folderPath: string): string {
    if (!folderPath) return 'general';

    // Loại bỏ path traversal
    if (folderPath.includes('..') || path.isAbsolute(folderPath)) {
      throw new BadRequestException(
        'Invalid folder path: path traversal detected',
      );
    }

    // Trim dấu / ở đầu và cuối
    const sanitized = folderPath.trim().replace(/^\/+|\/+$/g, '');

    if (!sanitized) return 'general';

    // Nếu path chứa /, slugify từng segment
    if (sanitized.includes('/')) {
      const segments = sanitized.split('/');
      const sanitizedSegments = segments.map((segment) => {
        const trimmed = segment.trim();
        if (!trimmed) return null;
        return slugify(trimmed, { lower: true, strict: true, locale: 'vi' });
      });
      return sanitizedSegments.filter((s) => s !== null && s !== '').join('/');
    }

    return slugify(sanitized, { lower: true, strict: true, locale: 'vi' });
  }

  /**
   * Get presigned URL for uploading a file directly to MinIO
   */
  async getPresignedUploadUrl(params: {
    folder: string;
    filename: string;
    contentType: string;
    categoryId?: number;
    entityName?: string;
    productId?: string;
    customKey?: string;
    isDetailedDescription?: boolean;
  }): Promise<PresignedUploadResult> {
    const {
      folder,
      filename,
      contentType,
      categoryId,
      entityName,
      productId,
      customKey,
      isDetailedDescription,
    } = params;

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.includes(contentType.toLowerCase())) {
      throw new BadRequestException(
        `Content type ${contentType} is not allowed`,
      );
    }

    // Use customKey if provided (for overwriting), otherwise generate one
    const key =
      customKey ||
      this.minioService.generateKey(folder, filename, {
        categoryId,
        entityName,
        productId,
        isDetail: isDetailedDescription,
      });

    // Get presigned URL
    const uploadUrl = await this.minioService.getPresignedUploadUrl(
      key,
      contentType,
    );

    return { uploadUrl, key };
  }

  /**
   * Get presigned download URL for a file
   * Supports both MinIO keys and legacy local filesystem URLs
   */
  async getFileUrl(key: string): Promise<FileUrlResult> {
    // Check if it's already a full URL (legacy data)
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return { url: key, key };
    }

    // Hybrid approach: Check if file exists locally FIRST
    // This ensures that if we fell back to local storage (due to MinIO error),
    // we serve the file from local correctly instead of generating a broken MinIO URL.
    const localPath = path.join(UPLOAD_BASE_PATH, key);
    if (fs.existsSync(localPath)) {
      const url = `${process.env.PUBLIC_BASE_URL}/uploads/${key}`;
      return { url, key };
    }

    // Check if MinIO is available
    if (!this.minioService.isAvailable()) {
      // Fallback to local filesystem URL if local file check didn't find it but MinIO is down
      // (This effectively 404s later, but follows logic)
      const url = `${process.env.PUBLIC_BASE_URL}/uploads/${key}`;
      return { url, key };
    }

    // Get presigned download URL from MinIO
    try {
      const url = await this.minioService.getPresignedDownloadUrl(key);
      return { url, key };
    } catch (error) {
      console.warn(
        `Failed to get MinIO presigned URL for ${key}, falling back to local URL construction`,
        error,
      );
      // Fallback to local URL if MinIO fails (e.g. connection error)
      const url = `${process.env.PUBLIC_BASE_URL}/uploads/${key}`;
      return { url, key };
    }
  }

  /**
   * Get presigned download URLs for multiple files
   */
  async getMultipleFileUrls(keys: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    await Promise.all(
      keys.map(async (key) => {
        const { url } = await this.getFileUrl(key);
        results[key] = url;
      }),
    );

    return results;
  }

  /**
   * Upload image với watermark (giữ lại cho backward compatibility)
   * Image will be uploaded to MinIO if available, otherwise to local filesystem
   */
  async uploadImage(
    buffer: Buffer,
    folder?: string,
    categoryId?: number,
    entityName?: string,
    options?: UploadOptions & { productId?: string; mimetype?: string },
  ): Promise<{
    url: string;
    public_id: string;
    width?: number;
    height?: number;
    bytes?: number;
    format?: string;
  }> {
    try {
      const shouldApplyWatermark = !options?.skipWatermark;
      const productId = options?.productId;
      const mimetype = options?.mimetype;

      // Validate file size
      if (buffer.length > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        );
      }

      let format: string;
      let processedBuffer: Buffer;
      let width: number | undefined;
      let height: number | undefined;

      // Handle HTML files specially
      if (mimetype === 'text/html') {
        format = 'html';
        processedBuffer = buffer;
        // No watermark, no resize
      } else {
        // Handle Images
        try {
          const metadata: Metadata = await sharp(buffer).metadata();
          const originalFormat = metadata.format;

          if (
            !originalFormat ||
            !ALLOWED_IMAGE_TYPES.includes(originalFormat)
          ) {
            // Nếu format không hợp lệ, convert sang JPG
            processedBuffer = await sharp(buffer)
              .jpeg({ quality: 90 })
              .toBuffer();
            format = 'jpg';
          } else {
            // Nếu hợp lệ, giữ nguyên
            processedBuffer = buffer;
            format = originalFormat;
          }

          // Thêm watermark nếu cần
          if (shouldApplyWatermark) {
            processedBuffer = await this.addWatermark(processedBuffer);
          }

          width = metadata.width;
          height = metadata.height;
        } catch {
          // If sharp fails (e.g. not an image), throw error unless we want to allow allowing it as generic file?
          // For now, assuming only images and HTML are allowed via this endpoint.
          // But strict error message helps.
          throw new BadRequestException('Invalid image format');
        }
      }

      // Generate filename
      const filename = `${uuidv4()}.${format}`;
      const sanitizedFolder = this.sanitizeFolderPath(folder || 'general');

      let subFolderPath: string;
      const safeEntityName = entityName
        ? slugify(entityName, { lower: true, strict: true, locale: 'vi' })
        : undefined;

      if (sanitizedFolder.includes('/')) {
        subFolderPath = sanitizedFolder;
      } else if (sanitizedFolder === 'products') {
        if (productId) {
          subFolderPath = `${sanitizedFolder}/${productId}/images`;
        } else if (categoryId && safeEntityName) {
          subFolderPath = `${sanitizedFolder}/${categoryId}/${safeEntityName}/images`;
        } else {
          subFolderPath = safeEntityName
            ? `${sanitizedFolder}/${safeEntityName}/images`
            : `${sanitizedFolder}/images`;
        }
      } else {
        subFolderPath = safeEntityName
          ? `${sanitizedFolder}/${safeEntityName}`
          : sanitizedFolder;
      }

      const public_id = `${subFolderPath}/${filename}`;

      // Try to upload to MinIO first, fallback to local filesystem
      let uploadedToMinIO = false;

      if (this.minioService.isAvailable()) {
        try {
          await this.minioService.uploadBuffer(
            public_id,
            processedBuffer,
            mimetype || `image/${format === 'jpg' ? 'jpeg' : format}`,
          );

          const presignedUrl =
            await this.minioService.getPresignedDownloadUrl(public_id);

          uploadedToMinIO = true;

          // Return key instead of full URL - FE will call getFileUrl to get presigned URL
          return {
            url: presignedUrl, // Return presigned URL for immediate display
            public_id, // Return key for storage in DB
            width,
            height,
            bytes: processedBuffer.length,
            format,
          };
        } catch (minioError) {
          console.error(
            '⚠️ MinIO Upload Failed (likely network or config issue). Falling back to local filesystem.',
            minioError,
          );
          // Fall through to local save
        }
      }

      // Fallback to local filesystem (if MinIO unavailable OR upload failed)
      if (!uploadedToMinIO) {
        if (!process.env.PUBLIC_BASE_URL) {
          throw new InternalServerErrorException(
            'PUBLIC_BASE_URL is not configured',
          );
        }

        const fullPath = path.join(UPLOAD_BASE_PATH, public_id);
        await this.saveToLocal(processedBuffer, fullPath);

        const url = `${process.env.PUBLIC_BASE_URL}/uploads/${public_id}`;
        return {
          url,
          public_id,
          width,
          height,
          bytes: processedBuffer.length,
          format,
        };
      }

      // Should not reach here, but for TS safety:
      throw new InternalServerErrorException('Unexpected upload state');
    } catch (err) {
      console.error('❌ Upload execution failed:', err); // Enhanced logging
      if (err instanceof BadRequestException) throw err;
      const message = err instanceof Error ? err.message : 'Upload failed';
      throw new InternalServerErrorException(message);
    }
  }

  private async saveToLocal(buffer: Buffer, fullPath: string): Promise<void> {
    try {
      // Create directory recursively if it doesn't exist
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
      // Write the file
      await fs.promises.writeFile(fullPath, buffer);
    } catch (error) {
      console.error(
        `❌ Error saving file to ${fullPath}:`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException(
        `Failed to save file locally: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async addWatermark(buffer: Buffer): Promise<Buffer> {
    if (!this.logoBuffer) {
      return buffer;
    }

    try {
      const image: Sharp = sharp(buffer);
      const metadata: Metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        console.error('Could not get image metadata. Skipping watermark.');
        return buffer;
      }

      const logoWidth = Math.round(metadata.width * 0.2);
      const resizedLogoBuffer: Buffer = await sharp(this.logoBuffer)
        .resize({ width: logoWidth })
        .toBuffer();

      const resizedLogoMetadata: Metadata =
        await sharp(resizedLogoBuffer).metadata();
      if (!resizedLogoMetadata.width || !resizedLogoMetadata.height) {
        console.error(
          'Could not get resized logo metadata. Skipping watermark.',
        );
        return buffer;
      }

      const PADDING = 10;
      const top = PADDING;
      const left = PADDING;

      return image
        .composite([
          {
            input: resizedLogoBuffer,
            top: top > 0 ? top : 0,
            left: left > 0 ? left : 0,
          },
        ])
        .toBuffer();
    } catch (error) {
      console.error('Error applying watermark:', error);
      return buffer;
    }
  }

  /**
   * Delete image from MinIO or local filesystem
   */
  async deleteImage(public_id: string): Promise<{ result: string }> {
    try {
      // Validate public_id to prevent path traversal attacks
      if (public_id.includes('..') || path.isAbsolute(public_id)) {
        throw new BadRequestException('Invalid public_id format');
      }

      // Try to delete from MinIO first
      if (this.minioService.isAvailable()) {
        await this.minioService.deleteObject(public_id);
        return { result: 'ok' };
      }

      // Fallback to local filesystem
      const fullPath = path.join(UPLOAD_BASE_PATH, public_id);

      // Attempt to delete the file directly
      try {
        await fs.promises.unlink(fullPath);
      } catch (error: any) {
        // If file doesn't exist (ENOENT), treat as success (idempotent)
        if (error.code !== 'ENOENT') {
          // Re-throw other errors
          throw new BadRequestException(
            `Failed to delete local file: ${error.message}`,
          );
        }
        console.warn(`⚠️ File not found (already deleted?): ${public_id}`);
      }

      // Delete empty folders recursively (best effort)
      await this.deleteEmptyLocalFolder(path.dirname(fullPath));

      return { result: 'ok' };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      const message = err instanceof Error ? err.message : 'Delete failed';
      throw new InternalServerErrorException(message);
    }
  }

  private async deleteEmptyLocalFolder(folder: string): Promise<void> {
    try {
      // Don't delete the base upload folder
      while (folder !== UPLOAD_BASE_PATH) {
        const files = await fs.promises.readdir(folder);

        // If folder is not empty, stop
        if (files.length > 0) {
          break;
        }

        // Delete empty folder
        await fs.promises.rmdir(folder);

        // Move to parent folder
        folder = path.dirname(folder);
      }
    } catch (error) {
      // Don't throw error if we can't delete empty folders
      console.warn('Error checking/deleting empty folder:', error);
    }
  }
}
