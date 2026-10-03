import { triggerHaptic } from './soundEffects';

export const shareDare = async (title: string, text: string, url: string = window.location.href): Promise<boolean> => {
  triggerHaptic(20);
  
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.warn('Share failed:', error);
      }
      return false;
    }
  } else {
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(`${text} - ${url}`);
      return true;
    } catch {
      return false;
    }
  }
};
