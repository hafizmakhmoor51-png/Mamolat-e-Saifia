/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, ChevronDown, ChevronUp, Info, Calendar as CalendarIcon } from 'lucide-react';
import { LATAIF, MURAQABAT } from './constants';
import { PrayerTimings } from './types';

export default function App() {
  const [time, setTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimings | null>(null);
  const [status, setStatus] = useState('انٹرنیٹ سے سٹینڈرڈ ٹائم لایا جا رہا ہے...');
  const [statusColor, setStatusColor] = useState('text-green-400');
  const [location, setLocation] = useState('📍 لوکیشن تلاش کی جا رہی ہے...');
  const [expandedMuraqaba, setExpandedMuraqaba] = useState<number | null>(null);
  const [timezone, setTimezone] = useState('Asia/Karachi');
  const [globalOffset, setGlobalOffset] = useState(0);

  // Time Sync Logic
  useEffect(() => {
    async function syncTime() {
      try {
        // Primary: TimeAPI.io - Fetching UTC to avoid double-offset issues
        const res = await fetch(`https://timeapi.io/api/Time/current/zone?timeZone=UTC`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        // Ensure it's treated as UTC by appending 'Z'
        const serverTime = new Date(data.dateTime + "Z").getTime();
        setGlobalOffset(serverTime - Date.now());
        setStatus(`🟢 لائیو سٹینڈرڈ ٹائم (${timezone})`);
      } catch (e) {
        try {
          // Backup: WorldTimeAPI - Using UTC
          const res = await fetch(`https://worldtimeapi.org/api/timezone/Etc/UTC`);
          if (!res.ok) throw new Error();
          const data = await res.json();
          const serverTime = new Date(data.datetime).getTime();
          setGlobalOffset(serverTime - Date.now());
          setStatus('🟢 لائیو سٹینڈرڈ ٹائم (بیک اپ)');
        } catch (e2) {
          try {
            // Backup 2: GitHub API (for Date header)
            const res = await fetch('https://api.github.com/');
            const serverDate = res.headers.get('Date');
            if (!serverDate) throw new Error();
            const serverTime = new Date(serverDate).getTime();
            setGlobalOffset(serverTime - Date.now());
            setStatus('🟢 لائیو انٹرنیشنل ٹائم');
          } catch (e3) {
            setStatus('🔴 ڈیوائس ٹائم (انٹرنیٹ کنیکٹ کریں)');
            setStatusColor('text-red-400');
          }
        }
      }
    }
    syncTime();
  }, [timezone]);

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date(Date.now() + globalOffset));
    }, 1000);
    return () => clearInterval(timer);
  }, [globalOffset]);

  // Location and Prayer Times Logic
  const initLocationAndPrayers = async () => {
    let lat = 33.2612; // Default Gujar Khan
    let lon = 73.3058;
    let city = "گوجرخان";
    let country = "پاکستان";

    try {
      const ipRes = await fetch('https://ipwho.is/');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        lat = ipData.latitude || lat;
        lon = ipData.longitude || lon;
        city = ipData.city || city;
        country = ipData.country || country;
        if (ipData.timezone && ipData.timezone.id) {
          setTimezone(ipData.timezone.id);
        }
      }
    } catch (e) {
      console.log("Location fetch failed, using defaults.");
    }

    setLocation(`📍 لوکیشن: ${city}، ${country}`);

    try {
      const prayerRes = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=1&school=1`);
      const pData = await prayerRes.json();
      if (pData.data && pData.data.timings) {
        setPrayerTimes(pData.data.timings);
      }
    } catch (e) {
      console.log("Prayer times fetch failed.");
    }
  };

  useEffect(() => {
    initLocationAndPrayers();
  }, []);

  const formatAMPM = (timeStr: string) => {
    if (!timeStr) return '--:--';
    let [h, m] = timeStr.split(':');
    let hours = parseInt(h);
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${m} ${ampm}`;
  };

  const addMinutes = (timeStr: string, mins: number) => {
    if (!timeStr) return '--:--';
    let [h, m] = timeStr.split(':');
    let d = new Date();
    d.setHours(parseInt(h), parseInt(m), 0);
    d.setMinutes(d.getMinutes() + mins);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };

  return (
    <div className="flex flex-col items-center min-h-screen pb-10 overflow-x-hidden" dir="rtl">
      {/* Header */}
      <header className="w-full bg-gradient-to-br from-black/80 to-[#D4AF37]/15 border-b-3 border-[#D4AF37] rounded-b-[30px] py-8 px-4 text-center shadow-2xl mb-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#D4AF37] text-5xl md:text-6xl font-amiri mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]"
        >
          سلسلہ سیفیہ
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="inline-block bg-white/10 px-6 py-1.5 rounded-full text-gray-200 text-lg tracking-wider"
        >
          نقشبندیہ • چشتیہ • قادریہ • سہروردیہ
        </motion.div>
      </header>

      <main className="w-[95%] max-w-2xl flex flex-col gap-6">
        {/* Status Box */}
        <section className="bg-black/50 p-4 rounded-2xl border border-[#D4AF37] text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <button 
              onClick={() => {
                setStatus('انٹرنیٹ سے سٹینڈرڈ ٹائم لایا جا رہا ہے...');
                initLocationAndPrayers();
                // Re-trigger time sync by re-mounting or calling it
                window.location.reload(); // Simplest way to re-trigger all syncs
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="ریفریش"
            >
              <motion.div whileTap={{ rotate: 360 }}>
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
              </motion.div>
            </button>
          </div>
          <div className="inline-block bg-[#D4AF37]/20 text-[#ffdd57] px-4 py-1 rounded-full text-lg mb-3 border border-[#D4AF37]/50">
            {location}
          </div>
          <div className="flex items-center justify-center gap-2 text-lg mb-1 text-gray-200">
            <CalendarIcon className="w-5 h-5 text-[#D4AF37]" />
            <span>{time.toLocaleDateString('ur-PK', { timeZone: timezone, ...dateOptions })}</span>
          </div>
          <div className="text-4xl md:text-5xl font-bold text-white font-mono tracking-widest mb-2" dir="ltr">
            {time.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div className={`text-sm flex items-center justify-center gap-1 ${statusColor}`}>
            {status}
          </div>
        </section>

        {/* Prayer Times */}
        <section>
          <h2 className="text-3xl text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-2 mb-4 font-bold">
            اوقاتِ نماز (فقہ حنفی)
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: 'فجر', time: prayerTimes?.Fajr },
              { name: 'طلوع آفتاب', time: prayerTimes?.Sunrise },
              { name: 'ظہر', time: prayerTimes?.Dhuhr },
              { name: 'عصر (حنفی)', time: prayerTimes?.Asr },
              { name: 'مغرب', time: prayerTimes?.Maghrib },
              { name: 'عشاء', time: prayerTimes?.Isha },
            ].map((p, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.02 }}
                className="bg-black/60 border border-[#D4AF37] rounded-xl p-3 text-center shadow-md"
              >
                <span className="block text-[#f1c40f] text-xl mb-1">{p.name}</span>
                <span className="block text-white text-lg font-mono" dir="ltr">
                  {p.time ? formatAMPM(p.time) : '--:--'}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Nawafil */}
        <section>
          <h2 className="text-3xl text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-2 mb-4 font-bold">
            اوقاتِ نوافل
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#D4AF37]/10 border border-[#ffdd57] rounded-xl p-3 text-center shadow-md">
              <span className="block text-[#f1c40f] text-xl mb-1">تہجد</span>
              <span className="block text-white text-sm">عشاء سے فجر تک</span>
            </div>
            <div className="bg-[#D4AF37]/10 border border-[#ffdd57] rounded-xl p-3 text-center shadow-md">
              <span className="block text-[#f1c40f] text-xl mb-1">اشراق</span>
              <span className="block text-white text-sm" dir="ltr">
                {prayerTimes ? `${formatAMPM(addMinutes(prayerTimes.Sunrise, 15))} کے بعد` : '--:--'}
              </span>
            </div>
            <div className="bg-[#D4AF37]/10 border border-[#ffdd57] rounded-xl p-3 text-center shadow-md">
              <span className="block text-[#f1c40f] text-xl mb-1">چاشت</span>
              <span className="block text-white text-sm" dir="ltr">
                {prayerTimes ? `${formatAMPM(addMinutes(prayerTimes.Sunrise, 45))} تا ${formatAMPM(addMinutes(prayerTimes.Dhuhr, -15))}` : '--:--'}
              </span>
            </div>
          </div>
        </section>

        {/* Lataif */}
        <section>
          <h2 className="text-3xl text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-2 mb-4 font-bold mt-8">
            اسباق طریقہ عالیہ نقشبندیہ
          </h2>
          <div className="flex flex-col gap-3">
            {LATAIF.map((l) => (
              <motion.div 
                key={l.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`bg-black/70 rounded-2xl p-4 flex items-center shadow-xl border-r-8 ${l.borderColor} ${l.glowColor}`}
              >
                <div className="text-4xl ml-4">{l.icon}</div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-white mb-0.5">{l.name}</div>
                  <span className="text-sm text-gray-400 block mb-1">رنگ: {l.color} | {l.location}</span>
                  <div className="text-lg text-[#D4AF37]">{l.prophet}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Nafi Isbat */}
        <section className="bg-black/70 border border-[#D4AF37] rounded-2xl p-6 shadow-2xl">
          <h3 className="text-[#ffdd57] text-3xl text-center font-amiri mb-4">طریقہ و نیت ذکرِ نفی اثبات</h3>
          <p className="text-lg leading-relaxed text-justify mb-4">
            ساتوں لطائف مکمل ہونے کے بعد سالک کو <strong>"لا إله إلا الله"</strong> کے ذکرِ نفی اثبات کی تلقین کی جاتی ہے۔ اس میں طاق عدد پر حبسِ نفس (سانس روک کر) ذکر کیا جاتا ہے:
          </p>
          
          <ul className="space-y-4 mb-6">
            {[
              { label: 'حبسِ نفس', text: 'زبان کو تالو سے لگا کر سانس کو ناف کے نیچے روک لیں۔' },
              { label: 'لا (نفی)', text: "خیال کریں کہ 'لا' کو ناف سے کھینچ کر دماغ تک لے گئے۔" },
              { label: 'إله', text: 'دماغ سے کھینچ کر دائیں کندھے تک لائے۔' },
              { label: 'إلا الله (اثبات)', text: 'دائیں کندھے سے پوری قوت کے ساتھ لطیفہ قلب (دل) پر ضرب لگائیں۔' },
            ].map((step, i) => (
              <li key={i} className="flex gap-2 text-lg leading-relaxed">
                <span className="text-[#ffdd57] text-2xl leading-none">•</span>
                <span><span className="text-[#ffdd57] font-bold">{step.label}:</span> {step.text}</span>
              </li>
            ))}
          </ul>

          <div className="bg-[#D4AF37]/15 p-5 rounded-xl border border-dashed border-[#D4AF37] text-center">
            <span className="text-[#D4AF37] font-bold block mb-3 text-lg">قلب پر ضرب لگاتے وقت یہ مبارک دعا (نیت) پڑھیں:</span>
            <span className="text-3xl md:text-4xl text-white font-amiri leading-loose drop-shadow-lg">
              "إِلٰهِي أَنْتَ مَقْصُودِيْ وَرِضَاكَ مَطْلُوبِيْ، أَعْطِنِيْ مَحَبَّةَ ذَاتِكَ وَمَعْرِفَةَ صِفَاتِكَ"
            </span>
          </div>
        </section>

        {/* Muraqabat */}
        <section>
          <h2 className="text-3xl text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-2 mb-2 font-bold">
            معمولاتِ سیفیہ: 36 مراقبات
          </h2>
          <p className="text-center text-gray-300 text-lg mb-4">کسی بھی مراقبے پر کلک کریں تاکہ اس کی پوری نیت ظاہر ہو۔</p>
          
          <div className="flex flex-col gap-3">
            {MURAQABAT.map((m, i) => (
              <div key={i} className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden shadow-lg">
                <button 
                  onClick={() => setExpandedMuraqaba(expandedMuraqaba === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 transition-colors text-right"
                >
                  <span className="text-xl font-bold text-[#ffdd57]">{m.title}</span>
                  {expandedMuraqaba === i ? <ChevronUp className="text-[#D4AF37]" /> : <ChevronDown className="text-[#D4AF37]" />}
                </button>
                <AnimatePresence>
                  {expandedMuraqaba === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-black/50 border-t border-dashed border-[#D4AF37]/40"
                    >
                      <div className="p-5 text-xl leading-relaxed text-justify">
                        <span className="text-[#D4AF37] font-bold block mb-2">فارسی نیت:</span>
                        {m.text}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Other Silsilas */}
        <section>
          <h2 className="text-3xl text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-2 mb-4 font-bold mt-8">
            دیگر سلاسل کے اسباق
          </h2>
          <div className="flex flex-col gap-4">
            {/* Chishtia */}
            <div className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden shadow-lg">
              <details className="group">
                <summary className="flex items-center justify-between p-4 bg-[#D4AF37]/15 cursor-pointer list-none">
                  <span className="text-xl font-bold text-[#ffdd57]">اسباق طریقہ عالیہ چشتیہ</span>
                  <ChevronDown className="text-[#D4AF37] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-5 bg-black/50 border-t border-dashed border-[#D4AF37]/40">
                  <p className="text-[#ffdd57] font-bold mb-3">طریقہ معمولاتِ سیفیہ (بغیر پاس انفاس):</p>
                  <ul className="space-y-4">
                    <li>
                      <span className="text-[#ffdd57] font-bold">ذکرِ جہر مع ضرب:</span>
                      <p className="text-lg leading-relaxed mt-1">قلب سے <strong>"لا إله"</strong> کھینچ کر دائیں کندھے پر لاتے ہیں، پھر سر پر لے جاتے ہیں، اور وہاں سے <strong>"إلا الله"</strong> کی ضرب پوری قوت سے دوبارہ دل (قلب) پر لگاتے ہیں۔</p>
                    </li>
                    <li className="bg-[#D4AF37]/10 p-3 rounded-lg border border-[#D4AF37]/30">
                      <span className="text-[#ffdd57] font-bold">مراقبہ چشتیہ:</span>
                      <p className="mt-2"><span className="text-[#D4AF37] font-bold">نیت:</span> <em>"فیض می آید از ذاتِ بے چوں بلطیفہ قلب من، بواسطہ پیرانِ کبار، خصوصاً حضرت خواجہ معین الدین حسن چشتی اجمیریؒ"</em></p>
                    </li>
                  </ul>
                </div>
              </details>
            </div>

            {/* Qadria */}
            <div className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden shadow-lg">
              <details className="group">
                <summary className="flex items-center justify-between p-4 bg-[#D4AF37]/15 cursor-pointer list-none">
                  <span className="text-xl font-bold text-[#ffdd57]">اسباق طریقہ عالیہ قادریہ</span>
                  <ChevronDown className="text-[#D4AF37] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-5 bg-black/50 border-t border-dashed border-[#D4AF37]/40">
                  <p className="text-[#ffdd57] font-bold mb-3">کتاب معمولاتِ سیفیہ کے مطابق:</p>
                  <ul className="space-y-4">
                    <li>
                      <span className="text-[#ffdd57] font-bold">پہلا سبق (ذکر الا اللہ):</span>
                      <p className="text-lg leading-relaxed mt-1">پہلے ایک بار <strong>"لا إله إلا الله"</strong> کہیں، پھر 100 مرتبہ <strong>"إلا الله"</strong> کہیں، اور پھر <strong>"محمد رسول الله ﷺ"</strong> پڑھیں۔ اس ترتیب سے 1000 مرتبہ مکمل کریں۔</p>
                    </li>
                    <li>
                      <span className="text-[#ffdd57] font-bold">دوسرا سبق (ذکر جل جلالہ):</span>
                      <p className="text-lg leading-relaxed mt-1">پہلے ایک مرتبہ <strong>"الله جل جلاله"</strong> کہیں، پھر <strong>"جل جلاله"</strong> کی تکرار کریں۔ اسے بھی 1000 مرتبہ مکمل کریں۔</p>
                    </li>
                    <li>
                      <span className="text-[#ffdd57] font-bold">تیسرا سبق (ذکر ھُو):</span>
                      <p className="text-lg leading-relaxed mt-1"><strong>"ھُو"</strong> کا ذکر، جو لطیفہ روح سے شروع ہو کر سر، خفی سے ہوتا ہوا لطیفہ اخفیٰ تک آتا ہے۔ 1000 مرتبہ۔</p>
                    </li>
                    <li className="bg-[#D4AF37]/10 p-3 rounded-lg border border-[#D4AF37]/30">
                      <span className="text-[#ffdd57] font-bold">مراقبہ قادریہ:</span>
                      <p className="text-lg leading-relaxed mt-1">5 منٹ سانس بند کر کے۔</p>
                      <p className="mt-2"><span className="text-[#D4AF37] font-bold">نیت:</span> <em>"فیض می آید از ذاتِ بے چوں بلطیفہ قلب من، بواسطہ پیرانِ کبار، خصوصاً محبوب سبحانی سید شیخ عبدالقادر جیلانیؒ"</em></p>
                    </li>
                  </ul>
                </div>
              </details>
            </div>

            {/* Suhrawardia */}
            <div className="bg-black/60 border border-[#D4AF37] rounded-xl overflow-hidden shadow-lg">
              <details className="group">
                <summary className="flex items-center justify-between p-4 bg-[#D4AF37]/15 cursor-pointer list-none">
                  <span className="text-xl font-bold text-[#ffdd57]">اسباق طریقہ عالیہ سہروردیہ</span>
                  <ChevronDown className="text-[#D4AF37] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-5 bg-black/50 border-t border-dashed border-[#D4AF37]/40">
                  <p className="text-[#ffdd57] font-bold mb-3">معمولات سیفیہ کی ہدایات:</p>
                  <ul className="space-y-4">
                    <li>
                      <span className="text-[#ffdd57] font-bold">طریقہ کار:</span>
                      <p className="text-lg leading-relaxed mt-1">اس سلسلہ عالیہ کے اسباق بعینہٖ طریقہ قادریہ کی طرح ہیں، ترتیب بھی وہی ہے۔</p>
                    </li>
                    <li>
                      <span className="text-[#ffdd57] font-bold">فرق:</span>
                      <p className="text-lg leading-relaxed mt-1">قادریہ شریف کا مراقبہ پانچ منٹ کا ہے جبکہ سہروردیہ کا مراقبہ کم از کم بیس منٹ ہے اور اکثر زیادہ کی کوئی حد نہیں۔ نیز اس مراقبہ میں آنکھیں بند کر کے بیٹھیں (سانس بند کرنا یعنی حبسِ نفس شرط نہیں ہے)۔</p>
                    </li>
                    <li className="bg-[#D4AF37]/10 p-3 rounded-lg border border-[#D4AF37]/30">
                      <span className="text-[#ffdd57] font-bold">مراقبہ سہروردیہ:</span>
                      <p className="mt-2"><span className="text-[#D4AF37] font-bold">نیت:</span> <em>"فیض می آید از ذاتِ بے چوں بلطیفہ قلب من، بواسطہ پیرانِ کبار، خصوصاً حضرت شیخ شہاب الدین سہروردیؒ"</em></p>
                    </li>
                  </ul>
                </div>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-10 text-gray-400 text-center text-sm px-4 pb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Info className="w-4 h-4 text-[#D4AF37]" />
          <span>یہ ایپ سلسلہ عالیہ سیفیہ کے معمولات کو عام کرنے کے لیے بنائی گئی ہے۔</span>
        </div>
        <p dir="ltr">© {new Date().getFullYear()} Silsila Saifia - All Rights Reserved</p>
      </footer>
    </div>
  );
}
