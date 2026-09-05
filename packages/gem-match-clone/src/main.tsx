import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GemMatchApp } from "./GemMatchApp";

const el = document.getElementById("root");
if (el) createRoot(el).render(<StrictMode><GemMatchApp /></StrictMode>);
