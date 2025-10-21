import { NextRequest, NextResponse } from 'next/server';
import { generateResumeVariants, generateSpecificVariants, VariantContext } from '../../../../src/lib/ai/variants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeContent, context, sectionType } = body;

    if (!resumeContent) {
      return NextResponse.json({ error: 'Resume content is required' }, { status: 400 });
    }

    if (sectionType) {
      // Generate variants for specific section
      const variants = await generateSpecificVariants(
        sectionType,
        resumeContent,
        context as VariantContext
      );
      return NextResponse.json({ variants });
    } else {
      // Generate comprehensive variants with tournament ranking
      const result = await generateResumeVariants(resumeContent, context as VariantContext);
      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('Variant generation error:', error);
    return NextResponse.json(
      { 
        error: 'Variant generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
