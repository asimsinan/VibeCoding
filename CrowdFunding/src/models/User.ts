import { PrismaClient, User, UserRole } from '@prisma/client';
import { IsEmail, IsString, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.USER;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean = false;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UserModel {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: CreateUserDto): Promise<User> {
    // Validate email uniqueness
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

  async update(id: string, data: UpdateUserDto): Promise<User> {
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

  async findAll(page: number = 1, limit: number = 20): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count()
    ]);

    return { users, total };
  }

  async getUserStats(id: string): Promise<{
    campaignsCount: number;
    donationsCount: number;
    totalDonated: number;
    totalRaised: number;
  }> {
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
