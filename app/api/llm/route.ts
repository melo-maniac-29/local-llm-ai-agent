import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    // Get LM Studio URL from environment variable with fallback
    const LLM_API_URL = process.env.LLM_API_URL || 'http://localhost:1234/v1/chat/completions';
    
    // Connect to your local LM Studio server
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: message }
        ],
        model: process.env.LLM_MODEL || 'llama3', // Get model from env var with fallback
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
        max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '500'),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LM Studio error: ${errorText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return NextResponse.json({ text: assistantMessage });
  } catch (error) {
    console.error('Error connecting to LM Studio:', error);
    return NextResponse.json(
      { error: 'Failed to connect to local LLM' },
      { status: 500 }
    );
  }
}
