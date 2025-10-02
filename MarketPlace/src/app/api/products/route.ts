// Products API - List and Create
// API routes for product listing and creation

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

// Request validation schema for POST
const CreateProductSchema = z.object({
  title: z.string().min(1, 'Product title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Product description is required').max(2000, 'Description too long'),
  price: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: 'Price must be a valid positive number' }),
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long'),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required').max(10, 'Too many images'),
  stock: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Products GET request started');
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || undefined;
    const query = searchParams.get('search') || undefined;
    const sellerId = searchParams.get('sellerId') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'price' | 'title';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit' },
        { status: 400 }
      );
    }

    // Validate price parameters
    if (minPrice !== undefined && (isNaN(minPrice) || minPrice < 0)) {
      return NextResponse.json(
        { error: 'Invalid minimum price' },
        { status: 400 }
      );
    }

    if (maxPrice !== undefined && (isNaN(maxPrice) || maxPrice < 0)) {
      return NextResponse.json(
        { error: 'Invalid maximum price' },
        { status: 400 }
      );
    }

    // Get products using direct Prisma query
    console.log('[API] Initializing Prisma client');
    const prisma = new PrismaClient();
    
    // Build where clause
    const where: any = {
      isAvailable: true,
    };

    if (category) {
      // Map old category slugs to new category names
      const categoryMapping: Record<string, string> = {
        'electronics': 'Electronics',
        'clothing': 'Clothing',
        'home-garden': 'Home & Garden',
        'books': 'Books',
        'sports': 'Sports',
        'automotive': 'Automotive',
        'toys-games': 'Toys & Games',
        'health-beauty': 'Health & Beauty',
      };
      
      where.category = categoryMapping[category] || category;
    }
    
    if (sellerId) {
      where.sellerId = sellerId;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get total count
    console.log('[API] Getting total count with where clause:', JSON.stringify(where));
    const total = await prisma.product.count({ where });

    // Get products with pagination
    console.log('[API] Getting products with pagination');
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    const result = {
      products,
      total,
    };

    console.log('[API] Products query successful, returning result');
    return NextResponse.json(
      {
        products: result.products || [],
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasNext: page < Math.ceil(result.total / limit),
          hasPrev: page > 1,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[API] Get products error:', error);
    console.error('[API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decodedToken: any;
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = CreateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const productData = validation.data;

    // Create product using direct Prisma query
    const prisma = new PrismaClient();
    const newProduct = await prisma.product.create({
      data: {
        title: productData.title,
        description: productData.description,
        price: parseFloat(productData.price), // Convert string to number
        category: productData.category,
        images: productData.images,
        sellerId: decodedToken.userId, // Get sellerId from JWT token
        isAvailable: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product: newProduct,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[API] Create product error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create product',
      },
      { status: 500 }
    );
  }
}