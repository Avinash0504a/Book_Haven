import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider, ThemeProvider, PincodeProvider, AuthProvider } from './providers/index.js';
import { DefaultAddressPincode } from './providers/DefaultAddressPincode.jsx';
import { App } from './App.jsx';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <PincodeProvider>
          <AuthProvider>
            <DefaultAddressPincode />
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </PincodeProvider>
      </ThemeProvider>
    </QueryProvider>
  </React.StrictMode>
);
