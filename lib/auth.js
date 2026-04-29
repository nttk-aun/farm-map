import bcrypt from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDbPool } from '@/lib/db';

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
              select id, username, password_hash, role, is_active
              from farm.app_users
              where username = $1
              limit 1
            `,
            [username]
          );
          const user = result.rows[0];
          if (!user || !user.is_active) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password_hash);
          if (!isValidPassword) {
            return null;
          }

          return {
            id: String(user.id),
            name: user.username,
            username: user.username,
            role: user.role,
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
  secret: process.env.NEXTAUTH_SECRET,
};
