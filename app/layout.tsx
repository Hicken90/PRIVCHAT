import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShadowChat 98',
  description: 'Windows 98 retro PWA chat app — P2P + AI, E2E encrypted, no servers',
  manifest: '/manifest.json',
  applicationName: 'ShadowChat 98',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ShadowChat 98',
  },
  openGraph: {
    title: 'ShadowChat 98',
    description: 'Windows 98 retro PWA chat app',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#008080',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
          }}
        />
      </body>
    </html>
  );
}
