import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if returning from a redirect sign-in flow
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((err) => {
        console.warn('Redirect sign-in check:', err?.message || err);
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        console.warn('Popup blocked by browser. Falling back to redirect sign-in...');
        try {
          await signInWithRedirect(auth, provider);
          return null;
        } catch (redirectErr: any) {
          console.error('Redirect sign-in error:', redirectErr);
          setAuthError('Sign-in popup blocked. Please allow popups for this site.');
        }
      } else if (err?.code === 'auth/unauthorized-domain') {
        const msg = `Domain (${window.location.hostname}) is not in Firebase Authorized Domains list.`;
        console.warn('Firebase Auth Notice:', msg);
        setAuthError(msg);
      } else if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no action needed
      } else {
        console.error('Firebase Auth Error:', err);
        setAuthError(err?.message || 'Authentication failed. Please try again.');
      }
      return null;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  return { user, loading, signIn, logout, authError };
};
