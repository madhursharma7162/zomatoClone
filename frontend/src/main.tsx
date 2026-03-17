import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProvider } from './context/AppContext.tsx';
import "leaflet/dist/leaflet.css";


export const authService = "https://bookish-space-waddle-jjx454p9jgqx3jqrp-5000.app.github.dev/api/auth";
export const restaurantService = "https://bookish-space-waddle-jjx454p9jgqx3jqrp-5001.app.github.dev/";
export const utilsService = "https://bookish-space-waddle-jjx454p9jgqx3jqrp-5002.app.github.dev/";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="97089728063-2vih33l8097k402dpnat2m5d9lijhv3p.apps.googleusercontent.com">
      <AppProvider><App /></AppProvider>
    </GoogleOAuthProvider>
    
  </StrictMode>,
)
