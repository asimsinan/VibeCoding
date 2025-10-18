import { PrismaClient } from '@prisma/client';
import type { Design, CreateDesignInput, UpdateDesignInput } from '../models/Design.js';

const prisma = new PrismaClient();

export class DesignService {
  async createDesign(input: CreateDesignInput): Promise<Design> {
    // Validate name
    if (!input.name || input.name.length === 0 || input.name.length > 100) {
      throw new Error('Name must be between 1 and 100 characters');
    }

    // Validate placed furniture
    for (const pf of input.placedFurniture) {
      if (!pf.position || typeof pf.position !== 'object') {
        throw new Error('Invalid position');
      }
      if (!pf.rotation || typeof pf.rotation !== 'object') {
        throw new Error('Invalid rotation');
      }
      if (typeof pf.scale !== 'number' || pf.scale < 0.2 || pf.scale > 3.0) {
        throw new Error('Invalid scale (must be between 0.2 and 3.0)');
      }
    }

    // Calculate total cost
    const furnitureIds = input.placedFurniture.map(pf => pf.furnitureId);
    const furniture = await prisma.furnitureItem.findMany({
      where: { id: { in: furnitureIds } },
    });
    const totalCost = furniture.reduce((sum, item) => sum + item.price, 0);

    // Create design
    const design = await prisma.design.create({
      data: {
        userId: input.userId,
        roomPhotoId: input.roomPhotoId,
        name: input.name,
        totalCost,
      },
    });

    // Create placed furniture
    for (const pf of input.placedFurniture) {
      await prisma.placedFurniture.create({
        data: {
          designId: design.id,
          furnitureId: pf.furnitureId,
          position: JSON.stringify(pf.position),
          rotation: JSON.stringify(pf.rotation),
          scale: pf.scale,
        },
      });
    }

    return design;
  }

  async listDesigns(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [designs, total] = await Promise.all([
      prisma.design.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          placedFurniture: {
            select: { id: true },
          },
        },
      }),
      prisma.design.count({ where: { userId } }),
    ]);

    const designList = designs.map(d => ({
      id: d.id,
      name: d.name,
      furnitureCount: d.placedFurniture.length,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    return {
      designs: designList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDesignById(id: string): Promise<any> {
    const design = await prisma.design.findUnique({
      where: { id },
      include: {
        placedFurniture: {
          include: {
            furnitureItem: true,
          },
        },
        roomPhoto: {
          select: {
            id: true,
            filename: true,
            url: true,
            dimensions: true,
            surfaces: true,
            status: true,
          },
        },
      },
    });

    if (!design) {
      throw new Error('Design not found');
    }

    // Parse JSON fields and format response
    return {
      ...design,
      roomPhoto: design.roomPhoto ? {
        ...design.roomPhoto,
        dimensions: design.roomPhoto.dimensions ? JSON.parse(design.roomPhoto.dimensions as string) : null,
        surfaces: design.roomPhoto.surfaces ? JSON.parse(design.roomPhoto.surfaces as string) : null,
      } : null,
      placedFurniture: design.placedFurniture.map(pf => ({
        id: pf.id,
        furnitureId: pf.furnitureId,
        position: pf.position,
        rotation: pf.rotation,
        scale: pf.scale,
        furnitureItem: pf.furnitureItem,
      })),
    };
  }

  async updateDesign(id: string, input: UpdateDesignInput): Promise<Design> {
    const data: any = {};
    if (input.name) data.name = input.name;

    if (input.placedFurniture) {
      // Delete existing placed furniture
      await prisma.placedFurniture.deleteMany({
        where: { designId: id },
      });

      // Create new placed furniture
      for (const pf of input.placedFurniture) {
        await prisma.placedFurniture.create({
          data: {
            designId: id,
            furnitureId: pf.furnitureId,
            position: JSON.stringify(pf.position),
            rotation: JSON.stringify(pf.rotation),
            scale: pf.scale,
          },
        });
      }

      // Recalculate total cost
      const furnitureIds = input.placedFurniture.map(pf => pf.furnitureId);
      const furniture = await prisma.furnitureItem.findMany({
        where: { id: { in: furnitureIds } },
      });
      data.totalCost = furniture.reduce((sum, item) => sum + item.price, 0);
    }

    return prisma.design.update({
      where: { id },
      data,
    });
  }

  async deleteDesign(id: string): Promise<void> {
    await prisma.design.delete({
      where: { id },
    });
  }
}

