// server/src/types/express.d.ts
import { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    export interface Request {
      user?: User; // Using the full Supabase User type for now
                   // Alternatively, could be: user?: { id: string; [key: string]: any; }
    }
  }
}
