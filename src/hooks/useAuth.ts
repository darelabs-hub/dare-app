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
      return await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        console.warn(
          'Firebase Auth Notice: Current domain is not in Authorized Domains list. Please add your domain (e.g. dare.me.uk) in the Firebase Console -> Authentication -> Settings -> Authorized Domains.'
        );
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        console.error('Firebase Auth Error:', err);
      }
      throw err;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  return { user, loading, signIn, logout };
};
