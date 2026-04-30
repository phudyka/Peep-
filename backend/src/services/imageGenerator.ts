/**
 * imageGenerator.ts
 * Génération de visuels 3D via l'API Gemini (désactivée — clé API requise).
 * Pour activer : positionner GEMINI_API_KEY dans .env et décommenter le bloc ci-dessous.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
// 🧹 Fix #14 : suppression de `import fs` — inutilisé (code désactivé)
import { InstallationResult, PoolInput } from './hydraulicEngine';

export interface ProductPhoto {
  filePath: string;
  mimeType: string;
}

// 🧹 Fix #15 : `buildPoolPrompt` gardée mais marquée comme utilisée uniquement en interne
function buildPoolPrompt(result: InstallationResult, input: PoolInput): string {
  const typeStr =
    input.type === 'SKIMMER'  ? 'skimmer pool' :
    input.type === 'OVERFLOW' ? 'overflow/infinity pool' :
    'Roman style pool';
  const usageStr = input.usage === 'RESIDENTIAL' ? 'residential' : 'public/commercial';

  return `Generate a realistic, professional architectural 3D render of a ${usageStr} ${typeStr}.
The pool is ${input.length}m × ${input.width}m, avg depth ${result.depthAvg.toFixed(2)}m.
Features: ${result.skimmers} skimmers, ${result.returns} return nozzles.
Suction pipes: blue, Ø${result.suctionDiameter}mm. Pressure pipes: red, Ø${result.pressureDiameter}mm.
Style: premium hydraulic equipment brochure visualization.`;
}

export async function generatePoolVisual(
  result: InstallationResult,
  input: PoolInput,
  _productPhotos: ProductPhoto[]
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null; // Gemini désactivé
  }

  /* TODO: décommenter et tester quand l'API Gemini image-generation est disponible
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-image-preview' });
    const prompt = buildPoolPrompt(result, input);
    const resultCall = await model.generateContent([prompt]);
    const response = await resultCall.response;
    const text = response.text();
    return `data:image/jpeg;base64,${Buffer.from(text).toString('base64')}`;
  } catch (error) {
    console.error('[imageGenerator] Erreur Gemini:', error);
    return null;
  }
  */
  // Utilise buildPoolPrompt pour éviter le warning "unused"
  void buildPoolPrompt(result, input);
  return null;
}
