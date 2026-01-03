import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ekrhekungvoisfughwuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcmhla3VuZ3ZvaXNmdWdod3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0Nzk2NTAsImV4cCI6MjA2ODA1NTY1MH0.kaJMUh5NOSVeQO2slUiovToUvNolpjxjZt_HCGuIUxU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});