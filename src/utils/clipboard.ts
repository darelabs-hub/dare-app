/**
 * Robust clipboard copy utility with fallback for iframes and older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern Async Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Async clipboard write failed, attempting textarea fallback:', err);
    }
  }

  // 2. Fallback to textarea + document.execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('All clipboard operations failed:', err);
    return false;
  }
}

/**
 * Builds the direct share link for a specific dare
 */
export function getDareShareUrl(dareId: string): string {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?dare=${encodeURIComponent(dareId)}`;
}
