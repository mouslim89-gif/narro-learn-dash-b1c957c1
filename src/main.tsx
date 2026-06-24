import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as path from "./lib/path-polyfill";

// Global polyfill for kuromoji which expects 'path' to be available
if (typeof window !== "undefined") {
  (window as any).path = path;
}

createRoot(document.getElementById("root")!).render(<App />);
