// Contact Message API
// API endpoints for individual contact message operations

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../lib/prisma';

// Validation schema for updating contact message
const UpdateContactMessageSchema = z.object({
  status: z.enum(['UNREAD', 'READ', 'RESPONDED', 'ARCHIVED']).optional(),
  response: z.string().optional(),
});

// GET - Retrieve specific contact message
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const contactMessage = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!contactMessage) {
      return NextResponse.json(
        { error: 'Contact message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contactMessage);
  } catch (error) {
    console.error('Error fetching contact message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact message' },
      { status: 500 }
    );
  }
}

// PUT - Update contact message status or response
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate the request body
    const validatedData = UpdateContactMessageSchema.parse(body);

    // Check if contact message exists
    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Contact message not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.status) {
      updateData.status = validatedData.status;
    }
    if (validatedData.response) {
      updateData.response = validatedData.response;
      updateData.respondedAt = new Date();
    }

    // Update the contact message
    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Contact message updated successfully',
      contactMessage: updatedMessage,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating contact message:', error);
    return NextResponse.json(
      { error: 'Failed to update contact message' },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if contact message exists
    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Contact message not found' },
        { status: 404 }
      );
    }

    // Delete the contact message
    await prisma.contactMessage.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Contact message deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact message' },
      { status: 500 }
    );
  }
}
