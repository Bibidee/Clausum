"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() { const { theme, toggleTheme } = useTheme(); return <button className="icon-button theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "Luminous Paper" : "Midnight Aurora"}`}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</button>; }
