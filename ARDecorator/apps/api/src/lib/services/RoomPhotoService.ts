import { prisma } from '../../config/database.js';
import { put } from '@vercel/blob';

export interface CreateRoomPhotoInput {
  userId: string;
  filename: string;
  url: string;
  dimensions?: { width: number; height: number; depth: number };
  surfaces?: string[];
  depthGeometry?: any;
  textureData?: any;
}

export interface UpdateRoomPhotoInput {
  dimensions?: { width: number; height: number; depth: number };
  surfaces?: string[];
  status?: string;
  textureData?: any;
}

export class RoomPhotoService {
  async uploadToBlob(imageBuffer: Buffer, filename: string): Promise<string> {
    try {
      const blob = await put(filename, imageBuffer, {
        access: 'public',
        contentType: 'image/jpeg',
      });
      return blob.url;
    } catch (error) {
      console.error('Error uploading to Vercel Blob:', error);
      throw new Error('Failed to upload image to storage');
    }
  }

  async create(data: CreateRoomPhotoInput) {
    return prisma.roomPhoto.create({
      data: {
        userId: data.userId,
        filename: data.filename,
        url: data.url,
        dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null,
        surfaces: data.surfaces ? JSON.stringify(data.surfaces) : null,
        depthGeometry: data.depthGeometry ? JSON.stringify(data.depthGeometry) : null,
        textureData: data.textureData ? JSON.stringify(data.textureData) : null,
        status: 'processing',
      },
    });
  }

  async findById(id: string) {
    const photo = await prisma.roomPhoto.findUnique({
      where: { id },
    });

    if (!photo) return null;

    try {
      return {
        ...photo,
        dimensions: photo.dimensions ? JSON.parse(photo.dimensions) : null,
        surfaces: photo.surfaces ? JSON.parse(photo.surfaces) : null,
        depthGeometry: photo.depthGeometry ? JSON.parse(photo.depthGeometry) : null,
        textureData: photo.textureData ? JSON.parse(photo.textureData) : null,
      };
    } catch (error) {
      console.error('Error parsing room photo data:', error);
      // Return photo without parsed data if parsing fails
      return {
        ...photo,
        dimensions: null,
        surfaces: null,
        depthGeometry: null,
        textureData: null,
      };
    }
  }

  async findByUserId(userId: string) {
  
    try {

      const photos = await prisma.roomPhoto.findMany({
        where: { userId },
        select: {
          id: true,
          filename: true,
          url: true,
          status: true,
          createdAt: true,
        },
      });
      
  
      
      return photos.map((photo) => {
        return {
          id: photo.id,
          userId: userId, // Use the input userId
          filename: photo.filename,
          url: photo.url, // Use the actual URL from database
          status: photo.status,
          dimensions: null,
          surfaces: null,
          depthGeometry: null,
          textureData: null,
          createdAt: photo.createdAt?.toISOString() || new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('🔍 Error in findByUserId:', error);
      throw error;
    }
  }

  async update(id: string, data: UpdateRoomPhotoInput) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Room photo not found');
    }

    const updateData: any = {};

    if (data.dimensions) {
      updateData.dimensions = JSON.stringify(data.dimensions);
    }
    if (data.surfaces) {
      updateData.surfaces = JSON.stringify(data.surfaces);
    }
    if (data.status) {
      const validStatuses = ['processing', 'completed', 'failed'];
      if (!validStatuses.includes(data.status)) {
        throw new Error('Invalid status');
      }
      updateData.status = data.status;
    }
    if (data.textureData) {
      updateData.textureData = JSON.stringify(data.textureData);
    }

    const updated = await prisma.roomPhoto.update({
      where: { id },
      data: updateData,
    });

    return {
      ...updated,
      dimensions: updated.dimensions ? JSON.parse(updated.dimensions) : null,
      surfaces: updated.surfaces ? JSON.parse(updated.surfaces) : null,
      depthGeometry: updated.depthGeometry ? JSON.parse(updated.depthGeometry) : null,
      textureData: updated.textureData ? JSON.parse(updated.textureData) : null,
    };
  }

  async delete(id: string) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Room photo not found');
    }

    await prisma.roomPhoto.delete({
      where: { id },
    });
  }

  async updateOwnership(id: string, newUserId: string) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Room photo not found');
    }

    const updated = await prisma.roomPhoto.update({
      where: { id },
      data: {
        userId: newUserId,
      },
    });

    return {
      ...updated,
      dimensions: updated.dimensions ? JSON.parse(updated.dimensions) : null,
      surfaces: updated.surfaces ? JSON.parse(updated.surfaces) : null,
      depthGeometry: updated.depthGeometry ? JSON.parse(updated.depthGeometry) : null,
      textureData: updated.textureData ? JSON.parse(updated.textureData) : null,
    };
  }

  async updateTextureData(id: string, textureData: any) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Room photo not found');
    }

    const updated = await prisma.roomPhoto.update({
      where: { id },
      data: {
        textureData: textureData ? JSON.stringify(textureData) : null,
      },
    });

    return {
      ...updated,
      dimensions: updated.dimensions ? JSON.parse(updated.dimensions) : null,
      surfaces: updated.surfaces ? JSON.parse(updated.surfaces) : null,
      depthGeometry: updated.depthGeometry ? JSON.parse(updated.depthGeometry) : null,
      textureData: updated.textureData ? JSON.parse(updated.textureData) : null,
    };
  }

  async deleteAllByUserId(userId: string) {
    const result = await prisma.roomPhoto.deleteMany({
      where: { userId },
    });
    return result.count;
  }
}

