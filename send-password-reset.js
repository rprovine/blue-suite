import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables from .env file
const envFile = readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables');
  console.error('Found URL:', !!supabaseUrl);
  console.error('Found Key:', !!supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sendPasswordReset() {
  const email = 'rprovine@gmail.com';

  console.log(`Sending password reset email to ${email}...`);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${supabaseUrl.replace('.supabase.co', '')}/reset-password`,
  });

  if (error) {
    console.error('Error sending password reset email:', error);
    process.exit(1);
  }

  console.log('✓ Password reset email sent successfully!');
  console.log(`\nCheck your email at ${email} for the password reset link.`);
  console.log('Click the link and set your new password to: MattF');
}

sendPasswordReset();
