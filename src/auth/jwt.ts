import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const TOKEN_EXPIRES_IN = '12h';

export interface AuthTokenPayload {
  userId: number;
  email: string;
}

export const signAuthToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

export const verifyAuthToken = (token: string): AuthTokenPayload =>
  jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
