// Category Counts API
// API endpoint for getting product counts by category

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    // Get product counts grouped by category
    const categoryCounts = await prisma.product.groupBy({
      by: ['category'],
      where: {
        isAvailable: true, // Only count available products
      },
      _count: {
        category: true,
      },
    });

    // Transform the results into a more usable format
    const counts = categoryCounts.reduce((acc, item) => {
      acc[item.category] = item._count.category;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      counts,
      totalCategories: categoryCounts.length,
    });
  } catch (error) {
    console.error('Error fetching category counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category counts' },
      { status: 500 }
    );
  }
}
