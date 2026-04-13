import jsPDF from 'jspdf';

interface ActivityLog {
  id: string;
  pond_id: string;
  pond_name: string;
  activity_type: string;
  amount: number | null;
  notes: string;
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

export const exportToPDF = async (
  logs: ActivityLog[],
  startDate: string,
  endDate: string,
  pondName: string,
  fishType?: string
) => {
  if (logs.length === 0) {
    alert('Tidak ada data untuk diekspor!');
    return false;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  
  // ========== HEADER (rata kiri) ==========
  // Teks "Tamba" hitam + "Kita" biru
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  
  // Teks "Tamba" (hitam)
  doc.setTextColor(0, 0, 0);
  doc.text('Tamba', 20, 20);
  
  // Teks "Kita" (biru)
  doc.setTextColor(37, 99, 235);
  doc.text('Kita', 20 + doc.getTextWidth('Tamba'), 20);
  
  // Subtitle FUTURE AQUACULTURE (rata kiri)
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('FUTURE AQUACULTURE', 20, 30);
  
  // Garis pemisah
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, 38, 190, 38);
  
  // ========== TITLE ==========
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN AKTIVITAS', 20, 52);
  
  // Info periode
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  
  let yPos = 64;
  doc.text(`Kolam: ${pondName}${fishType ? ` (${fishType})` : ''}`, 20, yPos);
  yPos += 6;
  doc.text(`Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`, 20, yPos);
  yPos += 6;
  doc.text(`Diekspor: ${new Date().toLocaleString('id-ID')}`, 20, yPos);
  
  // ========== TABLE ==========
  yPos = 82;
  doc.setFillColor(37, 99, 235);
  doc.rect(20, yPos, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text('No', 22, yPos + 6);
  doc.text('Tanggal', 35, yPos + 6);
  doc.text('Waktu', 55, yPos + 6);
  doc.text('Kolam', 70, yPos + 6);
  doc.text('Aktivitas', 90, yPos + 6);
  doc.text('Detail', 115, yPos + 6);
  doc.text('Catatan', 145, yPos + 6);
  
  yPos += 8;
  doc.setTextColor(30, 41, 59);
  
  let no = 1;
  let rowColor = false;
  
  for (const log of logs) {
    if (yPos > 275) {
      doc.addPage();
      yPos = 20;
      doc.setFillColor(37, 99, 235);
      doc.rect(20, yPos, 170, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('No', 22, yPos + 6);
      doc.text('Tanggal', 35, yPos + 6);
      doc.text('Waktu', 55, yPos + 6);
      doc.text('Kolam', 70, yPos + 6);
      doc.text('Aktivitas', 90, yPos + 6);
      doc.text('Detail', 115, yPos + 6);
      doc.text('Catatan', 145, yPos + 6);
      yPos += 8;
      doc.setTextColor(30, 41, 59);
    }
    
    if (rowColor) {
      doc.setFillColor(241, 245, 249);
      doc.rect(20, yPos - 1, 170, 6, 'F');
    }
    rowColor = !rowColor;
    
    const tanggal = new Date(log.created_at).toLocaleDateString('id-ID');
    const waktu = new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    const kolam = log.pond_name.length > 12 ? log.pond_name.substring(0, 10) + '..' : log.pond_name;
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
        detail = `${log.sample_count || 0} ekor, ${log.sample_weight || 0} g, ${log.sample_length || 0} cm`; 
        break;
      case 'Medicine': 
        aktivitas = 'Obat'; 
        detail = `${log.medicine_name} ${log.dose} ${log.dose_unit}`; 
        break;
      case 'WaterParameter': 
        aktivitas = 'Parameter Air'; 
        detail = `pH:${log.ph || '-'} Suhu:${log.temperature || '-'}°C DO:${log.dissolved_oxygen || '-'} NH3:${log.ammonia || '-'}`; 
        break;
      default: 
        aktivitas = log.activity_type; 
        detail = '';
    }
    
    doc.text(no.toString(), 22, yPos + 4);
    doc.text(tanggal, 35, yPos + 4);
    doc.text(waktu, 55, yPos + 4);
    doc.text(kolam, 70, yPos + 4);
    doc.text(aktivitas, 90, yPos + 4);
    doc.text(detail.substring(0, 20), 115, yPos + 4);
    doc.text(log.notes?.substring(0, 20) || '-', 145, yPos + 4);
    
    yPos += 6;
    no++;
  }
  
  // ========== FOOTER ==========
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, 285, 190, 285);
  
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('Tambakita - Future Aquaculture', 20, 292);
  doc.text(new Date().toLocaleString('id-ID'), 20, 298);
  
  doc.save(`Laporan_Aktivitas_${startDate}_sd_${endDate}.pdf`);
  return true;
};