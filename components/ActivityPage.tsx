import React, { useState, useEffect } from 'react';
import { User, Pond } from '../types';
import { supabase } from '../src/lib/supabase';
import jsPDF from 'jspdf';

interface ActivityPageProps {
  user: User;
}

interface ActivityLog {
  id: string;
  pond_id: string;
  pond_name: string;
  activity_type: string;
  amount: number | null;
  notes: string;
  photo_url: string | null;
  created_at: string;
  user_name: string;
  feed_type?: string;
  medicine_name?: string;
  dose?: number;
  dose_unit?: string;
  sample_count?: number;
  sample_weight?: number;
  sample_length?: number;
  ph?: number;
  temperature?: number;
  dissolved_oxygen?: number;
  ammonia?: number;
}

const ActivityPage: React.FC<ActivityPageProps> = ({ user }) => {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [activeType, setActiveType] = useState<string>('Feeding');
  const [selectedPondId, setSelectedPondId] = useState('');

  // Filter States
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterPondId, setFilterPondId] = useState('all');

  // Form States
  const [pakanKg, setPakanKg] = useState('');
  const [pakanJenis, setPakanJenis] = useState('');
  const [matiJumlah, setMatiJumlah] = useState('');
  const [sampleJumlah, setSampleJumlah] = useState('');
  const [sampleBerat, setSampleBerat] = useState('');
  const [samplePanjang, setSamplePanjang] = useState('');
  const [obatNama, setObatNama] = useState('');
  const [obatDosis, setObatDosis] = useState('');
  const [obatSatuan, setObatSatuan] = useState('Gram');
  const [airPh, setAirPh] = useState('');
  const [airSuhu, setAirSuhu] = useState('');
  const [airDo, setAirDo] = useState('');
  const [airAmonia, setAirAmonia] = useState('');
  const [catatanUmum, setCatatanUmum] = useState('');

  // Ambil data kolam (hanya yang user punya akses)
  const fetchPonds = async () => {
    try {
      const { data, error } = await supabase
        .from('ponds')
        .select('*');

      if (error) throw error;

      const formattedPonds: Pond[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        ownerId: item.owner_id,
        ownerName: item.owner_name,
        fishType: item.fish_type,
        fishCount: item.fish_count,
        members: item.members || [],
        customFeeds: item.custom_feeds || ['LP-1', 'LP-2', 'LP-3'],
        currentMetrics: item.current_metrics || { ph: 7, temp: 28, ammonia: 0, do: 5, lastUpdated: new Date().toISOString() }
      }));

      const myPonds = formattedPonds.filter(p => 
        p.members?.some((m: any) => m.id === user.id) || p.ownerId === user.id
      );

      setPonds(myPonds);
      if (myPonds.length > 0 && !selectedPondId) {
        setSelectedPondId(myPonds[0].id);
      }
    } catch (error) {
      console.error('Error fetching ponds:', error);
    }
  };

  // Ambil riwayat aktivitas dengan filter
  const fetchActivities = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      const startDateTime = new Date(filterDate);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(filterDate);
      endDateTime.setHours(23, 59, 59, 999);

      let query = supabase
        .from('daily_activities')
        .select('*')
        .gte('created_at', startDateTime.toISOString())
        .lte('created_at', endDateTime.toISOString())
        .order('created_at', { ascending: false });

      if (filterPondId !== 'all') {
        query = query.eq('pond_id', filterPondId);
      }

      const { data: activities, error: activitiesError } = await query;

      if (activitiesError) throw activitiesError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name');

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]));
      const pondMap = new Map(ponds.map(p => [p.id, p.name]));

      const formattedLogs: ActivityLog[] = (activities || []).map((item: any) => ({
        id: item.id,
        pond_id: item.pond_id,
        pond_name: pondMap.get(item.pond_id) || 'Kolam Lain',
        activity_type: item.activity_type,
        amount: item.amount,
        notes: item.notes,
        photo_url: item.photo_url,
        created_at: item.created_at,
        user_name: profileMap.get(item.user_id) || 'User',
        feed_type: item.feed_type,
        medicine_name: item.medicine_name,
        dose: item.dose,
        dose_unit: item.dose_unit,
        sample_count: item.sample_count,
        sample_weight: item.sample_weight,
        sample_length: item.sample_length,
        ph: item.ph,
        temperature: item.temperature,
        dissolved_oxygen: item.dissolved_oxygen,
        ammonia: item.ammonia
      }));

      setLogs(formattedLogs);
      
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ambil data untuk export dengan range tanggal
  const fetchActivitiesForExport = async (start: string, end: string, pondId: string) => {
    try {
      const startDateTime = new Date(start);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(end);
      endDateTime.setHours(23, 59, 59, 999);

      let query = supabase
        .from('daily_activities')
        .select('*')
        .gte('created_at', startDateTime.toISOString())
        .lte('created_at', endDateTime.toISOString())
        .order('created_at', { ascending: true });

      if (pondId !== 'all') {
        query = query.eq('pond_id', pondId);
      }

      const { data: activities, error } = await query;
      if (error) throw error;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name');

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]));
      const pondMap = new Map(ponds.map(p => [p.id, p.name]));

      return (activities || []).map((item: any) => ({
        id: item.id,
        pond_id: item.pond_id,
        pond_name: pondMap.get(item.pond_id) || 'Kolam Lain',
        activity_type: item.activity_type,
        amount: item.amount,
        notes: item.notes,
        created_at: item.created_at,
        user_name: profileMap.get(item.user_id) || 'User',
        feed_type: item.feed_type,
        medicine_name: item.medicine_name,
        dose: item.dose,
        dose_unit: item.dose_unit,
        sample_count: item.sample_count,
        sample_weight: item.sample_weight,
        sample_length: item.sample_length,
        ph: item.ph,
        temperature: item.temperature,
        dissolved_oxygen: item.dissolved_oxygen,
        ammonia: item.ammonia
      }));
    } catch (error) {
      console.error('Error fetching export data:', error);
      return [];
    }
  };

  // Broadcast notifikasi danger
  const broadcastDanger = async (pondName: string, pondId: string, reason: string) => {
    try {
      const { data: pond } = await supabase
        .from('ponds')
        .select('members')
        .eq('id', pondId)
        .single();

      if (!pond?.members) return;

      const notifications = pond.members.map((member: any) => ({
        user_id: member.id,
        type: 'danger',
        from_name: 'Sistem Sensor',
        post_excerpt: `DANGER: Kondisi ${pondName} kritis! (${reason})`,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Error broadcasting danger:', error);
    }
  };

  // Export ke PDF dengan range tanggal
  const handleExportPDF = async () => {
    setShowDatePicker(true);
  };

  const confirmExport = async () => {
    setExporting(true);
    setShowDatePicker(false);

    try {
      const exportLogs = await fetchActivitiesForExport(startDate, endDate, filterPondId);
      
      if (exportLogs.length === 0) {
        alert('Tidak ada data untuk periode yang dipilih!');
        setExporting(false);
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Logo (ambil dari GitHub)
      const imgUrl = 'https://raw.githubusercontent.com/TambaKita/tambakita/main/public/icon.png';
      try {
        const img = await fetch(imgUrl);
        const imgBlob = await img.blob();
        const reader = new FileReader();
        reader.onloadend = function() {
          const imgData = reader.result as string;
          doc.addImage(imgData, 'PNG', 20, 15, 15, 15);
        };
        reader.readAsDataURL(imgBlob);
      } catch (e) {
        console.log('Logo not found');
      }
      
      // Header
      doc.setFontSize(24);
      doc.setTextColor(37, 99, 235);
      doc.text('TambaKita', 40, 25);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Smart Aquaculture Management', 40, 33);
      
      doc.setDrawColor(37, 99, 235);
      doc.line(20, 40, 190, 40);
      
      // Title
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text('Laporan Aktivitas', 20, 55);
      
      // Info filter
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      
      let yPos = 68;
      
      const selectedPondFilter = ponds.find(p => p.id === filterPondId);
      if (filterPondId !== 'all' && selectedPondFilter) {
        doc.text(`Kolam: ${selectedPondFilter.name} (${selectedPondFilter.fishType})`, 20, yPos);
        yPos += 7;
      } else {
        doc.text(`Kolam: Semua Kolam`, 20, yPos);
        yPos += 7;
      }
      
      doc.text(`Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`, 20, yPos);
      yPos += 7;
      doc.text(`Diekspor pada: ${new Date().toLocaleString('id-ID')}`, 20, yPos);
      yPos += 12;
      
      // Header tabel
      doc.setFillColor(37, 99, 235);
      doc.setDrawColor(37, 99, 235);
      doc.rect(20, yPos, 170, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('No', 25, yPos + 7);
      doc.text('Tanggal', 40, yPos + 7);
      doc.text('Waktu', 65, yPos + 7);
      doc.text('Aktivitas', 85, yPos + 7);
      doc.text('Detail', 115, yPos + 7);
      doc.text('Catatan', 150, yPos + 7);
      
      yPos += 10;
      doc.setTextColor(30, 41, 59);
      
      let no = 1;
      for (const log of exportLogs) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
          // Ulang header tabel di halaman baru
          doc.setFillColor(37, 99, 235);
          doc.rect(20, yPos, 170, 10, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text('No', 25, yPos + 7);
          doc.text('Tanggal', 40, yPos + 7);
          doc.text('Waktu', 65, yPos + 7);
          doc.text('Aktivitas', 85, yPos + 7);
          doc.text('Detail', 115, yPos + 7);
          doc.text('Catatan', 150, yPos + 7);
          yPos += 10;
          doc.setTextColor(30, 41, 59);
        }
        
        const tanggal = new Date(log.created_at).toLocaleDateString('id-ID');
        const waktu = new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        let aktivitas = '';
        let detail = '';
        
        switch(log.activity_type) {
          case 'Feeding': 
            aktivitas = 'Pakan'; 
            detail = `${log.amount} kg ${log.feed_type || ''}`; 
            break;
          case 'Mortality': 
            aktivitas = 'Kematian'; 
            detail = `${log.amount} ekor`; 
            break;
          case 'Sampling': 
            aktivitas = 'Sampling'; 
            detail = `${log.sample_count || 0} ekor, ${log.sample_weight || 0}g, ${log.sample_length || 0}cm`; 
            break;
          case 'Medicine': 
            aktivitas = 'Obat'; 
            detail = `${log.medicine_name} ${log.dose} ${log.dose_unit}`; 
            break;
          case 'WaterParameter': 
            aktivitas = 'Parameter Air'; 
            detail = `pH:${log.ph || '-'} Suhu:${log.temperature || '-'}°C DO:${log.dissolved_oxygen || '-'} NH3:${log.ammonia || '-'}`; 
            break;
          case 'Stocking':
            aktivitas = 'Penambahan Ikan';
            detail = `${log.amount} ekor ${log.notes?.split(' ')[2] || ''}`;
            break;
          default: 
            aktivitas = log.activity_type; 
            detail = '';
        }
        
        doc.text(no.toString(), 25, yPos + 4);
        doc.text(tanggal, 40, yPos + 4);
        doc.text(waktu, 65, yPos + 4);
        doc.text(aktivitas, 85, yPos + 4);
        doc.text(detail.substring(0, 30), 115, yPos + 4);
        doc.text(log.notes?.substring(0, 25) || '-', 150, yPos + 4);
        
        yPos += 7;
        no++;
      }
      
      // Footer
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('TambaKita - Smart Aquaculture Management', 20, 285);
      doc.text(new Date().toLocaleString('id-ID'), 150, 285);
      
      doc.save(`Laporan_Aktivitas_${startDate}_sd_${endDate}.pdf`);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Gagal mengekspor PDF: ' + (error as any).message);
    } finally {
      setExporting(false);
    }
  };

  // Simpan aktivitas
  const handleSaveLog = async () => {
    if (!selectedPondId || !selectedPond) {
      alert("Pilih kolam terlebih dahulu!");
      return;
    }

    setSubmitting(true);

    let criticalReason = "";
    let activityData: any = {
      pond_id: selectedPondId,
      user_id: user.id,
      activity_type: activeType,
      notes: catatanUmum,
      created_at: new Date().toISOString()
    };

    if (activeType === 'Feeding') {
      if (!pakanKg || !pakanJenis) { 
        alert("Lengkapi data pakan!"); 
        setSubmitting(false);
        return; 
      }
      activityData.amount = parseFloat(pakanKg);
      activityData.feed_type = pakanJenis;

    } else if (activeType === 'Mortality') {
      if (!matiJumlah) { 
        alert("Lengkapi jumlah kematian!"); 
        setSubmitting(false);
        return; 
      }
      activityData.amount = parseInt(matiJumlah);
      
      if (parseInt(matiJumlah) > 10) criticalReason = "Kematian Mendadak Tinggi";

      const updatedFishCount = Math.max(0, (selectedPond.fishCount || 0) - parseInt(matiJumlah));
      await supabase
        .from('ponds')
        .update({ fish_count: updatedFishCount })
        .eq('id', selectedPondId);

    } else if (activeType === 'Sampling') {
      activityData.sample_count = sampleJumlah ? parseInt(sampleJumlah) : 0;
      activityData.sample_weight = sampleBerat ? parseFloat(sampleBerat) : null;
      activityData.sample_length = samplePanjang ? parseFloat(samplePanjang) : null;

    } else if (activeType === 'Medicine') {
      if (!obatNama) { 
        alert("Lengkapi nama obat!"); 
        setSubmitting(false);
        return; 
      }
      activityData.medicine_name = obatNama;
      activityData.dose = obatDosis ? parseFloat(obatDosis) : null;
      activityData.dose_unit = obatSatuan;

    } else if (activeType === 'WaterParameter') {
      activityData.ph = airPh ? parseFloat(airPh) : null;
      activityData.temperature = airSuhu ? parseFloat(airSuhu) : null;
      activityData.dissolved_oxygen = airDo ? parseFloat(airDo) : null;
      activityData.ammonia = airAmonia ? parseFloat(airAmonia) : null;

      const ph = parseFloat(airPh);
      const doVal = parseFloat(airDo);
      const amonia = parseFloat(airAmonia);

      if (ph && (ph < 6.5 || ph > 8.5)) criticalReason += `pH (${ph}) `;
      if (doVal && doVal < 5) criticalReason += `DO (${doVal}) `;
      if (amonia && amonia > 0.1) criticalReason += `Amonia (${amonia}) `;

      const pond = selectedPond;
      const updatedMetrics = { ...pond.currentMetrics };
      if (airPh) updatedMetrics.ph = parseFloat(airPh);
      if (airSuhu) updatedMetrics.temp = parseFloat(airSuhu);
      if (airDo) updatedMetrics.do = parseFloat(airDo);
      if (airAmonia) updatedMetrics.ammonia = parseFloat(airAmonia);
      updatedMetrics.lastUpdated = new Date().toISOString();

      await supabase
        .from('ponds')
        .update({ current_metrics: updatedMetrics })
        .eq('id', selectedPondId);
    }

    try {
      const { error } = await supabase
        .from('daily_activities')
        .insert([activityData]);

      if (error) throw error;

      if (criticalReason) {
        await broadcastDanger(selectedPond.name, selectedPondId, criticalReason.trim());
      }

      // Reset form
      setPakanKg(''); setPakanJenis(''); setMatiJumlah('');
      setSampleJumlah(''); setSampleBerat(''); setSamplePanjang(''); 
      setObatNama(''); setObatDosis(''); 
      setAirPh(''); setAirSuhu(''); setAirDo(''); setAirAmonia('');
      setCatatanUmum('');

      await fetchActivities();
      await fetchPonds();

      alert('Catatan berhasil disimpan!');

    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Gagal menyimpan catatan: ' + (error as any).message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPond = ponds.find(p => p.id === selectedPondId);

  useEffect(() => {
    fetchPonds();
  }, []);

  useEffect(() => {
    if (ponds.length > 0) {
      fetchActivities();
    }
  }, [filterDate, filterPondId, ponds.length]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).split('/').join('/');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Modal Pilih Range Tanggal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="bg-blue-600 p-5 text-white text-center">
              <i className="fas fa-calendar-alt text-3xl mb-2"></i>
              <h3 className="font-black text-lg uppercase tracking-widest">Pilih Periode</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase ml-2">Dari Tanggal</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase ml-2">Sampai Tanggal</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  onClick={confirmExport}
                  disabled={exporting}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg"
                >
                  {exporting ? 'Mengekspor...' : 'Export'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pilih Kolam & Export */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] ml-2">Kolam Budidaya Aktif</label>
        <div className="relative">
          <select 
            value={selectedPondId}
            onChange={e => setSelectedPondId(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-black text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition-all"
          >
            {ponds.length === 0 && <option value="">Tidak ada kolam</option>}
            {ponds.map(p => <option key={p.id} value={p.id}>{p.name} ({p.fishType})</option>)}
          </select>
          <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
        </div>
        
        {/* Tombol Export PDF */}
        <button 
          onClick={handleExportPDF}
          disabled={exporting}
          className="w-full py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <i className="fas fa-file-pdf"></i>
          Export ke PDF
        </button>
      </div>

      {/* Form Aktivitas */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-[3rem] text-white shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
        
        {/* Tab Aktivitas */}
        <div className="flex overflow-x-auto gap-2 p-1 bg-white/10 rounded-[1.5rem] no-scrollbar">
          {[
            { type: 'Feeding', icon: 'fa-cookie-bite', label: 'Pakan' },
            { type: 'Mortality', icon: 'fa-skull', label: 'Mati' },
            { type: 'Sampling', icon: 'fa-vial', label: 'Sample' },
            { type: 'Medicine', icon: 'fa-capsules', label: 'Obat' },
            { type: 'WaterParameter', icon: 'fa-droplet', label: 'Parameter' }
          ].map(item => (
            <button
              key={item.type}
              onClick={() => setActiveType(item.type)}
              className={`flex-1 min-w-[70px] py-4 rounded-[1.2rem] flex flex-col items-center gap-2 transition-all duration-300 ${
                activeType === item.type ? 'bg-white text-blue-600 shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className={`fas ${item.icon} text-sm`}></i>
              <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Form Input */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {activeType === 'Feeding' && (
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={pakanKg} onChange={e => setPakanKg(e.target.value)} className="w-full bg-white/15 border-none rounded-2xl p-4 text-sm focus:bg-white/25 outline-none font-bold placeholder-white/50 transition-all" placeholder="Jumlah (Kg)" />
              <select value={pakanJenis} onChange={e => setPakanJenis(e.target.value)} className="w-full bg-white/15 border-none rounded-2xl p-4 text-sm focus:bg-white/25 outline-none font-bold text-white">
                <option value="" className="text-slate-800">Pilih Pakan</option>
                {(selectedPond?.customFeeds || ['LP-1', 'LP-2', 'LP-3']).map(f => (
                  <option key={f} value={f} className="text-slate-800">{f}</option>
                ))}
              </select>
            </div>
          )}

          {activeType === 'Mortality' && (
            <div className="grid grid-cols-1">
              <input type="number" value={matiJumlah} onChange={e => setMatiJumlah(e.target.value)} className="w-full bg-white/15 border-none rounded-2xl p-4 text-sm focus:bg-white/25 outline-none font-bold placeholder-white/50" placeholder="Jumlah Ikan Mati (Ekor)" />
            </div>
          )}

          {activeType === 'Sampling' && (
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={sampleJumlah} onChange={e => setSampleJumlah(e.target.value)} className="bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold placeholder-white/50" placeholder="Qty" />
              <input type="number" value={sampleBerat} onChange={e => setSampleBerat(e.target.value)} className="bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold placeholder-white/50" placeholder="Gram" />
              <input type="number" value={samplePanjang} onChange={e => setSamplePanjang(e.target.value)} className="bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold placeholder-white/50" placeholder="Cm" />
            </div>
          )}

          {activeType === 'Medicine' && (
            <div className="grid grid-cols-3 gap-2">
              <input type="text" value={obatNama} onChange={e => setObatNama(e.target.value)} className="col-span-1 bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold placeholder-white/50" placeholder="Nama" />
              <input type="number" value={obatDosis} onChange={e => setObatDosis(e.target.value)} className="col-span-1 bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold placeholder-white/50" placeholder="Dosis" />
              <select value={obatSatuan} onChange={e => setObatSatuan(e.target.value)} className="col-span-1 bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold text-white">
                <option value="Gram" className="text-slate-800">Gram</option>
                <option value="Ml" className="text-slate-800">Ml</option>
                <option value="PPM" className="text-slate-800">PPM</option>
              </select>
            </div>
          )}

          {activeType === 'WaterParameter' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input type="number" step="0.1" value={airPh} onChange={e => setAirPh(e.target.value)} className="w-full bg-white/15 border-none rounded-2xl p-4 text-sm outline-none font-bold placeholder-white/50" placeholder="pH Air" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-40 font-black">pH</span>
              </div>
              <div className="relative">
                <input type="number" step="0.1" value={airSuhu} onChange={e => setAirSuhu(e.target.value)} className="w-full bg-white/15 border-none rounded-2xl p-4 text-sm outline-none font-bold placeholder-white/50" placeholder="Suhu" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-40 font-black">°C</span>
              </div>
              <div className="relative">
                <input type="number" step="0.1" value={airDo} onChange={e => setAirDo(e.target.value)} className="w-full bg-white/15 border-none rounded-2xl p-4 text-sm outline-none font-bold placeholder-white/50" placeholder="DO" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-40 font-black">mg/L</span>
              </div>
              <div className="relative">
                <input type="number" step="0.01" value={airAmonia} onChange={e => setAirAmonia(e.target.value)} className="w-full bg-white/15 border-none rounded-2xl p-4 text-sm outline-none font-bold placeholder-white/50" placeholder="NH3" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-40 font-black">ppm</span>
              </div>
            </div>
          )}

          {/* Catatan */}
          <textarea 
            value={catatanUmum} 
            onChange={e => setCatatanUmum(e.target.value)} 
            className="w-full bg-white/15 border-none rounded-[1.8rem] p-5 text-sm focus:bg-white/25 outline-none font-bold h-24 placeholder-white/50 transition-all" 
            placeholder="Catatan tambahan..." 
          />

          {/* Tombol Simpan */}
          <button 
            onClick={handleSaveLog}
            disabled={submitting}
            className="w-full py-5 bg-white text-blue-700 rounded-[1.8rem] font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {submitting ? (
              <div className="w-5 h-5 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
            ) : (
              <>
                <i className="fas fa-check-circle"></i> Simpan Catatan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Riwayat Aktivitas */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Riwayat Aktivitas</h3>
          <button 
            onClick={() => setFilterDate(new Date().toISOString().split('T')[0])} 
            className="text-[8px] font-black text-blue-600 uppercase border border-blue-100 px-3 py-1 rounded-full"
          >
            Hari Ini
          </button>
        </div>
        
        {/* Filter */}
        <div className="grid grid-cols-2 gap-2 px-1">
          <input 
            type="date" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)}
            className="p-3 bg-white rounded-xl border border-slate-100 text-[10px] font-black text-slate-700 outline-none"
          />
          <select 
            value={filterPondId}
            onChange={e => setFilterPondId(e.target.value)}
            className="p-3 bg-white rounded-xl border border-slate-100 text-[10px] font-black text-slate-700 outline-none"
          >
            <option value="all">Semua Kolam</option>
            {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* List Aktivitas */}
        {loading ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat catatan...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center">
            <i className="fas fa-clipboard-list text-4xl text-slate-100 mb-4"></i>
            <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">Tidak ada catatan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden logo-gradient text-white opacity-90">
                  <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                    <i className="fas fa-droplet text-white/30 text-xl absolute translate-y-0.5"></i>
                  </div>
                  <i className="fas fa-fish-fins text-white text-base relative z-10 transform -rotate-12"></i>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-800">
                        {log.activity_type === 'WaterParameter' ? 'Parameter Air' : 
                         log.activity_type === 'Feeding' ? 'Pakan' :
                         log.activity_type === 'Mortality' ? 'Kematian' :
                         log.activity_type === 'Sampling' ? 'Sampling' :
                         log.activity_type === 'Medicine' ? 'Obat' : 
                         log.activity_type === 'Stocking' ? 'Penambahan Ikan' : log.activity_type}
                        <span className="ml-2 text-[8px] font-bold text-slate-400">
                          {log.pond_name}
                        </span>
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 mt-0.5">
                        {formatTime(log.created_at)} • {formatDate(log.created_at)}
                      </p>
                    </div>
                    <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {log.user_name}
                    </span>
                  </div>

                  {log.activity_type === 'Feeding' && log.feed_type && (
                    <p className="text-sm font-bold text-slate-700">
                      {log.amount} kg {log.feed_type}
                    </p>
                  )}
                  {log.activity_type === 'Mortality' && (
                    <p className="text-sm font-bold text-slate-700">
                      {log.amount} ekor mati
                    </p>
                  )}
                  {log.activity_type === 'Sampling' && (
                    <p className="text-sm font-bold text-slate-700">
                      {log.sample_count} ekor • {log.sample_weight}g • {log.sample_length}cm
                    </p>
                  )}
                  {log.activity_type === 'Medicine' && (
                    <p className="text-sm font-bold text-slate-700">
                      {log.medicine_name} {log.dose} {log.dose_unit}
                    </p>
                  )}
                  {log.activity_type === 'WaterParameter' && (
                    <p className="text-sm font-bold text-slate-700">
                      pH: {log.ph || '-'} • Suhu: {log.temperature || '-'}°C • DO: {log.dissolved_oxygen || '-'} • NH3: {log.ammonia || '-'}
                    </p>
                  )}
                  {log.activity_type === 'Stocking' && (
                    <p className="text-sm font-bold text-slate-700">
                      {log.amount} ekor ditambahkan
                    </p>
                  )}
                  
                  {log.notes && (
                    <p className="text-[11px] text-slate-600 italic mt-1">
                      "{log.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;