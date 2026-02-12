import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  // TODO: Replace with Cloudinary/S3 integration
  async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    // Placeholder: In production, upload to Cloudinary or S3
    const url = `https://placeholder.com/uploads/${file.originalname}`;
    const publicId = `hotelslit/${Date.now()}_${file.originalname}`;
    return { url, publicId };
  }

  async uploadImages(files: Express.Multer.File[]): Promise<{ url: string; publicId: string }[]> {
    return Promise.all(files.map((file) => this.uploadImage(file)));
  }
}
