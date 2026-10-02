/**
 * Utility helper to accurately distinguish between image and video media URLs.
 * Prevents false positives where long base64 image strings contain the substring "mp4" or "webm".
 */

export const isVideoMedia = (url?: string | null, explicitType?: 'image' | 'video'): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (explicitType === 'image') return false;
  if (explicitType === 'video') return true;

  // Check Data URI mime-types first (strict mime check)
  if (url.startsWith('data:video/')) return true;
  if (url.startsWith('data:image/')) return false;
  if (url.startsWith('data:application/')) return false;

  // For regular HTTP/HTTPS URLs, strip query parameters and hashes before inspecting extension
  try {
    const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase().trim();
    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.mov') ||
      cleanUrl.endsWith('.m4v') ||
      cleanUrl.endsWith('.ogv') ||
      cleanUrl.endsWith('.ogg') ||
      cleanUrl.endsWith('.m3u8')
    );
  } catch {
    return false;
  }
};
