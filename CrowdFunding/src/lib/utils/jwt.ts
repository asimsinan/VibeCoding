import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresIn: string = '24h'): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded !== 'object') {
      return null;
    }
    return decoded as TokenPayload;
  } catch (error) {
    return null;
  }
}
