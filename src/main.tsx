
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('Application starting...');
console.log('Environment:', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  url: window.location.href
});

// Handle navigation errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('Root element not found!');
  // Create a fallback div if root is missing
  const fallbackRoot = document.createElement('div');
  fallbackRoot.id = 'root';
  document.body.appendChild(fallbackRoot);
  console.log('Created fallback root element');
}

console.log('Root element found, creating React root...');

const root = createRoot(rootElement || document.getElementById('root')!);

try {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('React application rendered successfully');
} catch (error) {
  console.error('Error rendering React application:', error);
  // Fallback error display
  const errorDiv = document.createElement('div');
  errorDiv.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1>Application Error</h1>
      <p>There was an error loading the application. Please refresh the page.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Refresh Page
      </button>
      <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #6c757d;">Error: ${error}</p>
      </div>
    </div>
  `;
  document.body.appendChild(errorDiv);
}
