'use client';

import { SessionProvider } from 'next-auth/react';

export default function AuthSessionProvider({ children }) {
  try {
    return <SessionProvider>{children}</SessionProvider>;
  } catch (error) {
    console.error('AuthSessionProvider error:', error);
    return <>{children}</>;
  }
}
