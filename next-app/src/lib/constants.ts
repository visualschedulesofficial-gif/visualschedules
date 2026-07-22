export const A4_PORTRAIT = { width: 794, height: 1123 } as const;
export const A4_LANDSCAPE = { width: 1123, height: 794 } as const;

export const GRID_SPECS = {
  2: { cols: 2, cellW: 345, cellH: 282, rows: 3, slots: 6 },
  3: { cols: 3, cellW: 227, cellH: 186, rows: 4, slots: 12 },
  4: { cols: 4, cellW: 168, cellH: 137, rows: 6, slots: 24 },
} as const;

export const MAX_WEEKLY_CARDS = 5;
export const MAX_CUSTOM_CARDS = 5;
// Timetable cards are small and stacked (built to be cut apart one by one),
// so each column holds far more than Custom's chunky columns.
export const MAX_TIMETABLE_CARDS = 12;
export const MAX_FT_CARDS = 1;
export const FREE_SCHEDULE_LIMIT = 3;

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_KEYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const LANGUAGES = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  pa: "Punjabi",
  gu: "Gujarati",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  ur: "Urdu",
  kn: "Kannada",
  ml: "Malayalam",
  es: "Spanish",
  fr: "French",
  de: "German",
  ar: "Arabic",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  ind: "Indonesian",
  ms: "Malay",
  th: "Thai",
  ru: "Russian",
  tl: "Filipino",
  vi: "Vietnamese",
} as const;

export type Language = keyof typeof LANGUAGES;
export type ScheduleType = "daily" | "weekly" | "custom" | "firstthen" | "iwant" | "timetable";
export type Gender = "neutral" | "boy" | "girl" | "brown" | "all";
export type CardStyle = "white" | "black";
export type GridCols = 2 | 3 | 4;

export type CardType = "visual" | "equal" | "text";

// Equal Focus: image-left cards, 2 x 5 per page. Text Focus: slim strips, 2 x 8.
export const CARD_TYPE_GRIDS = {
  equal: { cols: 2, rows: 5, slots: 10 },
  text: { cols: 2, rows: 8, slots: 16 },
} as const;

export function getDailySpec(
  cardType: CardType,
  gridCols: GridCols
): { cols: number; rows: number; slots: number } {
  if (cardType === "equal") return CARD_TYPE_GRIDS.equal;
  if (cardType === "text") return CARD_TYPE_GRIDS.text;
  return GRID_SPECS[gridCols as 2 | 3 | 4];
}

// Canvas UI strings per language: schedule titles, weekday names (Sunday
// first, matching DAYS), "Column", and First/Then board words. Languages
// without an entry fall back to English.
export const CANVAS_STRINGS: Record<string, {
  types: { daily: string; weekly: string; custom: string; firstthen: string; iwant: string; timetable: string };
  column: string;
  days: string[];
  first: string; then: string; now: string; next: string; last: string;
}> = {
  en: { types: { daily: "Daily Schedule", weekly: "Weekly Schedule", custom: "Custom Schedule", firstthen: "First/Then Board", iwant: "I want", timetable: "Timetable" }, column: "Column", days: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], first: "First", then: "Then", now: "Now", next: "Next", last: "Last" },
  hi: { types: { daily: "दैनिक दिनचर्या", weekly: "साप्ताहिक दिनचर्या", custom: "कस्टम दिनचर्या", firstthen: "पहले-फिर बोर्ड", iwant: "मुझे चाहिए", timetable: "समय सारिणी" }, column: "कॉलम", days: ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"], first: "पहले", then: "फिर", now: "अब", next: "आगे", last: "अंत में" },
  mr: { types: { daily: "दैनंदिन वेळापत्रक", weekly: "साप्ताहिक वेळापत्रक", custom: "कस्टम वेळापत्रक", firstthen: "आधी-नंतर बोर्ड", iwant: "मला हवे आहे", timetable: "वेळापत्रक" }, column: "कॉलम", days: ["रविवार","सोमवार","मंगळवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"], first: "आधी", then: "नंतर", now: "आता", next: "पुढे", last: "शेवटी" },
  pa: { types: { daily: "ਰੋਜ਼ਾਨਾ ਸਮਾਂ-ਸੂਚੀ", weekly: "ਹਫ਼ਤਾਵਾਰੀ ਸਮਾਂ-ਸੂਚੀ", custom: "ਕਸਟਮ ਸਮਾਂ-ਸੂਚੀ", firstthen: "ਪਹਿਲਾਂ-ਫਿਰ ਬੋਰਡ", iwant: "ਮੈਨੂੰ ਚਾਹੀਦਾ ਹੈ", timetable: "ਸਮਾਂ ਸਾਰਣੀ" }, column: "ਕਾਲਮ", days: ["ਐਤਵਾਰ","ਸੋਮਵਾਰ","ਮੰਗਲਵਾਰ","ਬੁੱਧਵਾਰ","ਵੀਰਵਾਰ","ਸ਼ੁੱਕਰਵਾਰ","ਸ਼ਨਿੱਚਰਵਾਰ"], first: "ਪਹਿਲਾਂ", then: "ਫਿਰ", now: "ਹੁਣ", next: "ਅੱਗੇ", last: "ਆਖ਼ਰ ਵਿੱਚ" },
  gu: { types: { daily: "દૈનિક સમયપત્રક", weekly: "સાપ્તાહિક સમયપત્રક", custom: "કસ્ટમ સમયપત્રક", firstthen: "પહેલા-પછી બોર્ડ", iwant: "મારે જોઈએ છે", timetable: "સમય પત્રક" }, column: "કૉલમ", days: ["રવિવાર","સોમવાર","મંગળવાર","બુધવાર","ગુરુવાર","શુક્રવાર","શનિવાર"], first: "પહેલા", then: "પછી", now: "હવે", next: "આગળ", last: "છેલ્લે" },
  ta: { types: { daily: "தினசரி அட்டவணை", weekly: "வார அட்டவணை", custom: "தனிப்பயன் அட்டவணை", firstthen: "முதலில்-பிறகு பலகை", iwant: "எனக்கு வேண்டும்", timetable: "கால அட்டவணை" }, column: "பத்தி", days: ["ஞாயிறு","திங்கள்","செவ்வாய்","புதன்","வியாழன்","வெள்ளி","சனி"], first: "முதலில்", then: "பிறகு", now: "இப்போது", next: "அடுத்து", last: "கடைசியாக" },
  te: { types: { daily: "రోజువారీ షెడ్యూల్", weekly: "వారపు షెడ్యూల్", custom: "కస్టమ్ షెడ్యూల్", firstthen: "ముందు-తర్వాత బోర్డు", iwant: "నాకు కావాలి", timetable: "టైమ్ టేబుల్" }, column: "కాలమ్", days: ["ఆదివారం","సోమవారం","మంగళవారం","బుధవారం","గురువారం","శుక్రవారం","శనివారం"], first: "ముందు", then: "తర్వాత", now: "ఇప్పుడు", next: "తదుపరి", last: "చివరగా" },
  bn: { types: { daily: "দৈনিক রুটিন", weekly: "সাপ্তাহিক রুটিন", custom: "কাস্টম রুটিন", firstthen: "আগে-পরে বোর্ড", iwant: "আমি চাই", timetable: "সময়সূচী" }, column: "কলাম", days: ["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"], first: "আগে", then: "পরে", now: "এখন", next: "এরপর", last: "শেষে" },
  ur: { types: { daily: "روزانہ شیڈول", weekly: "ہفتہ وار شیڈول", custom: "کسٹم شیڈول", firstthen: "پہلے-پھر بورڈ", iwant: "مجھے چاہیے", timetable: "ٹائم ٹیبل" }, column: "کالم", days: ["اتوار","پیر","منگل","بدھ","جمعرات","جمعہ","ہفتہ"], first: "پہلے", then: "پھر", now: "اب", next: "آگے", last: "آخر میں" },
  kn: { types: { daily: "ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ", weekly: "ಸಾಪ್ತಾಹಿಕ ವೇಳಾಪಟ್ಟಿ", custom: "ಕಸ್ಟಮ್ ವೇಳಾಪಟ್ಟಿ", firstthen: "ಮೊದಲು-ನಂತರ ಬೋರ್ಡ್", iwant: "ನನಗೆ ಬೇಕು", timetable: "ವೇಳಾಪಟ್ಟಿ" }, column: "ಕಾಲಮ್", days: ["ಭಾನುವಾರ","ಸೋಮವಾರ","ಮಂಗಳವಾರ","ಬುಧವಾರ","ಗುರುವಾರ","ಶುಕ್ರವಾರ","ಶನಿವಾರ"], first: "ಮೊದಲು", then: "ನಂತರ", now: "ಈಗ", next: "ಮುಂದೆ", last: "ಕೊನೆಗೆ" },
  ml: { types: { daily: "ദിവസ ഷെഡ്യൂൾ", weekly: "ആഴ്ച ഷെഡ്യൂൾ", custom: "കസ്റ്റം ഷെഡ്യൂൾ", firstthen: "ആദ്യം-പിന്നെ ബോർഡ്", iwant: "എനിക്ക് വേണം", timetable: "ടൈംടേബിൾ" }, column: "കോളം", days: ["ഞായർ","തിങ്കൾ","ചൊവ്വ","ബുധൻ","വ്യാഴം","വെള്ളി","ശനി"], first: "ആദ്യം", then: "പിന്നെ", now: "ഇപ്പോൾ", next: "അടുത്തത്", last: "അവസാനം" },
  es: { types: { daily: "Horario diario", weekly: "Horario semanal", custom: "Horario personalizado", firstthen: "Tablero Primero-Después", iwant: "Yo quiero", timetable: "Horario" }, column: "Columna", days: ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"], first: "Primero", then: "Después", now: "Ahora", next: "Siguiente", last: "Último" },
  fr: { types: { daily: "Programme quotidien", weekly: "Programme hebdomadaire", custom: "Programme personnalisé", firstthen: "Tableau D'abord-Ensuite", iwant: "Je veux", timetable: "Emploi du temps" }, column: "Colonne", days: ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"], first: "D'abord", then: "Ensuite", now: "Maintenant", next: "Suivant", last: "Dernier" },
  de: { types: { daily: "Tagesplan", weekly: "Wochenplan", custom: "Eigener Plan", firstthen: "Erst-Dann-Tafel", iwant: "Ich möchte", timetable: "Stundenplan" }, column: "Spalte", days: ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"], first: "Erst", then: "Dann", now: "Jetzt", next: "Weiter", last: "Zuletzt" },
  ar: { types: { daily: "الجدول اليومي", weekly: "الجدول الأسبوعي", custom: "جدول مخصص", firstthen: "لوحة أولاً-ثم", iwant: "أريد", timetable: "الجدول الزمني" }, column: "عمود", days: ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"], first: "أولاً", then: "ثم", now: "الآن", next: "التالي", last: "أخيراً" },
  zh: { types: { daily: "每日计划", weekly: "每周计划", custom: "自定义计划", firstthen: "先后板", iwant: "我想要", timetable: "课程表" }, column: "列", days: ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"], first: "先", then: "然后", now: "现在", next: "接下来", last: "最后" },
  ja: { types: { daily: "毎日のスケジュール", weekly: "週間スケジュール", custom: "カスタムスケジュール", firstthen: "はじめに・つぎに ボード", iwant: "ほしい", timetable: "時間割" }, column: "列", days: ["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"], first: "はじめに", then: "つぎに", now: "いま", next: "つぎ", last: "さいご" },
  ko: { types: { daily: "일일 일정", weekly: "주간 일정", custom: "맞춤 일정", firstthen: "먼저-다음 보드", iwant: "원해요", timetable: "시간표" }, column: "열", days: ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"], first: "먼저", then: "다음", now: "지금", next: "이어서", last: "마지막" },
  pt: { types: { daily: "Rotina diária", weekly: "Rotina semanal", custom: "Rotina personalizada", firstthen: "Quadro Primeiro-Depois", iwant: "Eu quero", timetable: "Horário" }, column: "Coluna", days: ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"], first: "Primeiro", then: "Depois", now: "Agora", next: "Próximo", last: "Último" },
  ind: { types: { daily: "Jadwal Harian", weekly: "Jadwal Mingguan", custom: "Jadwal Kustom", firstthen: "Papan Pertama-Lalu", iwant: "Saya mau", timetable: "Jadwal Pelajaran" }, column: "Kolom", days: ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"], first: "Pertama", then: "Lalu", now: "Sekarang", next: "Berikutnya", last: "Terakhir" },
  ms: { types: { daily: "Jadual Harian", weekly: "Jadual Mingguan", custom: "Jadual Tersuai", firstthen: "Papan Dulu-Kemudian", iwant: "Saya mahu", timetable: "Jadual Waktu" }, column: "Lajur", days: ["Ahad","Isnin","Selasa","Rabu","Khamis","Jumaat","Sabtu"], first: "Dulu", then: "Kemudian", now: "Sekarang", next: "Seterusnya", last: "Akhir" },
  th: { types: { daily: "ตารางประจำวัน", weekly: "ตารางประจำสัปดาห์", custom: "ตารางกำหนดเอง", firstthen: "บอร์ดก่อน-หลัง", iwant: "ฉันต้องการ", timetable: "ตารางเวลา" }, column: "คอลัมน์", days: ["วันอาทิตย์","วันจันทร์","วันอังคาร","วันพุธ","วันพฤหัสบดี","วันศุกร์","วันเสาร์"], first: "ก่อน", then: "แล้ว", now: "ตอนนี้", next: "ถัดไป", last: "สุดท้าย" },
  ru: { types: { daily: "Ежедневное расписание", weekly: "Недельное расписание", custom: "Своё расписание", firstthen: "Доска «Сначала-Потом»", iwant: "Я хочу", timetable: "Расписание" }, column: "Колонка", days: ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"], first: "Сначала", then: "Потом", now: "Сейчас", next: "Далее", last: "В конце" },
  tl: { types: { daily: "Pang-araw-araw na Iskedyul", weekly: "Lingguhang Iskedyul", custom: "Custom na Iskedyul", firstthen: "First-Then Board", iwant: "Gusto ko", timetable: "Iskedyul" }, column: "Hanay", days: ["Linggo","Lunes","Martes","Miyerkules","Huwebes","Biyernes","Sabado"], first: "Una", then: "Pagkatapos", now: "Ngayon", next: "Susunod", last: "Huli" },
  vi: { types: { daily: "Lịch hằng ngày", weekly: "Lịch tuần", custom: "Lịch tùy chỉnh", firstthen: "Bảng Trước-Sau", iwant: "Con muốn", timetable: "Thời khóa biểu" }, column: "Cột", days: ["Chủ Nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"], first: "Trước", then: "Sau", now: "Bây giờ", next: "Tiếp theo", last: "Cuối cùng" },
};
