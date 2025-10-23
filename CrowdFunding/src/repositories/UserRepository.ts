import { PrismaClient, User, UserRole } from '@prisma/client';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  avatar?: string;
  bio?: string;
}

export interface UpdateUserData {
  name?: string;
  password?: string;
  avatar?: string;
  bio?: string;
  role?: UserRole;
}

export interface UserStats {
  campaignsCount: number;
  donationsCount: number;
  totalDonated: number;
  totalRaised: number;
}

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: CreateUserData): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role || UserRole.USER,
        avatar: data.avatar,
        bio: data.bio
      }
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        avatar: data.avatar,
        bio: data.bio,
        role: data.role
      }
    });
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await this.prisma.user.delete({
      where: { id }
    });
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count()
    ]);

    return { users, total, page, limit };
  }

  async getUserStats(id: string): Promise<UserStats> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const [campaignsCount, donationsCount, totalDonated, totalRaised] = await Promise.all([
      this.prisma.campaign.count({ where: { ownerId: id } }),
      this.prisma.donation.count({ where: { donorId: id } }),
      this.prisma.donation.aggregate({
        where: { donorId: id },
        _sum: { amount: true }
      }),
      this.prisma.campaign.aggregate({
        where: { ownerId: id },
        _sum: { current: true }
      })
    ]);

    return {
      campaignsCount,
      donationsCount,
      totalDonated: Number(totalDonated._sum.amount) || 0,
      totalRaised: Number(totalRaised._sum.current) || 0
    };
  }
}
