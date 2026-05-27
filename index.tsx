import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { ThankYouPage } from './components/ThankYouPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const isThankYouPage = window.location.pathname === '/obrigado-masterclass-seo' || window.location.pathname === '/obrigado-masterclass-seo/';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isThankYouPage ? <ThankYouPage /> : <App />}
  </React.StrictMode>
);