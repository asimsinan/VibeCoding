import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Update board in database
    const { data, error } = await supabase
      .from('boards')
      .update({
        title: body.title,
        description: body.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update board error:', error);
      return NextResponse.json(
        { error: 'Failed to update board' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('Update board error:', error);
    return NextResponse.json(
      { error: 'Failed to update board' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete board from database
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete board error:', error);
      return NextResponse.json(
        { error: 'Failed to delete board' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('Delete board error:', error);
    return NextResponse.json(
      { error: 'Failed to delete board' },
      { status: 500 }
    );
  }
}
