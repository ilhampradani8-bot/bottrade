import { NextResponse } from 'next/server';
import fs from 'fs';

function getEnvVariable(key: string): string {
  try {
    const envPath = '/root/bottrade/.env';
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const parts = trimmed.split('=');
          if (parts[0].trim() === key) {
            let val = parts.slice(1).join('=').trim();
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1);
            }
            if (val.startsWith("'") && val.endsWith("'")) {
              val = val.slice(1, -1);
            }
            return val;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error reading .env in route", err);
  }
  return process.env[key] || '';
}

export async function POST(request: Request) {
  try {
    const { prompt, pageContent, isSuggestReply } = await request.json();

    const apiKey = getEnvVariable('GROQ_API_KEY');
    const model = getEnvVariable('GROQ_MODEL') || 'llama-3.1-8b-instant';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured in .env' },
        { status: 500 }
      );
    }

    let systemPrompt = `You are TradingSafe AI Assistant, an expert guide and co-pilot for the TradingSafe administrative panel. 
You help administrators understand the active screen, analyze database structures, debug engine/prediction logs, resolve user issues, and guide them through administrative controls.
You are provided with the text content of the page the administrator is currently viewing. 
Answer concisely, directly, and practically in Indonesian or English (matching the user's language/query).`;

    if (isSuggestReply) {
      systemPrompt = `You are the Customer Support Copilot for TradingSafe.
Your job is to read the customer support chat history displayed on the screen and suggest a professional, polite, and helpful response that the admin can send to the user.
Your response should ONLY contain the suggested message text itself. Do not include greetings to the admin, quotes, or conversational preamble (like "Here is a suggested reply:"). Just return the raw message that can be directly copy-pasted or inserted into the chat box. Keep it professional, friendly, and matching the language of the user's messages (mostly Indonesian or English).`;
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Active screen text content:\n"""\n${pageContent || ''}\n"""\n\nUser request:\n${prompt}`
      }
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
        max_tokens: 1024
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Groq API returned status ${res.status}: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error in AI API Route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
