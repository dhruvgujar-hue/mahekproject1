import jwt from 'jsonwebtoken';

export function generateKlingToken(): string | null {
  const { KLING_ACCESS_KEY, KLING_SECRET_KEY } = process.env;
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) return null;
  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: Math.floor(Date.now() / 1000) + 1800,
    nbf: Math.floor(Date.now() / 1000) - 5,
  } as const;
  return jwt.sign(payload, KLING_SECRET_KEY, { algorithm: 'HS256' });
}

