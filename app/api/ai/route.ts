import { NextRequest, NextResponse } from "next/server";
import { currentUser } from '@clerk/nextjs/server';
import { refundAiAttempt, reserveAiAttempt } from '@/lib/ai-usage';
import { AI_DAILY_LIMIT } from '@/lib/ai-limits';
import { GoogleGenAI } from "@google/genai";

const PRIMARY_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

const isServiceUnavailable = (error: any) => {
  const status = error?.status ?? error?.code ?? error?.response?.status;
  const message = String(error?.message ?? '');
  return status === 503 || status === '503' || /\b503\b|UNAVAILABLE|high demand/i.test(message);
};

const isSchemaConstraintError = (error: any) => {
  const status = error?.status ?? error?.code ?? error?.response?.status;
  const message = String(error?.message ?? '');
  return (status === 400 || status === '400' || /\b400\b/.test(message))
    && /schema|too many states|INVALID_ARGUMENT/i.test(message);
};

export async function POST(req: NextRequest) {
  const incomingRequestId = req.headers.get('x-ai-request-id');
  const requestId = incomingRequestId?.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64) || crypto.randomUUID();
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => null);
    const { userInput, type } = body ?? {};
    const prompts: Record<string, string> = {
      'Generate Diagrams': 'Create a clear visual diagram.',
      'Flowchart': 'Create a flowchart with decisions and labeled branches.',
      'Architecture': 'Create a system architecture diagram.',
      'Web Mockup': 'Create a desktop web wireframe.',
      'Mobile Mockup': 'Create a mobile app wireframe.',
    };
    if (typeof userInput !== 'string' || !userInput.trim() || userInput.length > 4000 || typeof type !== 'string' || !Object.hasOwn(prompts, type)) {
      return NextResponse.json({ error: 'Choose a supported tool and enter a prompt of 1–4,000 characters.', requestId }, { status: 400 });
    }
    const systemPrompt = prompts[type];

    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      return NextResponse.json({ error: "AI service is not configured", requestId }, { status: 500 });
    }

    const remaining = await reserveAiAttempt(user.id);
    if (remaining === null) {
      const now = new Date();
      const resetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      return NextResponse.json({ error: `Daily AI limit reached. You can generate ${AI_DAILY_LIMIT} times per day. Your limit resets at midnight UTC.`, remaining: 0, resetsAt: resetsAt.toISOString(), requestId },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetsAt.getTime() - now.getTime()) / 1000)) } });
    }
    const ai = new GoogleGenAI({ apiKey });

    const layoutGuidance: Record<string, string> = {
      'Generate Diagrams': 'Use a balanced left-to-right or top-to-bottom layout that best explains the relationships.',
      'Flowchart': 'Use a top-to-bottom flow with 170px row spacing. Use diamonds only for decisions and label outgoing arrows with outcomes.',
      'Architecture': 'Use clear horizontal layers (clients, services, data/infrastructure). Keep related components aligned and connect dependencies with arrows.',
      'Web Mockup': 'Create a desktop wireframe around 900x600 using rectangles and text. Use sections, cards, navigation, and controls; use arrows only when the request explicitly describes a flow.',
      'Mobile Mockup': 'Create a mobile wireframe around 360x720 with a phone frame, header, content sections, controls, and bottom navigation; use arrows only when explicitly requested.',
    };

    const finalPrompt = `${systemPrompt}

User request: ${userInput.trim()}

Return one JSON object with an "elements" array and no markdown or explanation.
${layoutGuidance[type]}

Rules:
- Use only rectangle, ellipse, diamond, text, and arrow element types.
- Every non-arrow element needs a unique id, numeric x/y/width/height, and concise visible text in text.
- Keep shapes from overlapping. Use at most 16 non-arrow elements and leave at least 40px between them.
- Rectangles are normally 180x70; diamonds 140x140. Increase dimensions when labels need more room.
- Every arrow must use fromId and toId that match existing shape ids.
- Styling is applied by the canvas; do not add styling properties.

Example element: {"id":"step-1","type":"rectangle","x":100,"y":100,"width":180,"height":70,"text":"Create account"}
Example arrow: {"type":"arrow","fromId":"step-1","toId":"step-2","text":"Next"}`;
    const responseJsonSchema = {
      type: 'object',
      properties: {
        elements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['rectangle', 'ellipse', 'diamond', 'text', 'arrow'] },
              x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' },
              text: { type: 'string' },
              fromId: { type: 'string' }, toId: { type: 'string' },
            },
            required: ['type'],
          },
        },
      },
      required: ['elements'],
    };

    const generationConfig = {
      responseMimeType: "application/json",
      responseJsonSchema,
      maxOutputTokens: 4096,
      temperature: 0.25,
      httpOptions: { timeout: 30_000 },
    };
    let response: any;
    try {
      response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: finalPrompt,
        config: generationConfig,
      });
    } catch (primaryErr: any) {
      if (isSchemaConstraintError(primaryErr)) {
        const restoredRemaining = await refundAiAttempt(user.id);
        return NextResponse.json({
          error: 'The AI service rejected the response format. Please try again later. This attempt was not deducted from your daily AI quota.',
          remaining: restoredRemaining,
          quotaReduced: false,
          requestId,
        }, { status: 502 });
      }

      try {
        response = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: finalPrompt,
          config: generationConfig,
        });
      } catch (fallbackErr: any) {
        if (isSchemaConstraintError(fallbackErr)) {
          const restoredRemaining = await refundAiAttempt(user.id);
          return NextResponse.json({
            error: 'The AI service rejected the response format. Please try again later. This attempt was not deducted from your daily AI quota.',
            remaining: restoredRemaining,
            quotaReduced: false,
            requestId,
          }, { status: 502 });
        }

        if (isServiceUnavailable(primaryErr) && isServiceUnavailable(fallbackErr)) {
          const restoredRemaining = await refundAiAttempt(user.id);
          return NextResponse.json({
            error: 'Gemini is temporarily experiencing high demand. Please try again in a few minutes. This attempt was not deducted from your daily AI quota.',
            remaining: restoredRemaining,
            quotaReduced: false,
            requestId,
          }, {
            status: 503,
            headers: { 'Retry-After': '60' },
          });
        }

        throw fallbackErr;
      }
    }

    let rawText = (response.text ?? "").trim();

    // Strip any accidental markdown fences
    rawText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again.", requestId },
        { status: 500 }
      );
    }

    let diagramResult: any;
    try {
      diagramResult = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "AI response could not be parsed. Please try again.", requestId },
        { status: 500 }
      );
    }

    if (!Array.isArray(diagramResult?.elements)) {
      if (Array.isArray(diagramResult)) {
        diagramResult = { elements: diagramResult };
      } else {
        return NextResponse.json(
          { error: "AI response was missing the elements array.", requestId },
          { status: 500 }
        );
      }
    }

    const allowedTypes = new Set(['rectangle', 'ellipse', 'diamond', 'text', 'arrow']);
    diagramResult.elements = diagramResult.elements
      .filter((element: unknown) => {
        if (!element || typeof element !== 'object') return false;
        return allowedTypes.has((element as { type?: string }).type || '');
      })
      .slice(0, 32);

    if (!diagramResult.elements.some((element: { type: string }) => element.type !== 'arrow')) {
      return NextResponse.json({ error: 'AI did not return any usable shapes. Please try a more specific prompt.', requestId }, { status: 502 });
    }

    return NextResponse.json({ success: true, diagramResult, remaining, requestId });

  } catch {
    return NextResponse.json({ error: 'AI generation failed. Please try again later. This attempt counts toward your daily limit.', requestId }, { status: 502 });
  }
}
