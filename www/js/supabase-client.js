import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL  = 'https://bvibvgvllqnbbnnjyhjs.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2aWJ2Z3ZsbHFuYmJubmp5aGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNTU3MDQsImV4cCI6MjA5NzkzMTcwNH0.eXy4uJ844uwiWByddJRmfQS92POt36AlqRrSyjMEKVE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
