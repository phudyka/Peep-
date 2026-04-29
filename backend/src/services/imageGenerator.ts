import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { InstallationResult, PoolInput } from './hydraulicEngine';

export interface ProductPhoto {
  filePath: string;
  mimeType: string;
}

export function buildPoolPrompt(result: InstallationResult, input: PoolInput): string {
  const typeStr = input.type === 'SKIMMER' ? 'skimmer pool' : input.type === 'OVERFLOW' ? 'overflow/infinity pool' : 'Roman style pool';
  const usageStr = input.usage === 'RESIDENTIAL' ? 'residential' : 'public/commercial';
  
  return `Generate a realistic, professional architectural 3D render of a ${usageStr} ${typeStr}.
The pool dimensions are ${input.length}m long, ${input.width}m wide, with an average depth of ${result.depthAvg.toFixed(2)}m.
The layout must clearly feature:
- ${result.skimmers} skimmers (if applicable to type)
- ${result.returns} return nozzles
- Visible plumbing schematic overlays: suction pipes (colored blue, Ø${result.suctionDiameter}mm) and pressure pipes (colored red, Ø${result.pressureDiameter}mm).
The image should look like a premium brochure visualization for a hydraulic equipment company.`;
}

export async function generatePoolVisual(
  result: InstallationResult,
  input: PoolInput,
  productPhotos: ProductPhoto[]
): Promise<string | null> {
  // GEMINI DISABLED - enable when API key is ready
  return null;
  /*
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('Gemini API key missing, skipping visual generation');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-image-preview' });

    const prompt = buildPoolPrompt(result, input);

    // Convert file paths to base64 inline data
    const imageParts = productPhotos.map(photo => {
      const data = fs.readFileSync(photo.filePath).toString('base64');
      return {
        inlineData: {
          data,
          mimeType: photo.mimeType
        }
      };
    });

    const resultCall = await model.generateContent([prompt, ...imageParts]);
    const response = await resultCall.response;
    
    // In actual gemini-3.1-flash-image-preview, it returns base64 images if supported or requested.
    // For scaffolding, we mock the extraction of the base64 from the response.
    // The exact field depends on the API client version.
    const textOrImage = response.text(); 
    
    // Assuming the response will contain the base64 image or a mock URL for now
    return `data:image/jpeg;base64,${Buffer.from(textOrImage).toString('base64')}`;
  } catch (error) {
    console.error('Error generating pool visual:', error);
    return null;
  }
  */
}
