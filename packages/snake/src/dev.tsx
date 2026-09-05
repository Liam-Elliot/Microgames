import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SnakeApp } from "./SnakeApp";

const el = document.getElementById("root");
if (el) createRoot(el).render(<StrictMode><SnakeApp /></StrictMode>);
