"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() { const { theme, resolvedTheme, toggleTheme } = useTheme(); const next = theme === "dark" ? "Luminous Paper" : theme === "light" ? "System theme" : "Midnight Aurora"; return <button className="icon-button theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${next}`} title={`Theme: ${theme === "system" ? `System (${resolvedTheme})` : theme}. Next: ${next}`}><span className="theme-icon" aria-hidden="true">{theme === "system" ? <Laptop size={15} /> : resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</span></button>; }
