import { Configuration } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: 'd7430172-cf9c-438e-8a3a-210f88d2d23c', 
    authority: 'https://login.microsoftonline.com/999128ab-cdb0-42d7-892c-d7e8752556f9', 
    redirectUri: window.location.origin // Detecta automáticamente si es local, Netlify o Vercel
  },
  cache: {
    cacheLocation: 'localStorage',
  }
};