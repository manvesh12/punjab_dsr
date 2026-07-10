import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart DSR Portal",
  description: "District Survey Report Automation System"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem('theme');
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
