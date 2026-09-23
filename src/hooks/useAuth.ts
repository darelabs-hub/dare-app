import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        console.warn(
          'Firebase Auth Notice: Current domain is not in Authorized Domains list for project ' +
            auth.app.options.projectId +
            '. Please verify the domain (dare.me.uk) is added to Authorized Domains for this specific project in the Firebase Console.'
        );
      } else if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed the popup window, harmless
      } else {
        console.error('Firebase Auth Error:', err);
      }
      return null;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  return { user, loading, signIn, logout };
};
