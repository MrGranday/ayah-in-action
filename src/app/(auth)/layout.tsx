import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login with your Quran.com account to start tracking your reflections.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
}
