import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "material-symbols/outlined.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="452784137325-c1dgq2blk2spern7pb0l9e4tf5i05vg9.apps.googleusercontent.com">
    <BrowserRouter>
      <StrictMode>
        <App />
      </StrictMode>
    </BrowserRouter>
  </GoogleOAuthProvider>
)