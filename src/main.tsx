import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Polyfill for Kuromoji which expects path.join in the browser environment
if (typeof window !== 'undefined') {
  (window as any).path = {
    join: (...args: string[]) => {
      return args.join('/').replace(/\/+/g, '/');
    }
  };
}

createRoot(document.getElementById("root")!).render(<App />);
