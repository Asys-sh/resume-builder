import { PrismaAdapter } from '@auth/prisma-adapter'
import { verify } from '@node-rs/argon2'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { sendWelcomeEmail } from './email'
import { prisma } from './prisma'

const providers: NextAuthConfig['providers'] = [
  Credentials({
    credentials: {
      email: { type: 'email' },
      password: { type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined
      const password = credentials?.password as string | undefined
      if (!email || !password) return null

      const record = await prisma.password.findUnique({
        where: { email },
        include: { user: true },
      })
      if (!record) return null

      const valid = await verify(record.hash, password)
      if (!valid) return null

      return {
        id: record.user.id,
        name: record.user.name,
        email: record.user.email,
        image: record.user.image,
      }
    },
  }),
]

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET!,
  session: { strategy: 'jwt' },

  pages: {
    signIn: '/auth',
    newUser: '/dashboard',
  },

  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  providers,

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        await prisma.user.updateMany({
          where: { email: user.email, emailVerified: null },
          data: { emailVerified: new Date() },
        })
      }
      return true
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id
      return token
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },

  events: {
    async createUser({ user }) {
      if (user.email) {
        await sendWelcomeEmail({ email: user.email, name: user.name ?? undefined })
      }
    },
  },
})
