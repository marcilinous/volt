import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata = {
  title: "Clash — Date Differently",
  description: "A brutalist-minimal dating app with three discovery modes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text)] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
