import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { defaultGeminiModel, fallbackGeminiModel } from '@/lib/ai/gemini';
import { searchKnowledgeForGrounding } from '@/lib/queries/knowledge';
import { getFeeStructuresBySchool } from '@/lib/queries/fees';
import { saveChatbotMessage } from '@/lib/queries/chatbot';
import { checkRateLimit } from '@/lib/redis/ratelimit';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const isAllowed = await checkRateLimit(`ratelimit:ai:${ip}`, 15, '1 m');
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: 'Batas pesan AI tercapai. Silakan coba sesaat lagi.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, sessionId, schoolId = 1 } = await req.json();

    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || '';

    // Record user message if sessionId provided
    if (sessionId && userQuery) {
      await saveChatbotMessage({
        sessionId,
        role: 'user',
        source: 'ai',
        content: userQuery,
      });
    }

    // 1. Fetch grounded knowledge base
    const matchedFaqs = await searchKnowledgeForGrounding(schoolId, userQuery, 4);

    // 2. Fetch fee structures for context
    const feeStructures = await getFeeStructuresBySchool(schoolId);

    // 3. Construct knowledge context
    const faqContext = matchedFaqs
      .map((f) => `Q: ${f.title}\nA: ${f.answer}`)
      .join('\n\n');

    const feeContext = feeStructures
      .slice(0, 3)
      .map((fs) => {
        const items = fs.items.map((i) => `  - ${i.item_name} (${i.grade_label}): Rp ${Number(i.amount).toLocaleString('id-ID')} [${i.period_label}]`).join('\n');
        return `Jenjang: ${fs.level_name} (${fs.campus}, TA ${fs.academic_year})\nSkema: ${fs.scheme_name}\nBiaya Registrasi: Rp ${Number(fs.registration_fee).toLocaleString('id-ID')}\nRincian:\n${items}\nInclusions: ${fs.inclusions || '-'}\nCatatan: ${fs.notes || '-'}`;
      })
      .join('\n\n');

    const systemPrompt = `Anda adalah asisten virtual resmi untuk Kreativa Global School dan SD Talenta Juara (Bandung, Cimahi, Pekanbaru).
Tugas Anda adalah melayani pertanyaan orang tua siswa dengan ramah, santun, jelas, dan Islami (Assalamu'alaikum).

PEDOMAN PENTING & WAJIB:
1. WAJIB SELALU MENJAWAB DALAM BAHASA INDONESIA YANG BAIK, SANTUN, DAN RAMAH (gunakan sapaan hangat seperti "Ayah/Bunda" atau "Bapak/Ibu"). Jangan gunakan bahasa Inggris.
2. JAWAB HANYA BERDASARKAN INFORMASI DI BAWAH INI. Jika informasi tidak tersedia, sampaikan dengan santun dalam Bahasa Indonesia bahwa Anda akan menghubungkan orang tua dengan tim Admission / PRO sekolah.
3. ATURAN BIAYA: Tegaskan bahwa seluruh pembayaran yang telah dilakukan bersifat non-refundable (tidak dapat ditarik kembali).
4. PRIVASI: Untuk hasil psikotes atau data nilai pribadi siswa, jelaskan bahwa data tersebut bersifat rahasia dan orang tua dapat menghubungi PIC langsung setelah verifikasi.
5. Jangan membuat estimasi biaya atau tanggal seleksi di luar data resmi berikut.

--- KNOWLEDGE BASE RESMI ---
${faqContext || 'Tidak ada FAQ spesifik yang cocok langsung.'}

--- STRUKTUR BIAYA RESMI ---
${feeContext || 'Biaya resmi dapat dikonfirmasi langsung ke tim Admission.'}
`;

    let result;
    try {
      result = streamText({
        model: defaultGeminiModel,
        system: systemPrompt,
        messages,
        async onFinish({ text }) {
          if (sessionId && text) {
            try {
              await saveChatbotMessage({
                sessionId,
                role: 'bot',
                source: 'ai',
                content: text,
              });
            } catch (e) {
              console.error('Failed to save AI reply to database:', e);
            }
          }
        },
      });
    } catch (modelErr) {
      console.warn('Default model error, falling back to secondary Gemini model:', modelErr);
      result = streamText({
        model: fallbackGeminiModel,
        system: systemPrompt,
        messages,
        async onFinish({ text }) {
          if (sessionId && text) {
            try {
              await saveChatbotMessage({
                sessionId,
                role: 'bot',
                source: 'ai',
                content: text,
              });
            } catch (e) {
              console.error('Failed to save AI reply to database:', e);
            }
          }
        },
      });
    }

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Gagal memproses pesan AI' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
