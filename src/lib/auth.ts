import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export interface AuthSession extends JWTPayload {
  id: string | number
  role: string
  email?: string
  name?: string
}

const secretKey = process.env.NEXTAUTH_SECRET || 'dummy-secret-for-dev'
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: AuthSession) {
  return await new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function decrypt(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    return payload as AuthSession
  } catch {
    return null
  }
}
