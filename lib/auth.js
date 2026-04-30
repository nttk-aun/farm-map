import CredentialsProvider from 'next-auth/providers/credentials';
import { getDbPool } from '@/lib/db';

function normalizeRole(role) {
  try {
    return String(role || '')
      .trim()
      .toLowerCase();
  } catch (error) {
    console.error('normalizeRole error:', error);
    return '';
  }
}

function getAuthSecret() {
  try {
    if (process.env.NEXTAUTH_SECRET) {
      return process.env.NEXTAUTH_SECRET;
    }
    if (process.env.NODE_ENV === 'production') {
      console.error('NEXTAUTH_SECRET is missing in production; using temporary fallback secret');
    }
    return process.env.DATABASE_URL || 'temporary-insecure-auth-secret';
  } catch (error) {
    console.error('getAuthSecret error:', error);
    return 'temporary-insecure-auth-secret';
  }
}

export const authOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const username = credentials?.username?.trim();
          const password = credentials?.password || '';
          if (!username || !password) {
            return null;
          }

          const pool = getDbPool();
          const result = await pool.query(
            `
              select id, username, role, is_active
              from farm.app_users
              where username = $1
                and password_hash = crypt($2, password_hash)
              limit 1
            `,
            [username, password]
          );
          const user = result.rows[0];
          if (!user || !user.is_active) {
            return null;
          }

          return {
            id: String(user.id),
            name: user.username,
            username: user.username,
            role: normalizeRole(user.role),
          };
        } catch (error) {
          console.error('Credentials authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.userId = user.id;
          token.username = user.username;
          token.role = user.role;
        }
        return token;
      } catch (error) {
        console.error('jwt callback error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        session.user = {
          ...session.user,
          id: token.userId,
          username: token.username,
          role: token.role,
        };
        return session;
      } catch (error) {
        console.error('session callback error:', error);
        return session;
      }
    },
  },
  secret: getAuthSecret(),
};
