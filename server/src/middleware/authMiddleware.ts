import { Request, Response, NextFunction } from 'express';
import { supabase } from '../index'; // Adjust path if your supabase client is exported elsewhere

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided or incorrect format' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Supabase auth error:', error.message);
      // Differentiate between network errors and actual invalid token errors if possible
      // For now, any error from getUser is treated as an authentication failure.
      return res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token or user does not exist' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Unexpected error in auth middleware:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
