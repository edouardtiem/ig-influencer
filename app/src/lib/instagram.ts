/**
 * Instagram Graph API - Direct posting including carousels
 * Documentation: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

interface InstagramConfig {
  accessToken: string;
  instagramAccountId: string;
}

interface MediaContainer {
  id: string;
}

interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Get Instagram config from environment
 */
function getConfig(): InstagramConfig {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!accessToken || !instagramAccountId) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID required in .env.local');
  }

  return { accessToken, instagramAccountId };
}

/**
 * Create a media container for a single image
 * For carousel items, set isCarouselItem: true
 */
async function createMediaContainer(
  imageUrl: string,
  caption?: string,
  isCarouselItem: boolean = false
): Promise<MediaContainer> {
  const config = getConfig();

  const params = new URLSearchParams({
    image_url: imageUrl,
    access_token: config.accessToken,
  });

  if (isCarouselItem) {
    params.append('is_carousel_item', 'true');
  } else if (caption) {
    params.append('caption', caption);
  }

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${config.instagramAccountId}/media?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(`Instagram API error: ${data.error.message}`);
  }

  return { id: data.id };
}

/**
 * Create a carousel container with multiple media items
 */
async function createCarouselContainer(
  childrenIds: string[],
  caption: string
): Promise<MediaContainer> {
  const config = getConfig();

  const params = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    caption: caption,
    access_token: config.accessToken,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${config.instagramAccountId}/media?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(`Instagram API error: ${data.error.message}`);
  }

  return { id: data.id };
}

/**
 * Publish a media container (single image or carousel)
 */
async function publishMedia(containerId: string): Promise<string> {
  const config = getConfig();

  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: config.accessToken,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${config.instagramAccountId}/media_publish?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(`Instagram API error: ${data.error.message}`);
  }

  return data.id;
}

/**
 * Wait for media container to be ready (processing can take time)
 */
async function waitForMediaReady(containerId: string, maxWaitMs: number = 60000): Promise<boolean> {
  const config = getConfig();
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const params = new URLSearchParams({
      fields: 'status_code',
      access_token: config.accessToken,
    });

    const response = await fetch(
      `${INSTAGRAM_GRAPH_API}/${containerId}?${params}`
    );

    const data = await response.json();

    if (data.status_code === 'FINISHED') {
      return true;
    }

    if (data.status_code === 'ERROR') {
      throw new Error(`Media processing failed: ${data.status || 'Unknown error'}`);
    }

    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Media processing timeout');
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Post a single image to Instagram
 */
export async function postSingleImage(
  imageUrl: string,
  caption: string
): Promise<PublishResult> {
  try {
    console.log('[Instagram] Creating media container...');
    const container = await createMediaContainer(imageUrl, caption, false);

    console.log('[Instagram] Waiting for processing...');
    await waitForMediaReady(container.id);

    console.log('[Instagram] Publishing...');
    const postId = await publishMedia(container.id);

    return { success: true, postId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Post a carousel (2-10 images) to Instagram
 */
export async function postCarousel(
  imageUrls: string[],
  caption: string
): Promise<PublishResult> {
  if (imageUrls.length < 2 || imageUrls.length > 10) {
    return {
      success: false,
      error: 'Carousel must have between 2 and 10 images',
    };
  }

  try {
    // Step 1: Create containers for each image
    console.log(`[Instagram] Creating ${imageUrls.length} media containers...`);
    const childContainers: MediaContainer[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      console.log(`[Instagram]   Image ${i + 1}/${imageUrls.length}...`);
      const container = await createMediaContainer(imageUrls[i], undefined, true);
      childContainers.push(container);

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 2: Wait for all containers to be ready
    console.log('[Instagram] Waiting for all images to process...');
    for (const container of childContainers) {
      await waitForMediaReady(container.id);
    }

    // Step 3: Create carousel container
    console.log('[Instagram] Creating carousel container...');
    const childIds = childContainers.map(c => c.id);
    const carouselContainer = await createCarouselContainer(childIds, caption);

    // Step 4: Wait for carousel to be ready
    console.log('[Instagram] Waiting for carousel to process...');
    await waitForMediaReady(carouselContainer.id);

    // Step 5: Publish
    console.log('[Instagram] Publishing carousel...');
    const postId = await publishMedia(carouselContainer.id);

    console.log(`[Instagram] ✅ Published! Post ID: ${postId}`);
    return { success: true, postId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if Instagram API is configured and working
 */
export async function checkInstagramConnection(): Promise<{ ok: boolean; error?: string; accountName?: string }> {
  try {
    const config = getConfig();

    const params = new URLSearchParams({
      fields: 'username,name',
      access_token: config.accessToken,
    });

    const response = await fetch(
      `${INSTAGRAM_GRAPH_API}/${config.instagramAccountId}?${params}`
    );

    const data = await response.json();

    if (data.error) {
      return { ok: false, error: data.error.message };
    }

    return { ok: true, accountName: data.username || data.name };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

