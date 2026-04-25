import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://terqresjhmivqwnsivzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcnFyZXNqaG1pdnF3bnNpdnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4OTI2MjEsImV4cCI6MjA4NjQ2ODYyMX0.Udh2Dx3ZVtrxEaedSEp8_2IJQykXA1o2JRi3JlAJoWI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@iamayaz.me',
    password: 'Health.iamayaz.me',
  });

  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('User created successfully:', data.user?.id);
    if (data.session) {
      console.log('Session established (Auto-confirm is ON)');
    } else {
      console.log('Check your email for confirmation (Auto-confirm is OFF)');
    }
  }
}

createUser();
