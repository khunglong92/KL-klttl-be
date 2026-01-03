import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import * as path from 'path';

@Injectable()
export class MinioService implements OnModuleInit {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT;
    const accessKey = process.env.MINIO_ACCESS_KEY;
    const secretKey = process.env.MINIO_SECRET_KEY;
    const bucket = process.env.MINIO_BUCKET;
    const region = process.env.MINIO_REGION || 'us-east-1';

    if (!endpoint || !accessKey || !secretKey || !bucket) {
      console.warn(
        '⚠️ MinIO configuration is incomplete. MinIO features will be disabled.',
      );
      return;
    }

    this.bucket = bucket;
    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });

    console.log(`✅ MinIO client initialized with endpoint: ${endpoint}`);
  }

  async onModuleInit() {
    if (!this.s3Client) return;

    try {
      // Check if bucket exists
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      console.log(`✅ MinIO bucket "${this.bucket}" is accessible`);
    } catch (error: any) {
      const statusCode = error.$metadata?.httpStatusCode;

      if (statusCode === 404 || error.name === 'NotFound') {
        // Create bucket if it doesn't exist
        try {
          await this.s3Client.send(
            new CreateBucketCommand({ Bucket: this.bucket }),
          );
          console.log(`✅ Created MinIO bucket: ${this.bucket}`);
        } catch (createError: any) {
          console.error(
            '❌ Failed to create MinIO bucket:',
            createError.message || createError,
          );
        }
      } else if (statusCode === 403) {
        // Permission denied - bucket likely exists but we don't have HeadBucket permission
        // This is common with restricted IAM policies, so we'll assume bucket exists
        console.warn(
          `⚠️ MinIO HeadBucket permission denied (403). Assuming bucket "${this.bucket}" exists. ` +
            `If uploads fail, please ensure the bucket exists and has proper permissions.`,
        );
      } else {
        console.error(
          `❌ Failed to check MinIO bucket: ${error.message || error.name || 'Unknown error'}`,
          `(Status: ${statusCode || 'unknown'})`,
        );
      }
    }
  }

  /**
   * Check if MinIO is configured and available
   */
  isAvailable(): boolean {
    return !!this.s3Client;
  }

  /**
   * Generate a unique object key based on folder structure
   */
  generateKey(
    folder: string,
    filename: string,
    options?: {
      categoryId?: number;
      entityName?: string;
      productId?: string;
      isDetail?: boolean;
    },
  ): string {
    // Sanitize folder path
    const sanitizedFolder = this.sanitizeFolderPath(folder);

    // Extract file extension
    const ext = path.extname(filename).toLowerCase() || '.jpg';

    // Generate unique filename or use a fixed one if it's a detail file
    const uniqueFilename =
      options?.isDetail && options?.productId
        ? `detailed-description${ext}`
        : `${uuidv4()}${ext}`;

    // Build path based on folder type
    let subFolderPath: string;
    const safeEntityName = options?.entityName
      ? slugify(options.entityName, { lower: true, strict: true, locale: 'vi' })
      : undefined;

    if (sanitizedFolder.includes('/')) {
      subFolderPath = sanitizedFolder;
    } else if (sanitizedFolder === 'products') {
      if (options?.productId) {
        // Luôn dùng productId cố định để folder không bị đổi khi đổi tên SP
        // Thêm subfolder images/content để đúng cấu trúc
        const subSubFolder = options.isDetail ? 'content' : 'images';
        subFolderPath = `${sanitizedFolder}/${options.productId}/${subSubFolder}`;
      } else if (options?.categoryId && safeEntityName) {
        const subSubFolder = options.isDetail ? 'content' : 'images';
        subFolderPath = `${sanitizedFolder}/${options.categoryId}/${safeEntityName}/${subSubFolder}`;
      } else {
        const subSubFolder = options?.isDetail ? 'content' : 'images';
        subFolderPath = safeEntityName
          ? `${sanitizedFolder}/${safeEntityName}/${subSubFolder}`
          : `${sanitizedFolder}/${subSubFolder}`;
      }
    } else {
      subFolderPath = safeEntityName
        ? `${sanitizedFolder}/${safeEntityName}`
        : sanitizedFolder;
    }

    return `${subFolderPath}/${uniqueFilename}`;
  }

  private sanitizeFolderPath(folderPath: string): string {
    if (!folderPath) return 'general';

    // Remove path traversal attempts
    if (folderPath.includes('..') || path.isAbsolute(folderPath)) {
      throw new InternalServerErrorException(
        'Invalid folder path: path traversal detected',
      );
    }

    // Trim slashes
    const sanitized = folderPath.trim().replace(/^\/+|\/+$/g, '');

    if (!sanitized) return 'general';

    // Slugify each segment
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
   * Get presigned URL for uploading a file
   * @param key Object key in MinIO
   * @param contentType MIME type of the file
   * @param expiresIn Expiration time in seconds (default 5 minutes)
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 300,
  ): Promise<string> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('MinIO is not configured');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get presigned URL for downloading/viewing a file
   * @param key Object key in MinIO
   * @param expiresIn Expiration time in seconds (default 1 hour)
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    // If key is already an absolute URL (http/https), return it as is
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }

    if (!this.s3Client) {
      throw new InternalServerErrorException('MinIO is not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Upload a buffer directly to MinIO
   * @param key Object key
   * @param buffer File buffer
   * @param contentType MIME type
   */
  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('MinIO is not configured');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
  }

  /**
   * Delete an object from MinIO
   * @param key Object key to delete
   */
  async deleteObject(key: string): Promise<void> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('MinIO is not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
    console.log(`✅ Deleted object from MinIO: ${key}`);
  }

  /**
   * Delete all objects with a specific prefix (folder cleanup)
   * @param prefix Prefix to delete
   */
  async deleteObjectsByPrefix(prefix: string): Promise<void> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('MinIO is not configured');
    }

    try {
      // List all objects with prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      });

      console.log(
        `MinioService: Listing objects with prefix '${prefix}' in bucket '${this.bucket}'`,
      );

      const listResponse = await this.s3Client.send(listCommand);
      const objects = listResponse.Contents;

      if (!objects || objects.length === 0) {
        return;
      }

      // Prepare batch delete
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: objects.map((obj) => ({ Key: obj.Key })),
          Quiet: true,
        },
      });

      await this.s3Client.send(deleteCommand);
      console.log(
        `✅ Deleted ${objects.length} objects with prefix "${prefix}" from MinIO`,
      );
    } catch (error: any) {
      console.error(
        `❌ Failed to delete objects by prefix "${prefix}":`,
        error,
      );
      // We don't throw here to ensure other operations can continue
    }
  }
}
