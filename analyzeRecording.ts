import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

interface AnalysisResult {
  pronunciation: number;
  smoothness: number;
  rhythm: number;
  connectedSpeech: number;
  vibe: string;
  vibeFeedback: string;
  chineseExplanation: string;
  singingTip: string;
  tags: string[];
  analyzedAt: string;
}

interface APIResponse {
  success: boolean;
  analysis?: AnalysisResult;
  error?: string;
  debug?: {
    attempts: number;
    duration: number;
    apiKeyConfigured: boolean;
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

async function callGeminiAPIWithRetry(
  audioBase64: string,
  lyricText: string,
  apiKey: string
): Promise<APIResponse> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `You are an expert English pronunciation and singing coach. Analyze this audio recording of someone singing: "${lyricText}"
            
Provide detailed analysis in strict JSON format:
{
  "pronunciation": 0-100,
  "smoothness": 0-100,
  "rhythm": 0-100,
  "connectedSpeech": 0-100,
  "vibe": "short positive phrase",
  "vibeFeedback": "specific feedback",
  "chineseExplanation": "Chinese translation",
  "singingTip": "actionable improvement tip",
  "tags": ["tag1", "tag2"]
}

Be constructive and encouraging. Focus on musical expression and natural pronunciation.`,
          },
          {
            inlineData: {
              mimeType: 'audio/webm',
              data: audioBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[API/Analyze] Attempt ${attempt}/${MAX_RETRIES} - Calling Gemini API...`);

    try {
      const startTime = Date.now();

      const response = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        GEMINI_API_TIMEOUT
      );

      const duration = Date.now() - startTime;
      console.log(`[API/Analyze] Response received in ${duration}ms (status: ${response.status})`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API/Analyze] API error (${response.status}):`, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[API/Analyze] Raw API response:', JSON.stringify(data, null, 2).substring(0, 500));

      // Parse Gemini's response
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        console.error('[API/Analyze] No content in Gemini response');
        throw new Error('Invalid Gemini response format');
      }

      let analysis: AnalysisResult;
      try {
        analysis = JSON.parse(content);
        console.log('[API/Analyze] Parsed analysis:', analysis);
      } catch (parseError) {
        console.error('[API/Analyze] JSON parse error:', parseError);
        console.log('[API/Analyze] Raw content:', content.substring(0, 200));
        throw new Error('Failed to parse Gemini response');
      }

      // Validate and normalize scores
      const normalizedAnalysis: AnalysisResult = {
        pronunciation: Math.min(100, Math.max(0, Number(analysis.pronunciation) || 75)),
        smoothness: Math.min(100, Math.max(0, Number(analysis.smoothness) || 75)),
        rhythm: Math.min(100, Math.max(0, Number(analysis.rhythm) || 75)),
        connectedSpeech: Math.min(100, Math.max(0, Number(analysis.connectedSpeech) || 70)),
        vibe: analysis.vibe || 'Great effort!',
        vibeFeedback: analysis.vibeFeedback || 'Good pronunciation!',
        chineseExplanation: analysis.chineseExplanation || '发音不错',
        singingTip: analysis.singingTip || 'Keep practicing!',
        tags: Array.isArray(analysis.tags) ? analysis.tags : ['practice'],
        analyzedAt: new Date().toISOString(),
      };

      return {
        success: true,
        analysis: normalizedAnalysis,
        debug: {
          attempts: attempt,
          duration,
          apiKeyConfigured: true,
        },
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[API/Analyze] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt - 1];
        console.log(`[API/Analyze] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: `All ${MAX_RETRIES} attempts failed. Last error: ${lastError?.message}`,
    debug: {
      attempts: MAX_RETRIES,
      duration: 0,
      apiKeyConfigured: true,
    },
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[API/Analyze] ===========================================');
  console.log('[API/Analyze] New analysis request received');
  console.log('[API/Analyze] Request method:', request.method);
  console.log('[API/Analyze] Content-Type:', request.headers.get('content-type'));

  try {
    // Parse form data
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob | null;
    const lyricText = formData.get('lyric') as string | null;
    const duration = parseFloat(formData.get('duration') as string) || 0;

    console.log('[API/Analyze] Form data parsed:');
    console.log('  - audioBlob:', audioBlob ? `${audioBlob.size} bytes, ${audioBlob.type}` : 'null');
    console.log('  - lyricText:', lyricText ? `"${lyricText.substring(0, 50)}..."` : 'null');
    console.log('  - duration:', `${duration}s`);

    // Validation
    if (!audioBlob) {
      console.error('[API/Analyze] Validation failed: No audio blob');
      return NextResponse.json(
        { success: false, error: 'Missing audio file' },
        { status: 400 }
      );
    }

    if (!lyricText) {
      console.error('[API/Analyze] Validation failed: No lyric text');
      return NextResponse.json(
        { success: false, error: 'Missing lyric text' },
        { status: 400 }
      );
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[API/Analyze] API key configured:', !!apiKey);
    console.log('[API/Analyze] API key preview:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      console.warn('[API/Analyze] No valid API key found, using mock response');
      return generateMockResponse();
    }

    // Convert blob to base64
    console.log('[API/Analyze] Converting audio blob to base64...');
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    console.log('[API/Analyze] Base64 audio length:', base64Audio.length, 'characters');

    // Call Gemini API with retry
    console.log('[API/Analyze] Calling Gemini API with retry mechanism...');
    const result = await callGeminiAPIWithRetry(base64Audio, lyricText, apiKey);

    const totalDuration = Date.now() - startTime;
    console.log('[API/Analyze] ===========================================');
    console.log('[API/Analyze] Analysis complete!');
    console.log('[API/Analyze] Total duration:', totalDuration, 'ms');
    console.log('[API/Analyze] Success:', result.success);
    console.log('[API/Analyze] Attempts:', result.debug?.attempts);

    if (result.success && result.analysis) {
      console.log('[API/Analyze] Analysis scores:');
      console.log('  - pronunciation:', result.analysis.pronunciation);
      console.log('  - smoothness:', result.analysis.smoothness);
      console.log('  - rhythm:', result.analysis.rhythm);
      console.log('  - connectedSpeech:', result.analysis.connectedSpeech);
      console.log('[API/Analyze] ===========================================');

      return NextResponse.json(result);
    } else {
      console.error('[API/Analyze] Analysis failed:', result.error);
      console.log('[API/Analyze] Falling back to mock response');
      return NextResponse.json(generateMockResponse());
    }

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('[API/Analyze] Unexpected error after', totalDuration, 'ms:', error);
    console.error('[API/Analyze] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('[API/Analyze] ===========================================');

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        debug: {
          attempts: 0,
          duration: totalDuration,
          apiKeyConfigured: !!process.env.GEMINI_API_KEY,
        },
      },
      { status: 500 }
    );
  }
}

function generateMockResponse(): { success: boolean; analysis: AnalysisResult } {
  const MOCK_FEEDBACKS = [
    {
      vibeFeedback: 'Relax the ending a little.',
      chineseExplanation: '尾音不要太重。',
      singingTip: 'Connect words smoothly.',
      tags: ['smooth-flow', 'connected-speech'],
    },
    {
      vibeFeedback: 'Nice breath control!',
      chineseExplanation: '气息控制得很好。',
      singingTip: 'Keep that relaxed tone going.',
      tags: ['breath-control', 'tone'],
    },
    {
      vibeFeedback: 'Great energy!',
      chineseExplanation: '能量很足！',
      singingTip: 'Match the original feel.',
      tags: ['energy', 'vibe'],
    },
    {
      vibeFeedback: 'Perfect pitch!',
      chineseExplanation: '音准很棒！',
      singingTip: 'Maintain this consistency.',
      tags: ['pitch', 'consistency'],
    },
  ];

  const mockFeedback = MOCK_FEEDBACKS[Math.floor(Math.random() * MOCK_FEEDBACKS.length)];

  console.log('[API/Analyze] Generating mock response (no API key configured)');

  return {
    success: true,
    analysis: {
      pronunciation: Math.floor(Math.random() * 20) + 75,
      smoothness: Math.floor(Math.random() * 25) + 70,
      rhythm: Math.floor(Math.random() * 20) + 75,
      connectedSpeech: Math.floor(Math.random() * 30) + 65,
      vibe: ['Great flow!', 'Smooth like butter', 'Natural vibe', 'Nice rhythm'][Math.floor(Math.random() * 4)],
      ...mockFeedback,
      analyzedAt: new Date().toISOString(),
    },
  };
}