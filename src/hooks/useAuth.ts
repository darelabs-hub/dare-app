import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
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

  // 1. Google Sign-In
  const signInWithGoogle = async () => {
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

  // 2. Email & Password Sign-In (For users without Google)
  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      if (!email.trim() || !pass) {
        setAuthError('Please enter a valid email and password.');
        return null;
      }
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setUser(res.user);
      return res;
    } catch (err: any) {
      const msg = err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : (err?.message || 'Sign in failed. Please try again.');
      setAuthError(msg);
      return null;
    }
  };

  // 3. Email & Password Sign-Up (Create new account)
  const signUpWithEmail = async (email: string, pass: string, handle?: string) => {
    setAuthError(null);
    try {
      if (!email.trim() || !pass) {
        setAuthError('Please enter a valid email and password.');
        return null;
      }
      const cleanHandle = handle ? (handle.startsWith('@') ? handle : `@${handle}`) : `@${email.split('@')[0]}`;
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        try {
          await updateProfile(res.user, { displayName: cleanHandle });
        } catch (_profErr) {}
        setUser(res.user);
      }
      return res;
    } catch (err: any) {
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'This email address is already registered. Please sign in.'
        : (err?.message || 'Account creation failed. Please try again.');
      setAuthError(msg);
      return null;
    }
  };

  // 4. Password Reset for Email Users
  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err?.code === 'auth/user-not-found') {
        setAuthError('No account found with this email address.');
      } else if (err?.code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address.');
      } else {
        setAuthError(err?.message || 'Failed to send password reset email.');
      }
      return { success: false, error: err?.message };
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  return { 
    user, 
    loading, 
    signIn: signInWithGoogle, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword,
    logout, 
    authError, 
    setAuthError 
  };
};
