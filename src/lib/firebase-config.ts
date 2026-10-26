import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// User Firebase Project Configuration (haluser) - shared with hal_frontend user authentication
const userFirebaseConfig = {
  apiKey:
    import.meta.env.VITE_USER_FIREBASE_API_KEY ||
    'AIzaSyAaSMi9Xpzf0YSD9QMZ-uOPSTOMbHQ7Z0M',
  authDomain:
    import.meta.env.VITE_USER_FIREBASE_AUTH_DOMAIN ||
    'haluser.firebaseapp.com',
  projectId:
    import.meta.env.VITE_USER_FIREBASE_PROJECT_ID ||
    'haluser',
};

// Initialize User Firebase App with 'halUser' name, consistent with hal_frontend
const userApp = !getApps().some((app) => app.name === 'halUser')
  ? initializeApp(userFirebaseConfig, 'halUser')
  : getApp('halUser');

// Export Auth instances
export const userAuth: Auth = getAuth(userApp);
export const employeeAuth: Auth = userAuth; // Aliased for employee portal context

export default userAuth;
