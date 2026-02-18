import { supabase } from '../src/lib/supabase';

export const authService = {
  // SIGN UP
  async signup(userData: any) {
    const { email, password, name, phone, province, city, district, village } = userData;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          province,
          city,
          district,
          village
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Gagal mendaftar');

    return {
      id: authData.user.id,
      email: authData.user.email,
      name,
      phone,
      province,
      city,
      district,
      village
    };
  },

  // LOGIN
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!data.user) throw new Error('Gagal login');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') throw profileError;

    return {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name || data.user.user_metadata?.name || '',
      phone: profile?.phone || data.user.user_metadata?.phone || '',
      province: profile?.province || data.user.user_metadata?.province || '',
      city: profile?.city || data.user.user_metadata?.city || '',
      district: profile?.district || data.user.user_metadata?.district || '',
      village: profile?.village || data.user.user_metadata?.village || ''
    };
  },

  // LOGOUT
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // FORGOT PASSWORD
  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://tambakita.netlify.app/reset-password'
    });
    if (error) throw error;
  },

  // GET CURRENT USER (FIXED: pakai getUser, bukan getSession)
  async getCurrentUser() {
    try {
      // PAKE getUser() yang selalu fresh
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Get user error:', error);
        return null;
      }
      
      if (!user) return null;

      // Ambil profile dari tabel profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError);
      }

      return {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name || '',
        phone: profile?.phone || user.user_metadata?.phone || '',
        province: profile?.province || user.user_metadata?.province || '',
        city: profile?.city || user.user_metadata?.city || '',
        district: profile?.district || user.user_metadata?.district || '',
        village: profile?.village || user.user_metadata?.village || ''
      };
      
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
};