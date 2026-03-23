import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Clock, 
  Edit2, 
  ChevronDown, 
  ExternalLink, 
  Plus, 
  Minus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PrayerTimes, Shajra, Muraqaba, Khatm } from './types';
import { SHAJRAS, MURAQABAT, KHATMS } from './constants';

// --- Utility Functions ---
const formatAMPM = (timeStr: string) => {
  if (!timeStr) return "--:--";
  let [h, m] = timeStr.split(':');
  let hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${m} ${ampm}`;
};

const addMinutes = (timeStr: string, mins: number) => {
  if (!timeStr) return "--:--";
  let [h, m] = timeStr.split(':');
  let d = new Date();
  d.setHours(parseInt(h), parseInt(m), 0);
  d.setMinutes(d.getMinutes() + mins);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// --- Components ---

const QuranSection: React.FC<{ surahNum: number; title: string }> = ({ surahNum, title }) => {
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadSurah = async () => {
    if (text) return;
    setLoading(true);
    setError(false);
    const cached = localStorage.getItem(`surah_${surahNum}`);
    if (cached) {
      setText(cached);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}`);
      const data = await res.json();
      let fullText = "";
      data.data.ayahs.forEach((a: any) => { fullText += a.text + "  "; });
      localStorage.setItem(`surah_${surahNum}`, fullText);
      setText(fullText);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <details className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden mb-3 shadow-lg group" onToggle={(e) => (e.target as HTMLDetailsElement).open && loadSurah()}>
      <summary className="bg-[#D4AF37]/15 p-4 flex justify-between items-center cursor-pointer select-none">
        <span className="text-xl font-bold text-[#ffdd57]">{title}</span>
        <ChevronDown className="text-[#D4AF37] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="p-4 border-t border-dashed border-[#D4AF37]/40 bg-black/50">
        <div className="quran-box max-h-[400px] overflow-y-auto p-4 bg-white/5 rounded-xl border border-[#D4AF37]/30">
          {loading ? (
            <div className="text-center text-[#a5d6a7] text-lg animate-pulse">لوڈ ہو رہا ہے...</div>
          ) : error ? (
            <div className="text-center text-red-400 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
              براہ کرم انٹرنیٹ آن کریں
            </div>
          ) : (
            <p dir="rtl" className="font-amiri text-2xl text-[#ffdd57] leading-[2.2] text-center">
              {text}
            </p>
          )}
        </div>
      </div>
    </details>
  );
};

export default function App() {
  const [city, setCity] = useState(localStorage.getItem('saifi_city') || "گوجرخان");
  const [lat, setLat] = useState(parseFloat(localStorage.getItem('saifi_lat') || "33.2612"));
  const [lon, setLon] = useState(parseFloat(localStorage.getItem('saifi_lon') || "73.3058"));
  const [timezone, setTimezone] = useState(localStorage.getItem('saifi_tz') || "Asia/Karachi");
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [globalOffset, setGlobalOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [apiStatus, setApiStatus] = useState("سٹینڈرڈ ٹائم کنیکٹ ہو رہا ہے...");
  const [apiStatusColor, setApiStatusColor] = useState("text-[#2ecc71]");
  const [nextPrayer, setNextPrayer] = useState<{ name: string; countdown: string }>({ name: "--", countdown: "00:00:00" });

  // --- Fetch Logic ---
  const fetchPrayerTimes = useCallback(async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=1&school=1`);
      const data = await res.json();
      setPrayerTimes(data.data.timings);
      setTimezone(data.data.meta.timezone);
      localStorage.setItem('saifi_tz', data.data.meta.timezone);
    } catch (e) {
      console.error("Prayer times fetch failed", e);
    }
  }, []);

  const syncAtomicTime = useCallback(async () => {
    try {
      const res = await fetch(`https://timeapi.io/api/Time/current/zone?timeZone=UTC`);
      const data = await res.json();
      setGlobalOffset(new Date(data.dateTime + "Z").getTime() - Date.now());
      setApiStatus("🟢 لائیو سٹینڈرڈ ٹائم");
      setApiStatusColor("text-[#2ecc71]");
    } catch (e) {
      try {
        const res = await fetch('https://api.github.com/');
        const dateStr = res.headers.get('Date');
        if (dateStr) {
          setGlobalOffset(new Date(dateStr).getTime() - Date.now());
          setApiStatus("🟢 لائیو انٹرنیشنل ٹائم");
          setApiStatusColor("text-[#2ecc71]");
        }
      } catch (e2) {
        setApiStatus("🔴 ڈیوائس ٹائم (انٹرنیٹ درکار)");
        setApiStatusColor("text-red-500");
      }
    }
  }, []);

  const changeCity = async () => {
    const newCity = prompt("اپنے شہر کا نام انگریزی یا اردو میں لکھیں:", city);
    if (!newCity) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newCity)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLon = parseFloat(data[0].lon);
        const cityName = data[0].name.split(',')[0];
        setLat(newLat);
        setLon(newLon);
        setCity(cityName);
        localStorage.setItem('saifi_city', cityName);
        localStorage.setItem('saifi_lat', String(newLat));
        localStorage.setItem('saifi_lon', String(newLon));
        fetchPrayerTimes(newLat, newLon);
      } else {
        alert("شہر نہیں ملا!");
      }
    } catch (e) {
      alert("انٹرنیٹ کا مسئلہ ہے۔");
    }
  };

  // --- Effects ---
  useEffect(() => {
    const init = async () => {
      if (!localStorage.getItem('saifi_lat')) {
        try {
          const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
          const data = await res.json();
          if (data.city !== "Swabi") {
            setCity(data.city);
            setLat(data.latitude);
            setLon(data.longitude);
            fetchPrayerTimes(data.latitude, data.longitude);
          } else {
            fetchPrayerTimes(lat, lon);
          }
        } catch (e) {
          fetchPrayerTimes(lat, lon);
        }
      } else {
        fetchPrayerTimes(lat, lon);
      }
      syncAtomicTime();
    };
    init();
  }, [lat, lon, fetchPrayerTimes, syncAtomicTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date(Date.now() + globalOffset);
      setCurrentTime(now);

      if (prayerTimes) {
        const nowTimeStr = now.toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const currentD = new Date(`1970-01-01T${nowTimeStr}Z`);

        const timesList = [
          { name: 'فجر', time: new Date(`1970-01-01T${prayerTimes.Fajr}:00Z`) },
          { name: 'اشراق', time: new Date(`1970-01-01T${addMinutes(prayerTimes.Sunrise, 15)}:00Z`) },
          { name: 'چاشت', time: new Date(`1970-01-01T${addMinutes(prayerTimes.Sunrise, 45)}:00Z`) },
          { name: 'ظہر', time: new Date(`1970-01-01T${prayerTimes.Dhuhr}:00Z`) },
          { name: 'عصر', time: new Date(`1970-01-01T${prayerTimes.Asr}:00Z`) },
          { name: 'مغرب', time: new Date(`1970-01-01T${prayerTimes.Maghrib}:00Z`) },
          { name: 'عشاء', time: new Date(`1970-01-01T${prayerTimes.Isha}:00Z`) }
        ];

        let next = timesList.find(p => currentD < p.time);
        if (!next) {
          next = { name: 'فجر (اگلا دن)', time: new Date(timesList[0].time.getTime() + 24 * 60 * 60 * 1000) };
        }

        const diff = next.time.getTime() - currentD.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        setNextPrayer({
          name: `اگلا وقت: ${next.name}`,
          countdown: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [globalOffset, prayerTimes, timezone]);

  return (
    <div dir="rtl" className="flex flex-col items-center min-h-screen pb-12 overflow-x-hidden">
      {/* Header */}
      <header className="w-full bg-gradient-to-br from-black/80 to-[#D4AF37]/15 border-b-4 border-[#D4AF37] rounded-b-[30px] py-8 px-4 text-center shadow-2xl mb-6">
        <h1 className="font-amiri text-5xl md:text-6xl text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.6)] mb-4">سلسلہ سیفیہ</h1>
        <div className="inline-block bg-white/10 px-6 py-2 rounded-full text-lg text-gray-200 border border-white/5">
          نقشبندیہ • چشتیہ • قادریہ • سہروردیہ
        </div>
      </header>

      <main className="w-[95%] max-w-[600px] flex flex-col gap-5">
        
        {/* Status Box */}
        <section className="bg-black/50 p-6 rounded-2xl border border-[#D4AF37] shadow-xl text-center backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 text-[#ffdd57] px-5 py-2 rounded-full text-xl border border-[#D4AF37]/50 mb-4">
            <span>{city}</span>
            <button onClick={changeCity} className="p-1 bg-[#D4AF37] text-black rounded-full hover:scale-110 transition-transform">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-lg text-gray-300 mb-2">
            {currentTime.toLocaleDateString('ur-PK', { timeZone: timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div dir="ltr" className="text-5xl font-mono font-bold text-white tracking-wider">
            {currentTime.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div className={`text-sm mt-3 ${apiStatusColor} font-medium`}>
            {apiStatus}
          </div>
        </section>

        {/* Next Prayer Countdown */}
        <section className="bg-gradient-to-br from-[#003214] to-[#001a0a] border-2 border-[#ffdd57] rounded-2xl p-6 text-center shadow-2xl">
          <div className="text-2xl text-[#ffdd57] mb-2 font-bold">{nextPrayer.name}</div>
          <div dir="ltr" className="text-6xl font-mono font-bold text-[#D4AF37] tracking-[4px]">
            {nextPrayer.countdown}
          </div>
        </section>

        {/* Prayer Times Grid */}
        <section>
          <h2 className="text-3xl font-bold text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-3 mb-4">اوقاتِ نماز (فقہ حنفی)</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'فجر', time: formatAMPM(prayerTimes?.Fajr || "") },
              { name: 'اشراق', time: formatAMPM(addMinutes(prayerTimes?.Sunrise || "", 15)), accent: true },
              { name: 'چاشت', time: formatAMPM(addMinutes(prayerTimes?.Sunrise || "", 45)), accent: true },
              { name: 'ظہر', time: formatAMPM(prayerTimes?.Dhuhr || "") },
              { name: 'عصر', time: formatAMPM(prayerTimes?.Asr || "") },
              { name: 'مغرب', time: formatAMPM(prayerTimes?.Maghrib || "") },
              { name: 'عشاء', time: formatAMPM(prayerTimes?.Isha || "") },
              { name: 'تہجد', time: "عشاء سے فجر", span: 2, accent: true },
            ].map((p, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl border border-[#D4AF37] text-center shadow-md transition-all hover:bg-[#D4AF37]/10 ${p.span ? 'col-span-2' : ''} ${p.accent ? 'bg-[#D4AF37]/10' : 'bg-black/60'}`}
              >
                <span className="block text-[#f1c40f] text-lg font-bold mb-1">{p.name}</span>
                <span dir="ltr" className="block text-white font-mono text-lg">{p.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quran Section */}
        <section>
          <h2 className="text-3xl font-bold text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-3 mb-4">قرآنی سورتیں (معمولات)</h2>
          <QuranSection surahNum={36} title="نماز فجر (سورہ یٰسین)" />
          
          <details className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden mb-3 shadow-lg group">
            <summary className="bg-[#D4AF37]/15 p-4 flex justify-between items-center cursor-pointer select-none">
              <span className="text-xl font-bold text-[#ffdd57]">نماز ظہر (سورہ فتح کا آخری رکوع)</span>
              <ChevronDown className="text-[#D4AF37] group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-4 border-t border-dashed border-[#D4AF37]/40 bg-black/50">
              <p dir="rtl" className="font-amiri text-2xl text-[#ffdd57] leading-[2.2] text-center">
                لَّقَدْ صَدَقَ اللَّهُ رَسُولَهُ الرُّؤْيَا بِالْحَقِّ ۖ لَتَدْخُلُنَّ الْمَسْجِدَ الْحَرَامَ إِن شَاءَ اللَّهُ آمِنِينَ مُحَلِّقِينَ رُءُوسَكُمْ وَمُقَصِّرِينَ لَا تَخَافُونَ ۖ فَعَلِمَ مَا لَمْ تَعْلَمُوا فَجَعَلَ مِن دُونِ ذَٰلِكَ فَتْحًا قَرِيبًا ﴿٢٧﴾ هُوَ الَّذِي أَرْسَلَ رَسُولَهُ بِالْهُدَىٰ وَدِينِ الْحَقِّ لِيُظْهِرَهُ عَلَى الدِّينِ کُلِّهِ ۚ وَکَفَىٰ بِاللَّهِ شَهِيدًا ﴿٢٨﴾ مُّحَمَّدٌ رَّسُولُ اللَّهِ ۚ وَالَّذِينَ مَعَهُ أَشِدَّاءُ عَلَى الْکُفَّارِ رُحَمَاءُ بَيْنَهُمْ ۖ تَرَاهُمْ رُکَّعًا سُجَّدًا يَبْتَغُونَ فَضْلًا مِّنَ اللَّهِ وَرِضْوَانًا ۖ سِيمَاهُمْ فِي وُجُوهِهِم مِّنْ أَثَرِ السُّجُودِ ۚ ذَٰلِكَ مَثَلُهُمْ فِي التَّوْرَاةِ ۚ وَمَثَلُهُمْ فِي الْإِنجِيلِ کَزَرْعٍ أَخْرَجَ شَطْأَهُ فَآزَرَهُ فَاسْتَغْلَظَ فَاسْتَوَىٰ عَلَىٰ سُوقِهِ يُعْجِبُ الزُّرَّاعَ لِيَغِيظَ بِهِمُ الْکُفَّارَ ۗ وَعَدَ اللَّهُ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ مِنْهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًا ﴿٢٩﴾
              </p>
            </div>
          </details>

          <QuranSection surahNum={78} title="نماز عصر (سورہ نبا)" />
          <QuranSection surahNum={56} title="نماز مغرب (سورہ واقعہ)" />
          <QuranSection surahNum={67} title="نماز عشاء (سورہ ملک)" />
          <QuranSection surahNum={18} title="جمعہ کے دن (سورہ کہف)" />
        </section>

        {/* Khatm Section */}
        <section>
          <h2 className="text-3xl font-bold text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-3 mb-4">ختم خواجگان</h2>
          <details className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden mb-3 shadow-lg group">
            <summary className="bg-[#D4AF37]/15 p-4 flex justify-between items-center cursor-pointer select-none">
              <span className="text-xl font-bold text-[#ffdd57]">مکمل طریقہ ختم خواجگان</span>
              <ChevronDown className="text-[#D4AF37] group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-5 border-t border-dashed border-[#D4AF37]/40 bg-black/50">
              <p className="font-amiri text-2xl text-[#ffdd57] leading-[1.8] text-center mb-6">
                اَلْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِيْنَ وَالصَّلٰوةُ وَالسَّلَامُ عَلٰى رَسُوْلِهِ الْكَرِيْمِ ؕ رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ ؕ وصلى الله تعالى على حبيبه محمد وآله اصحابه اجمعين
              </p>
              <ul className="space-y-4">
                {[
                  { label: "فاتحہ شریف", count: "7 مرتبہ" },
                  { label: "استغفار", count: "100 مرتبہ", text: "اَسْتَغْفِرُ اللّٰہَ رَبِّی مِنْ کُلِّ ذَنْۢبٍ وَّاَتُوْبُ اِلَیْہِ" },
                  { label: "درود شریف", count: "100 مرتبہ", text: "اَللّٰھُمَّ صَلِّ عَلٰی سَیِّدِنَا مُحَمَّدٍ وَّآلِہٖ وَبَارِکْ وَسَلِّمْ عَلَیْہِ" },
                  { label: "الم نشرح", count: "79 مرتبہ" },
                  { label: "سورہ اخلاص", count: "1000 یا 100 مرتبہ" },
                  { label: "فاتحہ شریف", count: "7 مرتبہ" },
                  { label: "درود شریف", count: "100 مرتبہ" },
                ].map((item, i) => (
                  <li key={i} className="flex flex-col gap-1 border-r-2 border-[#ffdd57] pr-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-white">{item.label}</span>
                      <span className="text-[#f1c40f] font-bold">{item.count}</span>
                    </div>
                    {item.text && <span className="text-[#ffdd57] text-lg font-amiri">{item.text}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </details>

          {KHATMS.map((k, i) => (
            <details key={i} className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden mb-3 shadow-lg group">
              <summary className="bg-[#D4AF37]/15 p-4 flex justify-between items-center cursor-pointer select-none">
                <span className="text-xl font-bold text-[#ffdd57]">{k.name}</span>
                <ChevronDown className="text-[#D4AF37] group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-5 border-t border-dashed border-[#D4AF37]/40 bg-black/50">
                <ul className="space-y-4">
                  <li className="flex justify-between border-r-2 border-[#ffdd57] pr-4">
                    <span className="text-lg font-bold text-white">درود شریف</span>
                    <span className="text-[#f1c40f] font-bold">100 مرتبہ</span>
                  </li>
                  <li className="flex flex-col gap-2 border-r-2 border-[#ffdd57] pr-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-white">ذکر</span>
                      <span className="text-[#f1c40f] font-bold">500 مرتبہ</span>
                    </div>
                    <span className="text-2xl text-[#ffdd57] font-amiri text-center leading-relaxed">{k.zikr}</span>
                  </li>
                  <li className="flex justify-between border-r-2 border-[#ffdd57] pr-4">
                    <span className="text-lg font-bold text-white">درود شریف</span>
                    <span className="text-[#f1c40f] font-bold">100 مرتبہ</span>
                  </li>
                </ul>
              </div>
            </details>
          ))}
        </section>

        {/* Asbaq Section */}
        <section>
          <h2 className="text-3xl font-bold text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-3 mb-4">اسباق طریقہ نقشبندیہ</h2>
          <details className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden mb-3 shadow-lg group">
            <summary className="bg-[#D4AF37]/15 p-4 flex justify-between items-center cursor-pointer select-none">
              <span className="text-xl font-bold text-[#ffdd57]">مقاماتِ لطائفِ ستّہ</span>
            </summary>
            <div className="p-5 border-t border-dashed border-[#D4AF37]/40 bg-black/50">
              <ul className="space-y-3">
                {[
                  { name: "قلب", color: "text-[#f1c40f]", desc: "زرد رنگ، بائیں پستان کے نیچے۔ (حضرت آدمؑ)" },
                  { name: "روح", color: "text-[#e74c3c]", desc: "سرخ رنگ، دائیں پستان کے نیچے۔ (حضرت نوحؑ و ابراہیمؑ)" },
                  { name: "سرّ", color: "text-white", desc: "سفید رنگ، بائیں پستان کے اوپر۔ (حضرت موسیٰؑ)" },
                  { name: "خفی", color: "text-gray-400", desc: "سیاہ رنگ، دائیں پستان کے اوپر۔ (حضرت عیسیٰؑ)" },
                  { name: "اخفیٰ", color: "text-[#2ecc71]", desc: "سبز رنگ، سینے کے درمیان۔ (سید الانبیاء ﷺ)" },
                  { name: "نفس", color: "text-[#8d6e63]", desc: "مٹیالا (بے رنگ)، پیشانی۔" },
                  { name: "قالب", color: "text-[#D4AF37]", desc: "سارا جسم۔" },
                ].map((l, i) => (
                  <li key={i} className="flex gap-3 border-r-2 border-[#ffdd57] pr-4">
                    <strong className={`${l.color} text-xl min-w-[60px]`}>{l.name}:</strong>
                    <span className="text-gray-200">{l.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <details className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden mb-3 shadow-lg group">
            <summary className="bg-[#D4AF37]/15 p-4 flex justify-between items-center cursor-pointer select-none">
              <span className="text-xl font-bold text-[#ffdd57]">ذکر نفی اثبات</span>
            </summary>
            <div className="p-5 border-t border-dashed border-[#D4AF37]/40 bg-black/50 text-gray-200 leading-relaxed">
              <p className="mb-4">طاق عدد پر حبسِ نفس (سانس روک کر) ذکر کیا جاتا ہے۔</p>
              <ul className="space-y-3 mb-6">
                {[
                  "زبان کو تالو سے لگا کر سانس ناف کے نیچے روکیں۔",
                  "'لا' کو ناف سے کھینچ کر دماغ تک لے جائیں۔",
                  "'إلہ' دماغ سے دائیں کندھے تک لائیں۔",
                  "'إلا اللہ' کی ضرب پوری قوت سے قلب (دل) پر لگائیں۔"
                ].map((step, i) => (
                  <li key={i} className="flex gap-2 border-r-2 border-[#ffdd57] pr-4">
                    <span className="text-[#ffdd57] font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-white/5 p-4 rounded-lg border border-[#D4AF37]/30 text-center">
                <span className="text-[#D4AF37] font-bold block mb-2">نیت قلب پر ضرب کے وقت:</span>
                <span className="font-amiri text-2xl text-[#ffdd57]">"إِلٰهِي أَنْتَ مَقْصُودِيْ وَرِضَاكَ مَطْلُوبِيْ، أَعْطِنِيْ مَحَبَّةَ ذَاتِكَ وَمَعْرِفَةَ صِفَاتِكَ"</span>
              </div>
            </div>
          </details>
        </section>

        {/* Muraqabat Section */}
        <section>
          <h2 className="text-3xl font-bold text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-3 mb-4">معمولاتِ سیفیہ: 36 مراقبات</h2>
          {MURAQABAT.map((m, i) => (
            <details key={i} className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden mb-3 shadow-lg group">
              <summary className="bg-[#D4AF37]/15 p-4 flex justify-between items-center cursor-pointer select-none">
                <span className="text-xl font-bold text-[#ffdd57]">{m.title}</span>
                <ChevronDown className="text-[#D4AF37] group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-5 border-t border-dashed border-[#D4AF37]/40 bg-black/50">
                <span className="text-[#D4AF37] font-bold block mb-1">فارسی نیت:</span>
                <p className="text-gray-200 text-lg leading-relaxed">{m.text}</p>
              </div>
            </details>
          ))}
        </section>

        {/* Other Silsila Section */}
        <section>
          <h2 className="text-3xl font-bold text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-3 mb-4">دیگر سلاسل کے اسباق</h2>
          {[
            {
              title: "طریقہ عالیہ چشتیہ",
              items: [
                { label: "ذکرِ جہر مع ضرب", desc: "بغیر پاس انفاس کے۔ قلب سے \"لا إلہ\" کھینچ کر دائیں کندھے، پھر سر، اور وہاں سے \"إلا اللہ\" کی ضرب قلب پر۔" },
                { label: "مراقبہ چشتیہ", desc: "نیت: \"فیض می آید از ذاتِ بے چوں بلطیفہ قلب من، بواسطہ پیرانِ کبار، خصوصاً حضرت خواجہ معین الدین چشتیؒ\"" }
              ]
            },
            {
              title: "طریقہ عالیہ قادریہ",
              items: [
                { label: "پہلا سبق", desc: "1 بار \"لا إلہ إلا اللہ\"، پھر 100 بار \"إلا اللہ\"، پھر \"محمد رسول اللہ ﷺ\"۔ کل تعداد 1000۔" },
                { label: "دوسرا سبق", desc: "1 بار \"اللہ جل جلالہ\"، پھر \"جل جلالہ\" کی تکرار۔ کل 1000۔" },
                { label: "تیسرا سبق", desc: "\"ھُو\" روح سے شروع ہو کر لطیفہ اخفیٰ تک۔ کل 1000۔" },
                { label: "مراقبہ قادریہ", desc: "نیت: \"فیض می آید از ذاتِ بے چوں بلطیفہ قلب من، بواسطہ پیرانِ کبار، خصوصاً غوث الاعظم شیخ عبدالقادر جیلانیؒ\"" }
              ]
            },
            {
              title: "طریقہ عالیہ سہروردیہ",
              items: [
                { label: "طریقہ", desc: "اسباق قادریہ کی طرح ہیں۔ البتہ مراقبہ کم از کم 20 منٹ اور بغیر حبسِ نفس (سانس روکے بغیر) ہے۔" },
                { label: "مراقبہ سہروردیہ", desc: "نیت: \"فیض می آید از ذاتِ بے چوں بلطیفہ قلب من، بواسطہ پیرانِ کبار، خصوصاً حضرت شیخ شہاب الدین سہروردیؒ\"" }
              ]
            }
          ].map((s, i) => (
            <details key={i} className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden mb-3 shadow-lg group">
              <summary className="bg-[#D4AF37]/15 p-4 flex justify-between items-center cursor-pointer select-none">
                <span className="text-xl font-bold text-[#ffdd57]">{s.title}</span>
                <ChevronDown className="text-[#D4AF37] group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-5 border-t border-dashed border-[#D4AF37]/40 bg-black/50">
                <ul className="space-y-4">
                  {s.items.map((item, idx) => (
                    <li key={idx} className="border-r-2 border-[#ffdd57] pr-4">
                      <span className="text-[#ffdd57] font-bold block text-lg mb-1">{item.label}:</span>
                      <span className="text-gray-200 italic">{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </section>

        {/* Shajra Section */}
        <section>
          <h2 className="text-3xl font-bold text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-3 mb-4">شجرہ ہائے طریقت (مع تعارف)</h2>
          {SHAJRAS.map((s, i) => (
            <details key={i} className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden mb-3 shadow-lg group">
              <summary className="bg-[#D4AF37]/15 p-4 flex justify-between items-center cursor-pointer select-none">
                <span className="text-xl font-bold text-[#ffdd57]">{s.title}</span>
                <ChevronDown className="text-[#D4AF37] group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-5 border-t border-dashed border-[#D4AF37]/40 bg-black/50">
                <ul className="space-y-6">
                  {s.members.map((member, idx) => (
                    <li key={idx} className="border-b border-white/10 pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[#D4AF37] font-mono font-bold text-lg">{idx + 1}.</span>
                        <span className="text-xl font-bold text-white">{member.name}</span>
                        {idx === s.members.length - 1 && (
                          <a 
                            href="https://ur.wikipedia.org/wiki/پیر_سیف_الرحمن" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mr-auto text-[#D4AF37] hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[#a5d6a7] text-sm pr-8 leading-relaxed italic">{member.bio}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-400 text-sm px-4">
        <p>© {new Date().getFullYear()} سلسلہ عالیہ سیفیہ - تمام حقوق محفوظ ہیں</p>
        <p className="mt-1 opacity-60">بمطابق معمولات و مراقباتِ سیفیہ</p>
      </footer>
    </div>
  );
}
