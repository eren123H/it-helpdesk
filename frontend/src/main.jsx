import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; height: 100%; }
  body { 
    font-family: 'Inter', system-ui, -apple-system, sans-serif; 
    margin: 0;
    min-height: 100vh;
    background-color: #042125; /* Koyu Turkuaz sabit renk */
    color: #eaf6f7;
  }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  input, select, textarea, button { font-family: inherit; }
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5) !important;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  }
  a { text-decoration: none; }
`;
document.head.appendChild(style);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
