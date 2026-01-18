/**
 * Quick test: Fit body + large breasts (NO ControlNet)
 */

import { generateBigLust } from './comfyui-api.mjs';

async function main() {
  console.log('Testing fit body + large breasts prompt (NO ControlNet)...\n');
  
  const result = await generateBigLust({
    positive: `masterpiece, best quality, photorealistic, 8k uhd, ultra detailed,
24 year old Italian woman named Elena,
honey brown warm eyes, bronde hair with dark roots and golden blonde balayage, long voluminous beach waves,
small beauty mark on right cheekbone,
fit athletic toned body, large natural breasts, defined slim waist, toned stomach, healthy fit figure,
lying on white silk bed sheets, taking mirror selfie with smartphone,
phone hiding face, face obscured by phone, face not visible,
wearing black lace lingerie, exposed cleavage,
natural skin texture, soft morning light from window,
gold layered necklaces with medallion pendant,
shot on Canon EOS R5, shallow depth of field, intimate bedroom, amateur photo`,
    negative: `visible face, clear face, full face visible, face in frame, looking at camera,
angular face, sharp jawline, curvy body, very wide hips, thick thighs, huge breasts, F-cup, G-cup,
flat chest, small breasts, A-cup, B-cup,
worst quality, low quality, blurry, cartoon, anime, illustration,
bad anatomy, bad hands, extra fingers, deformed,
watermark, censored, mosaic, plastic skin,
male, man`,
    width: 832,
    height: 1216,
    filenamePrefix: 'Elena_FitBody_Test',
  });
  
  console.log(`\n✅ Image saved: ${result.filepath}`);
}

main().catch(console.error);
