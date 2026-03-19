import { decode } from '@auth/core/jwt'
import type { User } from '@prisma-generated/client'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const COOKIE_NAME = 'authjs.session-token'

export async function getServerUser(): Promise<{ id: string } | null> {
  const cookieStore = await cookies()
  const cookieVal = cookieStore.get(COOKIE_NAME)?.value
  if (!cookieVal) return null

  try {
    const token = await decode({
      token: cookieVal,
      secret: process.env.AUTH_SECRET!,
      salt: COOKIE_NAME,
    })
    if (!token?.sub) return null
    return { id: token.sub }
  } catch {
    return null
  }
}

export async function getUserData(): Promise<User | undefined> {
  const user = await getServerUser()

  if (!user) {
    return undefined
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
    })
    if (!userData) {
      return undefined
    }
    return userData
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    return undefined
  }
}

// Hello my cutie gemini, we have to plan further, i am building a Resume builder and I wish to know what kind of features most have that i do not have and we should implement them, not all of them, just a few, we also do need to clean the whole project of unused dependencies. we have reached a point where we can make a Resume and download it, though we are missing exportation as docx
