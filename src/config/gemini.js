import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

// Debug: mostrar parcialmente la API key
if (GEMINI_API_KEY) {
  const keyPreview = GEMINI_API_KEY.slice(0, 5) + '...';
  console.log('[Gemini Config] API_KEY detected:', keyPreview);
} else {
  console.warn('[Gemini Config] GEMINI_API_KEY no está configurada en .env');
}

const buildGeminiRequest = (prompt) => ({
  contents: [
    {
      parts: [{ text: prompt }]
    }
  ]
});

export const generateGeminiText = async (prompt) => {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Prompt inválido');
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    throw new Error('GEMINI_API_KEY no está configurada en .env');
  }

  if (!GEMINI_API_KEY.startsWith('AIza')) {
    throw new Error('GEMINI_API_KEY tiene formato inválido. Debe empezar con "AIza"');
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(buildGeminiRequest(prompt))
});

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const text =
  data?.candidates?.[0]?.content?.parts?.[0]?.text ||
  null;

    if (!text) {
      throw new Error('Respuesta de Gemini inválida');
    }

    return text;
  } catch (error) {
    console.error('Error en Gemini API:', error);
    throw new Error('No se pudo generar respuesta con Gemini');
  }
};
