import React from "react"

export function Logo({ className = "h-8 w-8 text-primary", ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" {...props}>
            {/* Top Left Quarter Circle - Perfect Bezier */}
            <path d="M46 0 C20.595 0 0 20.595 0 46 L46 46 Z" fill="currentColor" />
            
            {/* Bottom Right Quarter Circle - Perfect Bezier */}
            <path d="M54 100 C79.405 100 100 79.405 100 54 L54 54 Z" fill="currentColor" />
            
            {/* Top Right Circle - With 85% opacity for premium SaaS depth */}
            <circle cx="77" cy="23" r="19" fill="currentColor" opacity="0.8" />
            
            {/* Bottom Left Circle - With 85% opacity for premium SaaS depth */}
            <circle cx="23" cy="77" r="19" fill="currentColor" opacity="0.8" />
        </svg>
    )
}
