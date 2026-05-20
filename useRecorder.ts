import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LILT - Cinematic Music Shadowing',
  description: 'Learn English pronunciation through immersive music imitation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-lilt-darker min-h-screen">
        {children}
      </body>
    </html>
  );
}
