import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { db, auth, FirebaseContext } from './firebase';
import { signInAnonymously } from 'firebase/auth';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

function Root() {
  useEffect(() => {
    // Ensure user is signed in for Firestore rules
    signInAnonymously(auth).catch(console.error);
  }, []);

  return (
    <StrictMode>
      <FirebaseContext.Provider value={{ firestore: db, auth }}>
        <App />
      </FirebaseContext.Provider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
