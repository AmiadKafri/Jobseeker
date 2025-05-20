import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config(); // Load .env from project root

// Supabase client initialization
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Make sure .env is configured correctly.');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import jobRoutes from './routes/jobRoutes'; // Import the job router

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello from Express server!');
});

app.use('/api/jobs', jobRoutes); // Mount the job router

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
