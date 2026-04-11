import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { User } from '../types';

interface CompleteProfilePageProps {
  user: User;
  onComplete: (user: User) => void;
}

interface RegionItem {
  id: string;
  name: string;
}

const CompleteProfilePage: React.FC<CompleteProfilePageProps> = ({ user, onComplete }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data));
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvince}.json`)
        .then(res => res.json())
        .then(data => {
          setCities(data);
          setDistricts([]);
          setVillages([]);
          setSelectedCity('');
        });
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCity}.json`)
        .then(res => res.json())
        .then(data => {
          setDistricts(data);
          setVillages([]);
          setSelectedDistrict('');
        });
    }
  }, [selectedCity]);

  useEffect(() => {
    if (selectedDistrict) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistrict}.json`)
        .then(res => res.json())
        .then(data => setVillages(data));
    }
  }, [selectedDistrict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !selectedProvince || !selectedCity) {
      setError('Mohon lengkapi semua data');
      return;
    }

    setLoading(true);
    setError('');

    const provinceName = provinces.find(p => p.id === selectedProvince)?.name || '';
    const cityName = cities.find(c => c.id === selectedCity)?.name || '';
    const districtName = districts.find(d => d.id === selectedDistrict)?.name || '';
    const villageName = villages.find(v => v.id === selectedVillage)?.name || '';

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: name,
        phone: phone,
        province: provinceName,
        city: cityName,
        district: districtName,
        village: villageName,
        email: user.email,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    const updatedUser: User = {
      ...user,
      name: name,
      phone: phone,
      province: provinceName,
      city: cityName,
      district: districtName,
      village: villageName
    };

    onComplete(updatedUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc]">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-xl overflow-y-auto max-h-[95vh] no-scrollbar p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900">Lengkapi Profil</h2>
          <p className="text-slate-400 text-xs mt-2">Isi data diri Anda untuk melanjutkan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-blue-600 uppercase ml-2">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              placeholder="Nama lengkap"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-blue-600 uppercase ml-2">Nomor WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              placeholder="0812xxxxxx"
              required
            />
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-[1px] flex-1 bg-gray-100"></span>
              <span className="text-[10px] font-black text-gray-300 uppercase">Lokasi Tambak</span>
              <span className="h-[1px] flex-1 bg-gray-100"></span>
            </div>

            <div className="space-y-3">
              <select 
                value={selectedProvince} 
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                required
              >
                <option value="">Provinsi</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              <select 
                value={selectedCity} 
                disabled={!selectedProvince}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm disabled:opacity-50"
                required
              >
                <option value="">Kota/Kabupaten</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select 
                value={selectedDistrict} 
                disabled={!selectedCity}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm disabled:opacity-50"
              >
                <option value="">Kecamatan</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <select 
                value={selectedVillage} 
                disabled={!selectedDistrict}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm disabled:opacity-50"
              >
                <option value="">Kelurahan/Desa</option>
                {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-xs rounded-2xl font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-base shadow-lg active:scale-95 transition-all disabled:opacity-70"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : 'Simpan & Lanjutkan'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfilePage;