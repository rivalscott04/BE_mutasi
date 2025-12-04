// Utility function to map file_type to display_name
export function getFileDisplayName(fileType: string): string {
  const fileTypeMap: Record<string, string> = {
    // Berkas Kabupaten/Kota
    'surat_pengantar': 'Surat Pengantar',
    'surat_permohonan_dari_yang_bersangkutan': 'Surat Permohonan Dari Yang Bersangkutan',
    'surat_keputusan_cpns': 'Surat Keputusan CPNS',
    'surat_keputusan_pns': 'Surat Keputusan PNS',
    'surat_keputusan_kenaikan_pangkat_terakhir': 'Surat Keputusan Kenaikan Pangkat Terakhir',
    'surat_keputusan_jabatan_terakhir': 'Surat Keputusan Jabatan Terakhir',
    'skp_2_tahun_terakhir': 'SKP 2 Tahun Terakhir',
    'surat_keterangan_bebas_temuan_inspektorat': 'Surat Keterangan Bebas Temuan Yang Diterbitkan Inspektorat Jenderal Kementerian Agama',
    'surat_keterangan_anjab_abk_instansi_asal': 'Surat Keterangan Anjab dan ABK terhadap jabatan PNS dari instansi asal',
    'surat_keterangan_anjab_abk_instansi_penerima': 'Surat Keterangan Anjab dan ABK terhadap jabatan PNS dari instansi penerima',
    'surat_pernyataan_tidak_hukuman_disiplin': 'Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Tingkat Sedang atau Berat Dalam 1 (satu) Tahun Terakhir Dari PPK',
    'surat_persetujuan_mutasi_asal': 'Surat Persetujuan Mutasi dari ASAL dengan menyebutkan jabatan yang akan diduduki',
    'surat_lolos_butuh_ppk': 'Surat Lolos Butuh dari Pejabat Pembina Kepegawaian instansi yang dituju',
    'peta_jabatan': 'Peta Jabatan',
    'hasil_uji_kompetensi': 'Hasil Uji Kompetensi',
    'hasil_evaluasi_pertimbangan_baperjakat': 'Hasil Evaluasi dan Pertimbangan (BAPERJAKAT)',
    'anjab_abk_instansi_asal': 'Anjab/Abk Instansi Asal',
    'anjab_abk_instansi_penerima': 'Anjab/Abk Instansi Penerima',
    'surat_keterangan_tidak_tugas_belajar': 'Surat Keterangan Tidak Sedang Tugas Belajar',
    'sptjm_pimpinan_satker_asal': 'SPTJM Pimpinan Satker dari Asal',
    'sptjm_pimpinan_satker_penerima': 'SPTJM Pimpinan Satker dari Penerima',
    'surat_rekomendasi_instansi_pembina': 'Surat Rekomendasi Instansi Pembina'
  };
  
  return fileTypeMap[fileType] || fileType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

