'use server'

import { signOut } from './auth'

export async function serverSignOut() {
  await signOut({ redirectTo: '/' })
}
