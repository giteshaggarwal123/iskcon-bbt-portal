// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://daiimiznlkffbbadhodw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhaWltaXpubGtmZmJiYWRob2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzgxMTIsImV4cCI6MjA2NDM1NDExMn0.gPvDe0Pfx5avJGvA5uLOi59pjodaCoTI2c17MIST9dA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);