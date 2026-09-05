import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RunnerApp } from "./RunnerApp";

const el = document.getElementById("root");
if (el) createRoot(el).render(<StrictMode><RunnerApp /></StrictMode>);
