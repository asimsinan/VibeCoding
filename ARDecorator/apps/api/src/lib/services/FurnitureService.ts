import { PrismaClient } from '@prisma/client';
import type { FurnitureItem, CreateFurnitureInput, UpdateFurnitureInput, FurnitureListFilters } from '../models/FurnitureItem.js';

const prisma = new PrismaClient();

export class FurnitureService {
  async createFurniture(input: CreateFurnitureInput): Promise<FurnitureItem> {
    // Validate dimensions
    if (!input.dimensions || typeof input.dimensions !== 'object') {
      throw new Error('Invalid dimensions');
    }

    // Validate price
    if (input.price <= 0) {
      throw new Error('Price must be positive');
    }

    const item = await prisma.furnitureItem.create({
      data: {
        name: input.name,
        description: input.description,
        category: input.category,
        style: input.style,
        price: input.price,
        dimensions: JSON.stringify(input.dimensions),
        modelUrl: input.modelUrl,
        thumbnailUrl: input.thumbnailUrl,
      },
    });

    return item;
  }

  async listFurniture(filters: FurnitureListFilters, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.category) where.category = filters.category;
    if (filters.style) where.style = filters.style;
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.furnitureItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.furnitureItem.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFurnitureById(id: string): Promise<FurnitureItem | null> {
    return prisma.furnitureItem.findUnique({
      where: { id },
    });
  }

  async updateFurniture(id: string, input: UpdateFurnitureInput): Promise<FurnitureItem> {
    const data: any = {};
    if (input.name) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.category) data.category = input.category;
    if (input.style !== undefined) data.style = input.style;
    if (input.price) data.price = input.price;
    if (input.dimensions) {
      if (typeof input.dimensions !== 'object') {
        throw new Error('Invalid dimensions');
      }
      data.dimensions = JSON.stringify(input.dimensions);
    }
    if (input.modelUrl) data.modelUrl = input.modelUrl;
    if (input.thumbnailUrl) data.thumbnailUrl = input.thumbnailUrl;

    return prisma.furnitureItem.update({
      where: { id },
      data,
    });
  }

  async deleteFurniture(id: string): Promise<void> {
    await prisma.furnitureItem.delete({
      where: { id },
    });
  }
}

