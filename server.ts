import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support large base64 image uploads for high-resolution document processing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

/**
 * AI Document Analysis & Smart Corner Detection
 * Detects 4-corner document boundaries on table/desk, orientation, paper shadow, and optimal cleaning parameters
 */
app.post('/api/ai/analyze-document', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server' });
      return;
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

    const prompt = `Analyze this document photo for professional background removal, desk cropping, and document cleaning.
Examine:
1. Is there an outer background (like a desk, table, hands, bed, or floor)?
2. If there is a document on a surface, identify the 4 exact corner coordinates of the document paper in normalized coordinates [0 to 1000] where (0,0) is top-left and (1000,1000) is bottom-right:
   - topLeft: [x, y]
   - topRight: [x, y]
   - bottomRight: [x, y]
   - bottomLeft: [x, y]
   (If the document already fills the entire image or is already cropped, return corners [0,0], [1000,0], [1000,1000], [0,1000]).
3. Identify shadows, creases, yellowing or uneven illumination on the paper.
4. Detect if there are colorful stamps (red/blue seals), signatures, handwritten ink, or logos.
5. Identify document type (e.g., 'contract', 'receipt', 'signature', 'id_card', 'certificate', 'handwritten_note', 'invoice').
6. Recommend calibrated settings for the adaptive document background removal algorithm.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasOuterBackground: {
              type: Type.BOOLEAN,
              description: 'Whether the image contains visible desk, background, or surface outside the document',
            },
            corners: {
              type: Type.OBJECT,
              description: 'Normalized [x, y] coordinates in 0-1000 scale for the 4 corners of the document',
              properties: {
                topLeft: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                  description: '[x, y] from 0 to 1000',
                },
                topRight: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                  description: '[x, y] from 0 to 1000',
                },
                bottomRight: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                  description: '[x, y] from 0 to 1000',
                },
                bottomLeft: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                  description: '[x, y] from 0 to 1000',
                },
              },
              required: ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'],
            },
            documentType: {
              type: Type.STRING,
              description: 'Type of document: receipt, contract, signature, id_card, certificate, handwritten_note, etc.',
            },
            documentTitleOrSummary: {
              type: Type.STRING,
              description: 'Brief 1-line description of the document in Thai or English',
            },
            hasColoredStampsOrSignatures: {
              type: Type.BOOLEAN,
              description: 'True if there are colored ink seals, red stamps, or blue signatures that should be preserved',
            },
            lightingCondition: {
              type: Type.STRING,
              description: 'Lighting assessment: severe_shadow, warm_yellow, uneven, glare, or clean',
            },
            recommendedSettings: {
              type: Type.OBJECT,
              properties: {
                shadowRemovalStrength: {
                  type: Type.NUMBER,
                  description: 'Recommended shadow removal strength from 0.0 to 1.0 (higher for severe shadows)',
                },
                backgroundWhiteness: {
                  type: Type.NUMBER,
                  description: 'Recommended paper whiteness boost from 0.0 to 1.0',
                },
                contrast: {
                  type: Type.NUMBER,
                  description: 'Recommended text contrast enhancement from 1.0 to 2.5',
                },
                sharpness: {
                  type: Type.NUMBER,
                  description: 'Recommended unsharp mask sharpness from 0.0 to 1.0',
                },
                preserveColorMode: {
                  type: Type.STRING,
                  description: 'Recommended color mode: "enhanced_color", "monochrome_black_white", or "grayscale"',
                },
              },
              required: ['shadowRemovalStrength', 'backgroundWhiteness', 'contrast', 'sharpness', 'preserveColorMode'],
            },
            aiQualityTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Helpful tips for best scan quality in Thai language',
            },
          },
          required: [
            'hasOuterBackground',
            'corners',
            'documentType',
            'documentTitleOrSummary',
            'hasColoredStampsOrSignatures',
            'recommendedSettings',
          ],
        },
      },
    });

    const resultText = response.text || '{}';
    const parsedData = JSON.parse(resultText);

    res.json({
      success: true,
      analysis: parsedData,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error analyzing document with Gemini:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze document',
    });
  }
});

// Configure Vite middleware in development or static serve in production
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DocClear AI server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
