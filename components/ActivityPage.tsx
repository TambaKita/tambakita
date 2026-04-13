import React, { useState, useEffect } from 'react';
import { User, Pond } from '../types';
import { supabase } from '../src/lib/supabase';
import { exportToPDF } from '../utils/exportPDF';
import Toast from './Toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

const ActivityPage: React.FC<{ user: User }> = ({ user }) => {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportPondId, setExportPondId] = useState('all');
  const [exportFormat, setExportFormat] = useState('pdf');

  const [activeType, setActiveType] = useState<string>('Feeding');
  const [selectedPondId, setSelectedPondId] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterPondId, setFilterPondId] = useState('all');

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

  const isPondOwner = (pondId: string) => {
    const pond = ponds.find(p => p.id === pondId);
    return pond?.ownerId === user.id;
  };

  const fetchPonds = async () => {
    try {
      const { data, error } = await supabase.from('ponds').select('*');
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

  const fetchActivities = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      const startDateTime = new Date(filterDate);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(filterDate);
      endDateTime.setHours(23, 59, 59, 999);

      const myPondIds = ponds.map(p => p.id);
      
      let query = supabase
        .from('daily_activities')
        .select('*')
        .gte('created_at', startDateTime.toISOString())
        .lte('created_at', endDateTime.toISOString())
        .in('pond_id', myPondIds)
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

  const fetchActivitiesForExport = async () => {
    try {
      const startDateTime = new Date(exportStartDate);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(exportEndDate);
      endDateTime.setHours(23, 59, 59, 999);

      const myPondIds = ponds.map(p => p.id);
      
      let query = supabase
        .from('daily_activities')
        .select('*')
        .gte('created_at', startDateTime.toISOString())
        .lte('created_at', endDateTime.toISOString())
        .in('pond_id', myPondIds)
        .order('created_at', { ascending: true });

      if (exportPondId !== 'all') {
        query = query.eq('pond_id', exportPondId);
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

  // UPDATE AKTIVITAS
  const handleUpdateLog = async () => {
    if (!editingLog) return;
    
    setSubmitting(true);
    
    try {
      const updateData: any = {};
      
      if (editingLog.activity_type === 'Feeding') {
        updateData.amount = editForm.amount;
        updateData.feed_type = editForm.feed_type;
      } else if (editingLog.activity_type === 'Mortality') {
        updateData.amount = editForm.amount;
      } else if (editingLog.activity_type === 'Sampling') {
        updateData.sample_count = editForm.sample_count;
        updateData.sample_weight = editForm.sample_weight;
        updateData.sample_length = editForm.sample_length;
      } else if (editingLog.activity_type === 'Medicine') {
        updateData.medicine_name = editForm.medicine_name;
        updateData.dose = editForm.dose;
        updateData.dose_unit = editForm.dose_unit;
      } else if (editingLog.activity_type === 'WaterParameter') {
        updateData.ph = editForm.ph;
        updateData.temperature = editForm.temperature;
        updateData.dissolved_oxygen = editForm.dissolved_oxygen;
        updateData.ammonia = editForm.ammonia;
      }
      
      updateData.notes = editForm.notes;
      
      if (isPondOwner(editingLog.pond_id) && editForm.created_at) {
        const newDate = new Date(editForm.created_at + 'T12:00:00');
        updateData.created_at = newDate.toISOString();
      }
      
      const { error } = await supabase
        .from('daily_activities')
        .update(updateData)
        .eq('id', editingLog.id);
        
      if (error) throw error;
      
      setToast({ message: 'Aktivitas berhasil diupdate!', type: 'success' });
      setShowEditModal(false);
      setEditingLog(null);
      fetchActivities();
      
    } catch (error) {
      console.error('Error updating activity:', error);
      setToast({ message: 'Gagal update aktivitas', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // HAPUS AKTIVITAS
  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Hapus catatan aktivitas ini?')) return;
    
    try {
      const { error } = await supabase
        .from('daily_activities')
        .delete()
        .eq('id', logId);
        
      if (error) throw error;
      
      setToast({ message: 'Aktivitas berhasil dihapus!', type: 'success' });
      fetchActivities();
      
    } catch (error) {
      console.error('Error deleting activity:', error);
      setToast({ message: 'Gagal hapus aktivitas', type: 'error' });
    }
  };

  // EXPORT EXCEL dengan ExcelJS
  const handleExportExcel = async () => {
    setExportingExcel(true);
    
    try {
      const exportLogs = await fetchActivitiesForExport();
      
      if (exportLogs.length === 0) {
        setToast({ message: 'Tidak ada data untuk periode yang dipilih!', type: 'error' });
        setExportingExcel(false);
        return;
      }
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan Aktivitas');
      
      worksheet.columns = [
        { header: 'Tanggal', key: 'tanggal', width: 12 },
        { header: 'Jam', key: 'jam', width: 10 },
        { header: 'Kolam', key: 'kolam', width: 18 },
        { header: 'User', key: 'user', width: 18 },
        { header: 'Aktivitas', key: 'aktivitas', width: 22 },
        { header: 'Pakan (Kg)', key: 'pakan', width: 12 },
        { header: 'Jenis Pakan', key: 'jenis_pakan', width: 14 },
        { header: 'Jumlah Mati', key: 'mati', width: 12 },
        { header: 'Jumlah Sample', key: 'sample_count', width: 12 },
        { header: 'Berat Sample (g)', key: 'sample_weight', width: 14 },
        { header: 'Panjang Sample (cm)', key: 'sample_length', width: 14 },
        { header: 'Nama Obat', key: 'obat', width: 14 },
        { header: 'Dosis', key: 'dosis', width: 10 },
        { header: 'Satuan Dosis', key: 'satuan', width: 12 },
        { header: 'pH', key: 'ph', width: 8 },
        { header: 'Suhu (°C)', key: 'suhu', width: 10 },
        { header: 'DO (mg/L)', key: 'do', width: 10 },
        { header: 'Amonia (ppm)', key: 'amonia', width: 12 },
        { header: 'Catatan', key: 'catatan', width: 30 }
      ];
      
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
      
      exportLogs.forEach(log => {
        worksheet.addRow({
          tanggal: new Date(log.created_at).toLocaleDateString('id-ID'),
          jam: new Date(log.created_at).toLocaleTimeString('id-ID'),
          kolam: log.pond_name,
          user: log.user_name,
          aktivitas: log.activity_type === 'WaterParameter' ? 'Parameter Air' :
                     log.activity_type === 'Feeding' ? 'Pemberian Pakan' :
                     log.activity_type === 'Mortality' ? 'Kematian Ikan' :
                     log.activity_type === 'Sampling' ? 'Sampling Ikan' :
                     log.activity_type === 'Medicine' ? 'Pemberian Obat' : log.activity_type,
          pakan: log.activity_type === 'Feeding' ? log.amount : '-',
          jenis_pakan: log.feed_type || '-',
          mati: log.activity_type === 'Mortality' ? log.amount : '-',
          sample_count: log.sample_count || '-',
          sample_weight: log.sample_weight || '-',
          sample_length: log.sample_length || '-',
          obat: log.medicine_name || '-',
          dosis: log.dose || '-',
          satuan: log.dose_unit || '-',
          ph: log.ph || '-',
          suhu: log.temperature || '-',
          do: log.dissolved_oxygen || '-',
          amonia: log.ammonia || '-',
          catatan: log.notes || '-'
        });
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Laporan_Aktivitas_${exportStartDate}_sd_${exportEndDate}.xlsx`);
      
      setToast({ message: 'Export Excel berhasil!', type: 'success' });
      
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setToast({ message: 'Gagal mengekspor Excel', type: 'error' });
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = () => setShowExportModal(true);

  const confirmExport = async () => {
    if (exportFormat === 'pdf') {
      setExporting(true);
      setShowExportModal(false);
      
      try {
        const exportLogs = await fetchActivitiesForExport();
        
        if (exportLogs.length === 0) {
          setToast({ message: 'Tidak ada data untuk periode yang dipilih!', type: 'error' });
          setExporting(false);
          return;
        }
        
        const selectedPondFilter = ponds.find(p => p.id === exportPondId);
        const pondName = exportPondId !== 'all' && selectedPondFilter 
          ? selectedPondFilter.name 
          : 'Semua Kolam';
        const fishType = exportPondId !== 'all' && selectedPondFilter 
          ? selectedPondFilter.fishType 
          : undefined;
        
        await exportToPDF(exportLogs, exportStartDate, exportEndDate, pondName, fishType);
        setToast({ message: 'Export PDF berhasil!', type: 'success' });
        
      } catch (error) {
        console.error('Error exporting PDF:', error);
        setToast({ message: 'Gagal mengekspor PDF: ' + (error as any).message, type: 'error' });
      } finally {
        setExporting(false);
      }
    } else {
      await handleExportExcel();
      setShowExportModal(false);
    }
  };

  const handleSaveLog = async () => {
    if (!selectedPondId || !selectedPond) {
      setToast({ message: 'Pilih kolam terlebih dahulu!', type: 'warning' });
      return;
    }

    setSubmitting(true);

    let criticalReason = "";
    
    let selectedDateTime;
    if (isPondOwner(selectedPond.id)) {
      selectedDateTime = new Date(activityDate + 'T12:00:00');
    } else {
      selectedDateTime = new Date();
    }
    
    let activityData: any = {
      pond_id: selectedPondId,
      user_id: user.id,
      activity_type: activeType,
      notes: catatanUmum,
      created_at: selectedDateTime.toISOString()
    };

    if (activeType === 'Feeding') {
      if (!pakanKg || !pakanJenis) { 
        setToast({ message: 'Lengkapi data pakan!', type: 'warning' });
        setSubmitting(false);
        return; 
      }
      activityData.amount = parseFloat(pakanKg);
      activityData.feed_type = pakanJenis;

    } else if (activeType === 'Mortality') {
      if (!matiJumlah) { 
        setToast({ message: 'Lengkapi jumlah kematian!', type: 'warning' });
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
        setToast({ message: 'Lengkapi nama obat!', type: 'warning' });
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

      setPakanKg(''); setPakanJenis(''); setMatiJumlah('');
      setSampleJumlah(''); setSampleBerat(''); setSamplePanjang(''); 
      setObatNama(''); setObatDosis(''); 
      setAirPh(''); setAirSuhu(''); setAirDo(''); setAirAmonia('');
      setCatatanUmum('');
      setActivityDate(new Date().toISOString().split('T')[0]);

      await fetchActivities();
      await fetchPonds();

      setToast({ message: 'Catatan berhasil disimpan!', type: 'success' });

    } catch (error) {
      console.error('Error saving activity:', error);
      setToast({ message: 'Gagal menyimpan catatan: ' + (error as any).message, type: 'error' });
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

  const inputClass = "w-full bg-white/15 border-none rounded-2xl p-4 text-sm focus:bg-white/25 outline-none font-bold placeholder-white/50 transition-all focus:ring-0 focus:ring-transparent";
  const selectClass = "w-full bg-white/15 border-none rounded-2xl p-4 text-sm focus:bg-white/25 outline-none font-bold text-white focus:ring-0 focus:ring-transparent";

  const openEditModal = (log: ActivityLog) => {
    setEditingLog(log);
    const dateOnly = log.created_at.split('T')[0];
    
    if (log.activity_type === 'Feeding') {
      setEditForm({
        amount: log.amount || '',
        feed_type: log.feed_type || '',
        notes: log.notes || '',
        created_at: dateOnly
      });
    } else if (log.activity_type === 'Mortality') {
      setEditForm({
        amount: log.amount || '',
        notes: log.notes || '',
        created_at: dateOnly
      });
    } else if (log.activity_type === 'Sampling') {
      setEditForm({
        sample_count: log.sample_count || '',
        sample_weight: log.sample_weight || '',
        sample_length: log.sample_length || '',
        notes: log.notes || '',
        created_at: dateOnly
      });
    } else if (log.activity_type === 'Medicine') {
      setEditForm({
        medicine_name: log.medicine_name || '',
        dose: log.dose || '',
        dose_unit: log.dose_unit || 'Gram',
        notes: log.notes || '',
        created_at: dateOnly
      });
    } else if (log.activity_type === 'WaterParameter') {
      setEditForm({
        ph: log.ph || '',
        temperature: log.temperature || '',
        dissolved_oxygen: log.dissolved_oxygen || '',
        ammonia: log.ammonia || '',
        notes: log.notes || '',
        created_at: dateOnly
      });
    }
    setShowEditModal(true);
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Modal Export */}
      {showExportModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white text-center">
              <i className="fas fa-download text-3xl mb-2"></i>
              <h3 className="font-black text-lg uppercase tracking-widest">Export Laporan</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase ml-2">Pilih Kolam</label>
                <select 
                  value={exportPondId}
                  onChange={e => setExportPondId(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                >
                  <option value="all">🌊 Semua Kolam</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>🏠 {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase ml-2">Dari Tanggal</label>
                <input 
                  type="date" 
                  value={exportStartDate} 
                  onChange={e => setExportStartDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase ml-2">Sampai Tanggal</label>
                <input 
                  type="date" 
                  value={exportEndDate} 
                  onChange={e => setExportEndDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase ml-2">Format Export</label>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('pdf')}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                      exportFormat === 'pdf' 
                        ? 'bg-red-600 text-white shadow-lg' 
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <i className="fas fa-file-pdf"></i> PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('excel')}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                      exportFormat === 'excel' 
                        ? 'bg-green-600 text-white shadow-lg' 
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <i className="fas fa-file-excel"></i> Excel
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  onClick={confirmExport}
                  disabled={exporting || exportingExcel}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2"
                >
                  {(exporting || exportingExcel) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Mengekspor...
                    </>
                  ) : (
                    <>
                      <i className={`fas fa-${exportFormat === 'pdf' ? 'file-pdf' : 'file-excel'}`}></i>
                      Export {exportFormat.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Aktivitas */}
      {showEditModal && editingLog && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white sticky top-0">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sm uppercase tracking-wider">Edit Aktivitas</h3>
                <button onClick={() => setShowEditModal(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <p className="text-[10px] opacity-80 mt-1">
                {editingLog.activity_type === 'Feeding' ? '🍚 Pemberian Pakan' :
                 editingLog.activity_type === 'Mortality' ? '⚠️ Kematian Ikan' :
                 editingLog.activity_type === 'Sampling' ? '🔬 Sampling Ikan' :
                 editingLog.activity_type === 'Medicine' ? '💊 Pemberian Obat' :
                 editingLog.activity_type === 'WaterParameter' ? '🌊 Parameter Air' : editingLog.activity_type}
              </p>
            </div>
            
            <div className="p-5 space-y-4">
              {isPondOwner(editingLog.pond_id) && (
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase">Tanggal Aktivitas</label>
                  <input 
                    type="date" 
                    value={editForm.created_at || ''}
                    onChange={e => setEditForm({...editForm, created_at: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none"
                  />
                  <p className="text-[8px] text-slate-400 mt-1">Owner bisa mengubah tanggal aktivitas</p>
                </div>
              )}
              
              {editingLog.activity_type === 'Feeding' && (
                <>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase">Jumlah Pakan (Kg)</label>
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase">Jenis Pakan</label>
                    <input type="text" value={editForm.feed_type} onChange={e => setEditForm({...editForm, feed_type: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none" />
                  </div>
                </>
              )}

              {editingLog.activity_type === 'Mortality' && (
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase">Jumlah Mati (Ekor)</label>
                  <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none" />
                </div>
              )}

              {editingLog.activity_type === 'Sampling' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase">Jumlah</label>
                    <input type="number" value={editForm.sample_count} onChange={e => setEditForm({...editForm, sample_count: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase">Berat (g)</label>
                    <input type="number" value={editForm.sample_weight} onChange={e => setEditForm({...editForm, sample_weight: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase">Panjang (cm)</label>
                    <input type="number" value={editForm.sample_length} onChange={e => setEditForm({...editForm, sample_length: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" />
                  </div>
                </div>
              )}

              {editingLog.activity_type === 'Medicine' && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[8px] font-black text-slate-500 uppercase">Nama Obat</label>
                    <input type="text" value={editForm.medicine_name} onChange={e => setEditForm({...editForm, medicine_name: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase">Dosis</label>
                    <input type="number" value={editForm.dose} onChange={e => setEditForm({...editForm, dose: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase">Satuan</label>
                    <select value={editForm.dose_unit} onChange={e => setEditForm({...editForm, dose_unit: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none">
                      <option value="Gram">Gram</option>
                      <option value="Ml">Ml</option>
                      <option value="PPM">PPM</option>
                    </select>
                  </div>
                </div>
              )}

              {editingLog.activity_type === 'WaterParameter' && (
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[8px] font-black text-slate-500 uppercase">pH</label><input type="number" step="0.1" value={editForm.ph} onChange={e => setEditForm({...editForm, ph: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" /></div>
                  <div><label className="text-[8px] font-black text-slate-500 uppercase">Suhu (°C)</label><input type="number" step="0.1" value={editForm.temperature} onChange={e => setEditForm({...editForm, temperature: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" /></div>
                  <div><label className="text-[8px] font-black text-slate-500 uppercase">DO (mg/L)</label><input type="number" step="0.1" value={editForm.dissolved_oxygen} onChange={e => setEditForm({...editForm, dissolved_oxygen: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" /></div>
                  <div><label className="text-[8px] font-black text-slate-500 uppercase">NH3 (ppm)</label><input type="number" step="0.01" value={editForm.ammonia} onChange={e => setEditForm({...editForm, ammonia: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" /></div>
                </div>
              )}

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase">Catatan</label>
                <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={2} className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none" />
              </div>

              <div className="flex gap-3 pt-3">
                <button onClick={handleUpdateLog} disabled={submitting} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase shadow-lg">
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pilih Kolam */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] ml-2">Kolam Budidaya Aktif</label>
        <div className="relative">
          <select 
            value={selectedPondId}
            onChange={e => setSelectedPondId(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-black text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition-all"
          >
            {ponds.length === 0 && <option value="">Tidak ada kolam</option>}
            {ponds.map(p => <option key={p.id} value={p.id}>🏠 {p.name} ({p.fishType})</option>)}
          </select>
          <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
        </div>
      </div>

      {/* Tanggal Aktivitas Baru */}
      {selectedPond && isPondOwner(selectedPond.id) && (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] ml-2">📅 Tanggal Aktivitas</label>
          <div className="relative">
            <input 
              type="date" 
              value={activityDate}
              onChange={e => setActivityDate(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-black text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
            />
            <i className="fas fa-calendar-alt absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
          </div>
          <p className="text-[8px] text-slate-400 ml-2">
            <i className="fas fa-info-circle mr-1"></i>
            Bisa pilih tanggal sebelumnya untuk mencatat aktivitas yang terlewat (backdate)
          </p>
        </div>
      )}

      {selectedPond && !isPondOwner(selectedPond.id) && (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] ml-2">📅 Tanggal Aktivitas</label>
          <div className="relative">
            <input 
              type="date" 
              value={new Date().toISOString().split('T')[0]}
              disabled
              className="w-full p-4 bg-slate-100 rounded-2xl border-none text-sm font-black text-slate-500 outline-none cursor-not-allowed"
            />
            <i className="fas fa-calendar-alt absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
          </div>
          <p className="text-[8px] text-amber-600 ml-2">
            <i className="fas fa-lock mr-1"></i>
            Staff hanya bisa mencatat aktivitas untuk hari ini
          </p>
        </div>
      )}

      {/* Form Aktivitas */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-[3rem] text-white shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
        
        <div className="flex overflow-x-auto gap-2 p-1 bg-white/10 rounded-[1.5rem] no-scrollbar">
          {[
            { type: 'Feeding', icon: 'fa-cookie-bite', label: '🍚 Pakan' },
            { type: 'Mortality', icon: 'fa-skull', label: '⚠️ Mati' },
            { type: 'Sampling', icon: 'fa-vial', label: '🔬 Sample' },
            { type: 'Medicine', icon: 'fa-capsules', label: '💊 Obat' },
            { type: 'WaterParameter', icon: 'fa-droplet', label: '🌊 Parameter' }
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

        <div className="space-y-4">
          {activeType === 'Feeding' && (
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={pakanKg} onChange={e => setPakanKg(e.target.value)} className={inputClass} placeholder="🍚 Jumlah (Kg)" />
              <select value={pakanJenis} onChange={e => setPakanJenis(e.target.value)} className={selectClass}>
                <option value="" className="text-slate-800">📋 Pilih Pakan</option>
                {(selectedPond?.customFeeds || ['LP-1', 'LP-2', 'LP-3']).map(f => (
                  <option key={f} value={f} className="text-slate-800">{f}</option>
                ))}
              </select>
            </div>
          )}

          {activeType === 'Mortality' && (
            <div className="grid grid-cols-1">
              <input type="number" value={matiJumlah} onChange={e => setMatiJumlah(e.target.value)} className={inputClass} placeholder="⚠️ Jumlah Ikan Mati (Ekor)" />
            </div>
          )}

          {activeType === 'Sampling' && (
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={sampleJumlah} onChange={e => setSampleJumlah(e.target.value)} className="bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold placeholder-white/50" placeholder="🔬 Jumlah" />
              <input type="number" value={sampleBerat} onChange={e => setSampleBerat(e.target.value)} className="bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold placeholder-white/50" placeholder="⚖️ Gram" />
              <input type="number" value={samplePanjang} onChange={e => setSamplePanjang(e.target.value)} className="bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold placeholder-white/50" placeholder="📏 Cm" />
            </div>
          )}

          {activeType === 'Medicine' && (
            <div className="grid grid-cols-3 gap-2">
              <input type="text" value={obatNama} onChange={e => setObatNama(e.target.value)} className="bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold placeholder-white/50" placeholder="💊 Nama Obat" />
              <input type="number" value={obatDosis} onChange={e => setObatDosis(e.target.value)} className="bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold placeholder-white/50" placeholder="💉 Dosis" />
              <select value={obatSatuan} onChange={e => setObatSatuan(e.target.value)} className="bg-white/15 border-none rounded-2xl p-4 text-xs outline-none font-bold text-white">
                <option value="Gram" className="text-slate-800">Gram</option>
                <option value="Ml" className="text-slate-800">Ml</option>
                <option value="PPM" className="text-slate-800">PPM</option>
              </select>
            </div>
          )}

          {activeType === 'WaterParameter' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input type="number" step="0.1" value={airPh} onChange={e => setAirPh(e.target.value)} className="w-full bg-white/15 border-none rounded-2xl p-4 text-sm outline-none font-bold placeholder-white/50" placeholder="🧪 pH" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-40 font-black">pH</span>
              </div>
              <div className="relative">
                <input type="number" step="0.1" value={airSuhu} onChange={e => setAirSuhu(e.target.value)} className="w-full bg-white/15 border-none rounded-2xl p-4 text-sm outline-none font-bold placeholder-white/50" placeholder="🌡️ Suhu" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-40 font-black">°C</span>
              </div>
              <div className="relative">
                <input type="number" step="0.1" value={airDo} onChange={e => setAirDo(e.target.value)} className="w-full bg-white/15 border-none rounded-2xl p-4 text-sm outline-none font-bold placeholder-white/50" placeholder="💧 DO" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-40 font-black">mg/L</span>
              </div>
              <div className="relative">
                <input type="number" step="0.01" value={airAmonia} onChange={e => setAirAmonia(e.target.value)} className="w-full bg-white/15 border-none rounded-2xl p-4 text-sm outline-none font-bold placeholder-white/50" placeholder="☠️ NH3" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-40 font-black">ppm</span>
              </div>
            </div>
          )}

          <textarea 
            value={catatanUmum} 
            onChange={e => setCatatanUmum(e.target.value)} 
            className="w-full bg-white/15 border-none rounded-[1.8rem] p-5 text-sm focus:bg-white/25 outline-none font-bold h-24 placeholder-white/50 transition-all" 
            placeholder="📝 Catatan tambahan..." 
          />

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

      {/* ==================== RIWAYAT AKTIVITAS ==================== */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            📋 Riwayat Aktivitas
          </h3>
          <button 
            onClick={() => setFilterDate(new Date().toISOString().split('T')[0])} 
            className="text-[8px] font-black text-blue-600 uppercase border border-blue-100 px-3 py-1 rounded-full"
          >
            📅 Hari Ini
          </button>
        </div>
        
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
            <option value="all">🌊 Semua Kolam</option>
            {ponds.map(p => <option key={p.id} value={p.id}>🏠 {p.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat catatan...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center">
            <i className="fas fa-clipboard-list text-4xl text-slate-100 mb-4"></i>
            <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">Tidak ada catatan untuk tanggal ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => {
              const isOwner = isPondOwner(log.pond_id);
              return (
                <div key={log.id} className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm flex gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white opacity-90">
                    <i className="fas fa-fish-fins text-white text-base relative z-10 transform -rotate-12"></i>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-800">
                          {log.activity_type === 'WaterParameter' ? '🌊 Parameter Air' : 
                           log.activity_type === 'Feeding' ? '🍚 Pemberian Pakan' :
                           log.activity_type === 'Mortality' ? '⚠️ Kematian Ikan' :
                           log.activity_type === 'Sampling' ? '🔬 Sampling Ikan' :
                           log.activity_type === 'Medicine' ? '💊 Pemberian Obat' : log.activity_type}
                          <span className="ml-2 text-[8px] font-bold text-slate-400">🏠 {log.pond_name}</span>
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">
                          ⏰ {formatTime(log.created_at)} • 📅 {formatDate(log.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          👤 {log.user_name}
                        </span>
                        {isOwner && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditModal(log)}
                              className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-[10px] hover:bg-amber-100 transition-colors"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="w-7 h-7 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center text-[10px] hover:bg-rose-100 transition-colors"
                              title="Hapus"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {log.activity_type === 'Feeding' && log.feed_type && (
                      <p className="text-sm font-bold text-slate-700">🍚 {log.amount} kg {log.feed_type}</p>
                    )}
                    {log.activity_type === 'Mortality' && (
                      <p className="text-sm font-bold text-slate-700">⚠️ {log.amount} ekor mati</p>
                    )}
                    {log.activity_type === 'Sampling' && (
                      <p className="text-sm font-bold text-slate-700">🔬 {log.sample_count} ekor • ⚖️ {log.sample_weight}g • 📏 {log.sample_length}cm</p>
                    )}
                    {log.activity_type === 'Medicine' && (
                      <p className="text-sm font-bold text-slate-700">💊 {log.medicine_name} 💉 {log.dose} {log.dose_unit}</p>
                    )}
                    {log.activity_type === 'WaterParameter' && (
                      <p className="text-sm font-bold text-slate-700">🧪 pH: {log.ph || '-'} • 🌡️ {log.temperature || '-'}°C • 💧 DO: {log.dissolved_oxygen || '-'} • ☠️ NH3: {log.ammonia || '-'}</p>
                    )}
                    
                    {log.notes && (
                      <p className="text-[11px] text-slate-600 italic mt-1">📝 "{log.notes}"</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tombol Export */}
      <button 
        onClick={handleExportPDF}
        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg"
      >
        <i className="fas fa-download text-lg"></i>
        Export Laporan (PDF/Excel)
      </button>
    </div>
  );
};

export default ActivityPage;