import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://terqresjhmivqwnsivzb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcnFyZXNqaG1pdnF3bnNpdnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4OTI2MjEsImV4cCI6MjA4NjQ2ODYyMX0.Udh2Dx3ZVtrxEaedSEp8_2IJQykXA1o2JRi3JlAJoWI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
