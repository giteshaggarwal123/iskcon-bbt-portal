
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('Application starting...');
console.log('Environment:', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

console.log('Root element found, creating React root...');

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log('React application rendered successfully');
