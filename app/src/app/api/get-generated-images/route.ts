import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';

/**
 * GET /api/get-generated-images
 * Read all batch files and return generated images
 */
export async function GET() {
  try {
    const images: Array<{ url: string; batch: number; index: number }> = [];
    
    // Read batch files (0 to 10, batch_0 contains the 7 initial images)
    for (let batchNum = 0; batchNum <= 10; batchNum++) {
      const filePath = `/tmp/batch_${batchNum}.json`;
      
      if (existsSync(filePath)) {
        try {
          const fileContent = readFileSync(filePath, 'utf-8');
          const batchData = JSON.parse(fileContent);
          
          if (batchData.success && batchData.images && Array.isArray(batchData.images)) {
            batchData.images.forEach((img: any, idx: number) => {
              if (img.url && img.success) {
                images.push({
                  url: img.url,
                  batch: batchNum,
                  index: idx,
                });
              }
            });
          }
        } catch (error) {
          console.error(`[Get Generated] Error reading batch ${batchNum}:`, error);
        }
      }
    }
    
    console.log(`[Get Generated] Found ${images.length} images from batches`);
    
    return NextResponse.json({
      success: true,
      total: images.length,
      images,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[Get Generated] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        images: [],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

