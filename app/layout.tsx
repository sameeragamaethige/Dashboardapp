import type React from "react"
import type { Metadata } from "next"
import { AppTitle } from "@/components/ui/app-title"
import { FaviconManager } from "@/components/ui/favicon-manager"
import { ColorTheme } from "@/components/ui/color-theme"
import { ColorInitializer } from "@/components/ui/color-initializer"
import "./globals.css"

export const metadata: Metadata = {
  title: "", // No default title - set by admin only
  description: "Sameera Gamaethige",
  generator: "Economi",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="init-client-settings"
          dangerouslySetInnerHTML={{
            __html: `
              // Use defer attribute to ensure this runs after hydration
              document.addEventListener('DOMContentLoaded', function() {
                try {
                  if (typeof window !== 'undefined') {
                    // Prevent flashing by setting a flag to indicate we're checking storage
                    window.__checkingTitle = true;
                    
                    // Try to get settings from localStorage first (fallback)
                    const localSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
                    if (localSettings && localSettings.title) {
                      document.title = localSettings.title;
                      
                      // Also update metadata tags early
                      const metaTags = document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]');
                      metaTags.forEach(tag => {
                        tag.setAttribute('content', localSettings.title);
                      });
                      
                      // Set a flag that the AppTitle component can check
                      window.__initialTitleSet = localSettings.title;
                    } else {
                      // If no local settings, set a default title to prevent flash
                      document.title = 'Dashboard V3';
                      window.__initialTitleSet = 'Dashboard V3';
                    }
                    window.__checkingTitle = false;
                  }
                } catch (e) {
                  window.__checkingTitle = false;
                  // Set default title to prevent flash
                  document.title = 'Dashboard V3';
                  window.__initialTitleSet = 'Dashboard V3';
                }
              });
            `,
          }}
          defer
        />

      </head>
      <body>
        <ColorInitializer />
        <AppTitle />
        <FaviconManager />
        <ColorTheme />
        {children}
        <footer className="w-full py-3 bg-white text-center text-xs text-gray-700 shadow-sm border-t border-gray-300">
          © 2025 All RIGHTS RESERVED | POWERED BY{" "}
          <a
            href="https://economi.lk"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-gray-900"
          >
            ECONOMI
          </a>
        </footer>
      </body>
    </html>
  )
}
