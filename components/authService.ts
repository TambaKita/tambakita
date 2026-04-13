import { supabase } from '../src/lib/supabase';
import { User } from '../types';

class AuthService {
  // Login dengan email/password
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return this.formatUser(data.user);
  }

  // Register dengan email/password
  async register(email: string, password: string, name: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;

    // Buat profile di tabel profiles
    if (data.user) {
      await supabase.from('profiles').insert([
        {
          id: data.user.id,
          name: name,
          email: email
        }
      ]);
    }

    return this.formatUser(data.user);
  }

  // Logout
  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Ambil data profile dari tabel profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      name: profile?.name || user.user_metadata?.name || '',
      avatar: profile?.avatar || '',
      role: profile?.role || 'member'
    };
  }

  // UPDATE USER DATA (Password, Name, Avatar)
  async updateUserData(data: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
    avatar?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      // Update password jika ada
      if (data.newPassword) {
        // Verifikasi password lama dulu
        if (!data.currentPassword) {
          return { success: false, message: 'Masukkan password lama' };
        }

        // Coba login dulu untuk verifikasi password lama
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: data.currentPassword
        });

        if (signInError) {
          return { success: false, message: 'Password lama salah' };
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: data.newPassword
        });

        if (updateError) {
          return { success: false, message: updateError.message };
        }
      }

      // Update profile (name & avatar) di tabel profiles
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.avatar) updateData.avatar = data.avatar;
      
      if (Object.keys(updateData).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          return { success: false, message: 'Gagal update profil' };
        }
      }

      return { success: true, message: 'Data berhasil diupdate' };
      
    } catch (error: any) {
      console.error('Update user data error:', error);
      return { success: false, message: error.message || 'Terjadi kesalahan' };
    }
  }

  // Format user dari Supabase user ke User type kita
  private async formatUser(supabaseUser: any): Promise<User> {
    // Ambil data profile dari tabel profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profile?.name || supabaseUser.user_metadata?.name || '',
      avatar: profile?.avatar || '',
      role: profile?.role || 'member'
    };
  }
}

export const authService = new AuthService();