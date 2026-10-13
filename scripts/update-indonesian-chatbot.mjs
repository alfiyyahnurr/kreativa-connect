import { Client } from '@neondatabase/serverless';
import fs from 'fs';

// Load DATABASE_URL from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);

if (!dbUrlMatch) {
  console.error('ERROR: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const client = new Client(dbUrlMatch[1]);

async function updateIndonesianChatbot() {
  await client.connect();
  console.log('Connected to Neon DB. Updating chatbot nodes and options to Bahasa Indonesia...');

  // 1. Update chatbot_flow_nodes
  const nodeUpdates = [
    {
      id: 1,
      text: "Assalamu'alaikum Warahmatullahi Wabarakatuh.\nSelamat datang di Layanan Informasi Kreativa Global School! 👋\n\nApakah Bapak/Ibu adalah orang tua dari siswa aktif Kreativa?",
    },
    {
      id: 2,
      text: 'Terima kasih atas ketertarikan Bapak/Ibu pada Kreativa Global School 😊\nApakah Bapak/Ibu sudah mendaftar melalui portal pendaftaran (Admission) kami?',
    },
    {
      id: 3,
      text: 'Selamat datang kembali, Ayah/Bunda! Ada yang dapat kami bantu hari ini?',
    },
    {
      id: 4,
      text: 'Jenjang pendidikan mana yang Bapak/Ibu minati?',
    },
    {
      id: 5,
      text: 'Alhamdulillah! Silakan pilih informasi yang Bapak/Ibu butuhkan terkait proses pendaftaran:',
    },
    {
      id: 6,
      text: 'Silakan pilih topik informasi yang Bapak/Ibu butuhkan:',
    },
    {
      id: 7,
      text: 'Berikut informasi mengenai kurikulum dan program belajar di Kreativa Global School:\n\nKreativa Global School memadukan kurikulum internasional dengan pembinaan karakter dan nilai-nilai Islam.',
    },
    {
      id: 8,
      text: '💰 Informasi Biaya Pendidikan & SPP\n\nSilakan pilih sekolah atau kampus yang ingin Anda ketahui rincian biayanya:',
    },
    {
      id: 9,
      text: 'Ketersediaan kursi dapat berubah sewaktu-waktu. Tim Admission kami siap membantu mengecek kuota terbaru untuk jenjang yang Anda minati.',
    },
    {
      id: 10,
      text: 'Kami sangat senang menyambut Ayah/Bunda untuk mengenal Kreativa lebih dekat melalui School Visit atau Trial Class.',
    },
    {
      id: 11,
      text: 'Pendaftaran dilakukan secara daring melalui portal resmi admission.kreativaglobal.sch.id. Tim kami siap mendampingi setiap tahapannya.',
    },
    {
      id: 12,
      text: 'Jadwal asesmen dan wawancara mengikuti undangan resmi dari Tim Admission. Jika ada kendala waktu, kami dapat membantu penjadwalan ulang.',
    },
    {
      id: 13,
      text: 'Panduan Confirmation Letter: Silakan login ke portal Admission, pilih status Accepted, lalu unduh dan unggah kembali Confirmation Letter yang telah ditandatangani.',
    },
    {
      id: 14,
      text: 'Informasi Pembayaran Pertama: Rincian dan nomor rekening resmi tercantum pada surat penerimaan. Seluruh pembayaran bersifat non-refundable.',
    },
    {
      id: 15,
      text: 'Hasil asesmen dan psikotes bersifat rahasia. Tim terkait akan menyampaikannya secara langsung setelah verifikasi data orang tua.',
    },
    {
      id: 16,
      text: 'Permohonan perpanjangan batas waktu pembayaran pertama akan diteruskan ke Tim Finance untuk peninjauan.',
    },
    {
      id: 17,
      text: 'Informasi kalender akademik dan jadwal belajar harian dapat dilihat melalui buku panduan sekolah atau dikonfirmasikan ke PRO jenjang.',
    },
    {
      id: 18,
      text: 'Pemberitahuan izin atau ketidakhadiran siswa dapat disampaikan langsung kepada Class PRO masing-masing jenjang.',
    },
    {
      id: 22,
      text: 'Silakan ketik pertanyaan Anda mengenai biaya, kurikulum, atau pendaftaran. Asisten AI kami siap menjawab dalam Bahasa Indonesia:',
    },
    {
      id: 23,
      text: 'Apakah ada hal lain yang dapat kami bantu, Ayah/Bunda?',
    },
    {
      id: 24,
      text: 'Terima kasih telah menghubungi Kreativa Global School! 😊 Semoga hari Anda berkah dan menyenangkan. Wassalamu’alaikum Warahmatullahi Wabarakatuh.',
    },
  ];

  for (const n of nodeUpdates) {
    await client.query('UPDATE chatbot_flow_nodes SET message_text = $1 WHERE id = $2', [n.text, n.id]);
  }
  console.log(`Updated ${nodeUpdates.length} chatbot flow nodes to Bahasa Indonesia.`);

  // 2. Update chatbot_flow_options
  const optionUpdates = [
    // Root Node (1)
    { node_id: 1, next_node_id: 3, label: 'Ya, saya orang tua siswa aktif Kreativa' },
    { node_id: 1, next_node_id: 2, label: 'Bukan, saya calon orang tua / pendaftar baru' },

    // Node 2 (Prospective)
    { node_id: 2, next_node_id: 4, label: 'Belum, saya ingin tahu info sekolah dulu' },
    { node_id: 2, next_node_id: 5, label: 'Sudah, saya sudah mendaftar di portal' },
    { node_id: 2, next_node_id: 8, label: '💰 Tanyakan Biaya Masuk & SPP' },

    // Node 3 (Active parent)
    { node_id: 3, next_node_id: 17, label: 'Jadwal & kalender sekolah' },
    { node_id: 3, next_node_id: 18, label: 'Izin dan kehadiran siswa' },
    { node_id: 3, next_node_id: 21, label: 'Hubungi Class PRO jenjang' },
    { node_id: 3, next_node_id: 8,  label: '💰 Cek Rincian Biaya & SPP Jenjang Berikutnya' },
    { node_id: 3, next_node_id: 4,  label: 'Daftarkan anak kedua / lainnya' },
    { node_id: 3, next_node_id: 24, label: 'Sudah cukup, terima kasih' },

    // Node 4 (Level selection)
    { node_id: 4, label_match: 'Kindergarten 1', new_label: 'Kindergarten 1 (TK A)' },
    { node_id: 4, label_match: 'Kindergarten 2', new_label: 'Kindergarten 2 (TK B)' },
    { node_id: 4, label_match: 'Primary',        new_label: 'Primary School (SD)' },
    { node_id: 4, label_match: 'Secondary',      new_label: 'Secondary School (SMP)' },
    { node_id: 4, label_match: 'High School',    new_label: 'High School (SMA)' },

    // Node 5 (Registered)
    { node_id: 5, next_node_id: 12, label: 'Jadwal asesmen / wawancara' },
    { node_id: 5, next_node_id: 13, label: 'Panduan Confirmation Letter' },
    { node_id: 5, next_node_id: 14, label: 'Informasi pembayaran pertama' },
    { node_id: 5, next_node_id: 15, label: 'Hasil asesmen / psikotes' },
    { node_id: 5, next_node_id: 16, label: 'Perpanjangan batas waktu pembayaran' },
    { node_id: 5, next_node_id: 19, label: 'Hubungi Tim Admission' },
    { node_id: 5, next_node_id: 20, label: 'Kirim bukti pembayaran ke Finance' },
    { node_id: 5, next_node_id: 24, label: 'Sudah cukup, terima kasih' },

    // Node 6 (General prospective topics)
    { node_id: 6, next_node_id: 7,  label: 'Kurikulum dan program belajar' },
    { node_id: 6, next_node_id: 8,  label: '💰 Rincian biaya sekolah & SPP' },
    { node_id: 6, next_node_id: 9,  label: 'Ketersediaan kursi & kuota' },
    { node_id: 6, next_node_id: 10, label: 'School visit / trial class' },
    { node_id: 6, next_node_id: 11, label: 'Cara mendaftar' },
    { node_id: 6, next_node_id: 19, label: 'Hubungi Tim Admission' },
    { node_id: 6, next_node_id: 22, label: 'Tanya hal lain (Asisten AI)' },
    { node_id: 6, next_node_id: 24, label: 'Sudah cukup, terima kasih' },
  ];

  for (const opt of optionUpdates) {
    if (opt.new_label && opt.label_match) {
      await client.query(
        'UPDATE chatbot_flow_options SET label = $1 WHERE node_id = $2 AND label ILIKE $3',
        [opt.new_label, opt.node_id, `%${opt.label_match}%`]
      );
    } else if (opt.label && opt.next_node_id) {
      await client.query(
        'UPDATE chatbot_flow_options SET label = $1 WHERE node_id = $2 AND next_node_id = $3',
        [opt.label, opt.node_id, opt.next_node_id]
      );
    }
  }

  console.log('Updated chatbot flow options to Bahasa Indonesia.');

  // Verify Root Node
  const root = await client.query('SELECT * FROM chatbot_flow_nodes WHERE is_root = TRUE');
  console.log('\nRoot Node in Database:');
  console.log(root.rows[0]);

  const rootOptions = await client.query('SELECT * FROM chatbot_flow_options WHERE node_id = $1 ORDER BY sort_order', [root.rows[0].id]);
  console.log('\nRoot Node Options:');
  rootOptions.rows.forEach(r => console.log(` - [id=${r.id}] ${r.label} -> leads to node ${r.next_node_id}`));

  await client.end();
}

updateIndonesianChatbot().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
