import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class SharedDesignService {
  async createShare(designId: string, userId: string, expiresInDays: number = 30) {
    // Generate unique share token
    const shareToken = crypto.randomBytes(16).toString('hex');
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return prisma.sharedDesign.create({
      data: {
        designId,
        userId,
        shareToken,
        expiresAt,
        viewCount: 0,
      },
    });
  }

  async findByToken(token: string) {
    const sharedDesign = await prisma.sharedDesign.findUnique({
      where: { shareToken: token },
      include: {
        design: {
          include: {
            roomPhoto: true,
            placedFurniture: {
              include: {
                furnitureItem: true,
              },
            },
          },
        },
      },
    });

    if (!sharedDesign) return null;

    // Check if expired
    if (new Date() > sharedDesign.expiresAt) {
      return null;
    }

    // Increment view count
    await prisma.sharedDesign.update({
      where: { id: sharedDesign.id },
      data: { viewCount: sharedDesign.viewCount + 1 },
    });

    // Parse JSON strings
    return {
      ...sharedDesign,
      design: {
        ...sharedDesign.design,
        placedFurniture: sharedDesign.design.placedFurniture.map((pf) => ({
          ...pf,
          position: JSON.parse(pf.position),
          rotation: JSON.parse(pf.rotation),
          furnitureItem: {
            ...pf.furnitureItem,
            dimensions: JSON.parse(pf.furnitureItem.dimensions),
          },
        })),
      },
    };
  }

  async findByDesignId(designId: string) {
    const shares = await prisma.sharedDesign.findMany({
      where: { designId },
      orderBy: { createdAt: 'desc' },
    });

    return shares;
  }

  async deleteShare(id: string) {
    await prisma.sharedDesign.delete({
      where: { id },
    });
  }
}

