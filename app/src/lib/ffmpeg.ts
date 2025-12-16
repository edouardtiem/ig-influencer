import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const execAsync = promisify(exec);

/**
 * FFmpeg Service for video assembly
 * Concatenates multiple clips into a single reel with transitions
 */

export interface ConcatOptions {
  transition?: 'none' | 'fade' | 'dissolve';
  transitionDuration?: number; // seconds
  outputFormat?: 'mp4' | 'mov';
  addMusic?: string; // path to audio file
  musicVolume?: number; // 0-1
}

export interface ConcatResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Download video from URL to local path
 */
export async function downloadVideo(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(outputPath);
          downloadVideo(redirectUrl, outputPath).then(resolve).catch(reject);
          return;
        }
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

/**
 * Check if FFmpeg is available
 */
export async function checkFfmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get video duration in seconds
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
  );
  return parseFloat(stdout.trim());
}

/**
 * Concatenate videos without transition (fastest)
 */
async function concatSimple(videoPaths: string[], outputPath: string): Promise<void> {
  // Create concat file
  const listPath = outputPath.replace(/\.[^.]+$/, '_list.txt');
  const content = videoPaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(listPath, content);
  
  try {
    await execAsync(
      `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`
    );
  } finally {
    fs.unlinkSync(listPath);
  }
}

/**
 * Concatenate videos with fade transitions
 */
async function concatWithFade(
  videoPaths: string[], 
  outputPath: string, 
  transitionDuration: number
): Promise<void> {
  // Get durations
  const durations = await Promise.all(videoPaths.map(getVideoDuration));
  
  // Build complex filter for crossfade
  const inputs = videoPaths.map((_, i) => `-i "${videoPaths[i]}"`).join(' ');
  
  let filterComplex = '';
  let lastOutput = '[0:v]';
  
  for (let i = 1; i < videoPaths.length; i++) {
    const offset = durations.slice(0, i).reduce((a, b) => a + b, 0) - (transitionDuration * i);
    const outputLabel = i === videoPaths.length - 1 ? '[outv]' : `[v${i}]`;
    filterComplex += `${lastOutput}[${i}:v]xfade=transition=fade:duration=${transitionDuration}:offset=${offset.toFixed(2)}${outputLabel};`;
    lastOutput = outputLabel;
  }
  
  // Audio crossfade
  let audioFilter = '';
  let lastAudio = '[0:a]';
  
  for (let i = 1; i < videoPaths.length; i++) {
    const offset = durations.slice(0, i).reduce((a, b) => a + b, 0) - (transitionDuration * i);
    const outputLabel = i === videoPaths.length - 1 ? '[outa]' : `[a${i}]`;
    audioFilter += `${lastAudio}[${i}:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri${outputLabel};`;
    lastAudio = outputLabel;
  }
  
  const fullFilter = filterComplex + audioFilter.slice(0, -1); // Remove trailing semicolon
  
  await execAsync(
    `ffmpeg -y ${inputs} -filter_complex "${fullFilter}" -map "[outv]" -map "[outa]" -c:v libx264 -preset fast -crf 23 -c:a aac "${outputPath}"`
  );
}

/**
 * Concatenate multiple video clips into a single reel
 */
export async function concatVideos(
  videoPaths: string[],
  outputPath: string,
  options: ConcatOptions = {}
): Promise<ConcatResult> {
  const { 
    transition = 'none', 
    transitionDuration = 0.5,
  } = options;
  
  // Validate inputs
  for (const videoPath of videoPaths) {
    if (!fs.existsSync(videoPath)) {
      return { success: false, error: `Video not found: ${videoPath}` };
    }
  }
  
  // Check FFmpeg
  const hasFfmpeg = await checkFfmpeg();
  if (!hasFfmpeg) {
    return { success: false, error: 'FFmpeg not installed' };
  }
  
  console.log(`[FFmpeg] Concatenating ${videoPaths.length} videos...`);
  console.log('[FFmpeg] Transition:', transition);
  
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    if (transition === 'none') {
      await concatSimple(videoPaths, outputPath);
    } else if (transition === 'fade' || transition === 'dissolve') {
      await concatWithFade(videoPaths, outputPath, transitionDuration);
    }
    
    console.log('[FFmpeg] Output:', outputPath);
    return { success: true, outputPath };
    
  } catch (error) {
    console.error('[FFmpeg] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Add background music to video
 */
export async function addMusic(
  videoPath: string,
  audioPath: string,
  outputPath: string,
  volume: number = 0.3
): Promise<ConcatResult> {
  if (!fs.existsSync(videoPath)) {
    return { success: false, error: `Video not found: ${videoPath}` };
  }
  if (!fs.existsSync(audioPath)) {
    return { success: false, error: `Audio not found: ${audioPath}` };
  }
  
  console.log('[FFmpeg] Adding music...');
  
  try {
    // Get video duration
    const duration = await getVideoDuration(videoPath);
    
    await execAsync(
      `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -filter_complex "[1:a]volume=${volume},afade=t=out:st=${duration - 1}:d=1[music];[0:a][music]amix=inputs=2:duration=first[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -shortest "${outputPath}"`
    );
    
    console.log('[FFmpeg] Music added:', outputPath);
    return { success: true, outputPath };
    
  } catch (error) {
    console.error('[FFmpeg] Error adding music:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create multi-shot reel from remote video URLs
 */
export async function createMultiShotReel(
  videoUrls: string[],
  outputDir: string,
  options: ConcatOptions = {}
): Promise<ConcatResult> {
  const tempDir = path.join(outputDir, 'temp-clips');
  
  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  console.log(`[FFmpeg] Downloading ${videoUrls.length} clips...`);
  
  try {
    // Download all clips
    const localPaths: string[] = [];
    for (let i = 0; i < videoUrls.length; i++) {
      const localPath = path.join(tempDir, `clip-${i}.mp4`);
      await downloadVideo(videoUrls[i], localPath);
      localPaths.push(localPath);
      console.log(`[FFmpeg] Downloaded clip ${i + 1}/${videoUrls.length}`);
    }
    
    // Concatenate
    const timestamp = Date.now();
    const outputPath = path.join(outputDir, `reel-${timestamp}.mp4`);
    const result = await concatVideos(localPaths, outputPath, options);
    
    // Cleanup temp files
    for (const localPath of localPaths) {
      fs.unlinkSync(localPath);
    }
    fs.rmdirSync(tempDir);
    
    return result;
    
  } catch (error) {
    console.error('[FFmpeg] Error creating multi-shot reel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

