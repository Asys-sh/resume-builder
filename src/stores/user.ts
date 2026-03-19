import type { User } from '@prisma-generated/client'
import { atom } from 'jotai'

export const userAtom = atom<User | undefined>(undefined)
