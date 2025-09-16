import { AuthProvider } from '@/hooks/useAuth';
import type { Metadata } from 'next';
import { Provider } from "@/components/ui/provider"

export const metadata: Metadata = {
  title: 'Finance App',
  description: 'App to manage your finances',
  authors: [{ name: 'arturylab' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
}