import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Farm Intelligence — AI-Assisted Agronomy & Spatial Intelligence Platform',
  description: 'Evidence-grounded farm decision support, field-level mapping, crop suitability, and seasonal planning tailored for Nigeria and expanding globally.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
