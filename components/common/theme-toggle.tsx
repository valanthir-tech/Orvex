"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Check } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className={`cursor-pointer ${theme === "light" ? "bg-stone-100 dark:bg-stone-800" : ""}`}
                >
                    <Sun className="mr-2 h-4 w-4 text-amber-500" />
                    Light
                    {theme === "light" && <Check className="ml-auto h-4 w-4 text-foreground" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className={`cursor-pointer ${theme === "dark" ? "bg-stone-100 dark:bg-stone-800" : ""}`}
                >
                    <Moon className="mr-2 h-4 w-4 text-sky-500" />
                    Dark
                    {theme === "dark" && <Check className="ml-auto h-4 w-4 text-foreground" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className={`cursor-pointer ${theme === "system" ? "bg-stone-100 dark:bg-stone-800" : ""}`}
                >
                    <Monitor className="mr-2 h-4 w-4 text-muted-foreground" />
                    System
                    {theme === "system" && <Check className="ml-auto h-4 w-4 text-foreground" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
