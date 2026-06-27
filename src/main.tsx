import { createRoot } from "react-dom/client";
import "./styles.css";
import { TunnelSection } from "./features/tunnel";

const ALLOWED_HOSTNAMES: Array<string> = ["localhost"];

if (
  typeof window !== "undefined" &&
  !ALLOWED_HOSTNAMES.includes(window.location.hostname) &&
  !window.location.hostname.endsWith(".netlify.app")
) {
  throw new Error(`Unauthorized hostname: ${window.location.hostname}`);
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(<TunnelSection />);
