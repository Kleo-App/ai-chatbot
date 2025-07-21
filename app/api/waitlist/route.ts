import { type NextRequest, NextResponse } from 'next/server';
import { LoopsClient, APIError } from 'loops';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if API key is present
    if (!process.env.LOOPS_API_KEY) {
      console.error('LOOPS_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const loops = new LoopsClient(process.env.LOOPS_API_KEY);

    // Test API key first
    try {
      await loops.testApiKey();
      console.log('Loops API key is valid');
    } catch (testError) {
      console.error('Invalid Loops API key:', testError);
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Try to create contact
    try {
      const response = await loops.createContact(email, {
        source: 'Waitlist',
        userGroup: 'Waitlist Beta 2.0'
      });

      console.log('Contact created successfully:', response);
      return NextResponse.json({ success: true, id: response.id });
    } catch (createError) {
      if (createError instanceof APIError) {
        console.error('Loops API Error:', createError.json, 'Status:', createError.statusCode);
        
        // If contact already exists, try to update instead
        if (createError.statusCode === 409 || 
            (createError.json && 'message' in createError.json && 
             typeof createError.json.message === 'string' && 
             createError.json.message.includes('already exists'))) {
          try {
            const updateResponse = await loops.updateContact(email, {
              source: 'Waitlist',
              userGroup: 'Waitlist Beta 2.0'
            });
            console.log('Contact updated successfully:', updateResponse);
            return NextResponse.json({ success: true, updated: true });
          } catch (updateError) {
            console.error('Failed to update existing contact:', updateError);
            throw updateError;
          }
        }
        
        throw createError;
      } else {
        console.error('Non-API error creating contact:', createError);
        throw createError;
      }
    }
  } catch (error) {
    console.error('Error submitting to waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to submit to waitlist' },
      { status: 500 }
    );
  }
} 