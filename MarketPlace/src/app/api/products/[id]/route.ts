// Individual Product API
// API endpoint for fetching, updating, and deleting a single product by ID

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

// GET - Get a single product by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
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

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Validation schema for product updates
const UpdateProductSchema = z.object({
  title: z.string().min(1, 'Product title is required').max(200, 'Title too long').optional(),
  description: z.string().min(1, 'Product description is required').max(2000, 'Description too long').optional(),
  price: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: 'Price must be a valid positive number' }).optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long').optional(),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required').max(10, 'Too many images').optional(),
  isAvailable: z.boolean().optional(),
});

// PUT - Update a product by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();

    // Validate request body
    const validation = UpdateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Check if product exists and belongs to the authenticated user
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { sellerId: true }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (existingProduct.sellerId !== decodedToken.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only edit your own products' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updatePayload: any = {};
    if (updateData.title) updatePayload.title = updateData.title;
    if (updateData.description) updatePayload.description = updateData.description;
    if (updateData.price) updatePayload.price = parseFloat(updateData.price);
    if (updateData.category) updatePayload.category = updateData.category;
    if (updateData.images) updatePayload.images = updateData.images;
    if (updateData.isAvailable !== undefined) updatePayload.isAvailable = updateData.isAvailable;

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updatePayload,
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

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Check if product exists and belongs to the authenticated user
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { sellerId: true }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (existingProduct.sellerId !== decodedToken.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own products' },
        { status: 403 }
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}