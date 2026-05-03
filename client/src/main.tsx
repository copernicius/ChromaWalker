import { createRoot } from "react-dom/client";
import { App } from "./app/App.tsx";
import { watchAuthForSocket } from "./app/lib";
import "./styles/index.css";

// Subscribe once at boot so the realtime socket reconnects/teardowns
// whenever the auth token changes (login/logout). Idempotent.
watchAuthForSocket();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
createRoot(rootElement).render(<App />);
