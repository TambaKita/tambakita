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
      village: profile?.village || data.user.user_metadata?.village || '',
      avatar: profile?.avatar || ''
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

  // GET CURRENT USER
  async getCurrentUser() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('No active session');
        return null;
      }
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Get user error:', error);
        return null;
      }
      
      if (!user) return null;

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
        village: profile?.village || user.user_metadata?.village || '',
        avatar: profile?.avatar || ''
      };
      
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // UPDATE USER DATA
  async updateUserData(data: {
    name?: string;
    phone?: string;
    province?: string;
    city?: string;
    district?: string;
    village?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, message: 'Session tidak ditemukan. Silakan login ulang.' };
      }
      
      const userId = session.user.id;

      // Update password jika ada
      if (data.newPassword) {
        if (!data.currentPassword) {
          return { success: false, message: 'Masukkan password lama' };
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: session.user.email!,
          password: data.currentPassword
        });

        if (signInError) {
          return { success: false, message: 'Password lama salah' };
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: data.newPassword
        });

        if (updateError) {
          return { success: false, message: updateError.message };
        }
      }

      // Update profile
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.province !== undefined) updateData.province = data.province;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.district !== undefined) updateData.district = data.district;
      if (data.village !== undefined) updateData.village = data.village;
      
      if (Object.keys(updateData).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (profileError) {
          console.error('Profile update error:', profileError);
          return { success: false, message: 'Gagal update profil: ' + profileError.message };
        }
      }

      return { success: true, message: 'Data berhasil diupdate' };
      
    } catch (error: any) {
      console.error('Update user data error:', error);
      return { success: false, message: error.message || 'Terjadi kesalahan' };
    }
  },

  // UPDATE PASSWORD
  async updatePassword(currentPassword: string, newPassword: string) {
    return this.updateUserData({
      currentPassword,
      newPassword
    });
  },

  // UPDATE PROFILE
  async updateProfile(profileData: {
    name?: string;
    phone?: string;
    province?: string;
    city?: string;
    district?: string;
    village?: string;
  }) {
    return this.updateUserData(profileData);
  },

  // ==================== KOMPRES GAMBAR ====================
  async compressImage(file: File, maxWidth: number = 400, quality: number = 0.6): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              console.log(`📸 Kompres: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
              resolve(compressedFile);
            } else {
              reject(new Error('Gagal kompres gambar'));
            }
          }, 'image/jpeg', quality);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  },

  // UPLOAD AVATAR - dengan kompresi otomatis
  async uploadAvatar(file: File): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: false, message: 'Session tidak ditemukan. Silakan login ulang.' };
      }
      
      const userId = session.user.id;

      // Validasi tipe file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, message: 'Format harus JPG, PNG, atau WEBP' };
      }

      // Validasi ukuran (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        return { success: false, message: 'Ukuran maksimal 2MB' };
      }

      // KOMPRES GAMBAR SEBELUM UPLOAD
      const compressedFile = await this.compressImage(file, 400, 0.6);

      // Hapus avatar lama jika ada
      const { data: oldProfile } = await supabase
        .from('profiles')
        .select('avatar')
        .eq('id', userId)
        .single();

      if (oldProfile?.avatar) {
        const oldPath = oldProfile.avatar.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('Avatar')
            .remove([`${userId}/${oldPath}`])
            .catch(e => console.log('Gagal hapus file lama:', e));
        }
      }

      // Upload file yang sudah dikompres
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Avatar')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('Upload error detail:', uploadError);
        return { success: false, message: `Gagal upload: ${uploadError.message}` };
      }

      // Dapatkan public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Avatar')
        .getPublicUrl(filePath);

      // Update profile dengan URL avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar: publicUrl })
        .eq('id', userId);

      if (updateError) {
        return { success: false, message: 'Gagal update avatar: ' + updateError.message };
      }

      return { success: true, message: 'Foto profil berhasil diupload', url: publicUrl };

    } catch (error: any) {
      console.error('Upload avatar error:', error);
      return { success: false, message: error.message || 'Terjadi kesalahan' };
    }
  },

  // HAPUS AVATAR
  async deleteAvatar(): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return { success: false, message: 'Session tidak ditemukan. Silakan login ulang.' };
      }
      
      const userId = session.user.id;

      // Ambil avatar URL dari profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar')
        .eq('id', userId)
        .single();

      if (profile?.avatar) {
        const oldPath = profile.avatar.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('Avatar')
            .remove([`${userId}/${oldPath}`])
            .catch(e => console.log('Gagal hapus file:', e));
        }
      }

      // Update profile hapus avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar: null })
        .eq('id', userId);

      if (updateError) {
        return { success: false, message: 'Gagal hapus avatar: ' + updateError.message };
      }

      return { success: true, message: 'Foto profil berhasil dihapus' };

    } catch (error: any) {
      console.error('Delete avatar error:', error);
      return { success: false, message: error.message || 'Terjadi kesalahan' };
    }
  }
};