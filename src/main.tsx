import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installLiquidGlassMap } from "./lib/liquid-glass-map";

installLiquidGlassMap();

createRoot(document.getElementById("root")!).render(<App />);
