/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, MapPin, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { LATAIF, MURAQABAT } from './constants';
import { PrayerTimings } from './types';

export default function App() {
  const [time, setTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimings | null>(null);
  const [status, setStatus] = useState('انٹرنیٹ سے نمازوں کے اوقات لائے جا رہے ہیں...');
  const [statusColor, setStatusColor] = useState('text-yellow-400');
  const [expandedMuraqaba, setExpandedMuraqaba] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchPrayerTimes() {
      try {
        // Defaulting to Gujar Khan as in original code
        const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Gujar%20Khan&country=Pakistan&method=1&school=1');
        const data = await res.json();
        if (data.data && data.data.timings) {
          setPrayerTimes(data.data.timings);
          setStatus('🟢 لائیو آٹو اپڈیٹ (گوجرخان - حنفی)');
          setStatusColor('text-green-400');
        }
      } catch (e) {
        setStatus('🔴 آف لائن (انٹرنیٹ درکار ہے)');
        setStatusColor('text-red-400');
      }
    }
    fetchPrayerTimes();
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
      {/* Main Header */}
      <header className="w-full bg-gradient-to-br from-black/80 to-[#D4AF37]/15 border-b-4 border-[#D4AF37] rounded-b-[30px] py-8 px-4 text-center shadow-2xl mb-4">
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
        <section className="bg-black/50 p-4 rounded-2xl border border-[#D4AF37]/30 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-lg mb-1">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            <span>{time.toLocaleDateString('ur-PK', dateOptions)}</span>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-[#ffdd57] font-mono tracking-widest mb-2" dir="ltr">
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div className={`text-sm flex items-center justify-center gap-1 ${statusColor}`}>
            <MapPin className="w-4 h-4" />
            {status}
          </div>
        </section>

        {/* Prayer Times */}
        <section>
          <h2 className="text-3xl text-[#D4AF37] text-center border-b-2 border-dashed border-[#D4AF37] pb-2 mb-4 font-bold">
            اوقاتِ نماز (فقہ حنفی)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                {prayerTimes ? `${formatAMPM(addMinutes(prayerTimes.Sunrise, 20))} کے بعد` : '--:--'}
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
            ساتوں لطائف مکمل ہونے کے بعد سالک کو <strong>"لا إله إلا الله"</strong> کے ذکرِ نفی اثبات کی تلقین کی جاتی ہے۔ طاق عدد پر حبسِ نفس (سانس روک کر) ذکر کیا جاتا ہے:
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
                      <span className="text-[#ffdd57] font-bold">پہلا سبق (کلمہ ھُو):</span>
                      <p className="text-lg leading-relaxed mt-1">کلمہ "ھُو" کو آپ روح سے شروع کریں روح سے قلب اور قلب سے سرّ، سرّ سے اخفیٰ، اخفیٰ سے خفی اور پھر روح تک ایک گول دائرہ کی شکل میں گھماتے جائیں اور اس کو ایک تلوار فرض کریں...</p>
                    </li>
                    <li>
                      <span className="text-[#ffdd57] font-bold">دوسرا سبق (اللّٰه ھُو):</span>
                      <p className="text-lg leading-relaxed mt-1">کلمہ "اللّٰه" کا تصور قلب پر اور کلمہ "ھُو" کا تصور روح پر کریں اور زبان سے بھی ادا کرتے رہیں۔</p>
                    </li>
                    <li>
                      <span className="text-[#ffdd57] font-bold">تیسرا سبق (ھُو اللّٰه):</span>
                      <p className="text-lg leading-relaxed mt-1">کلمہ "ھُو" کا تصور روح پر اور کلمہ "اللّٰه" کا تصور قلب پر اور زبان سے بھی ادا کریں۔</p>
                    </li>
                    <li>
                      <span className="text-[#ffdd57] font-bold">چوتھا سبق:</span>
                      <div className="text-center my-3">
                        <span className="font-amiri text-[#ffdd57] text-2xl">انت الهادى انت الحق ليس الهادى الا هو</span>
                      </div>
                      <p className="text-lg leading-relaxed">طریقہ: "اَنْتَ الْھَادِی اَنْتَ" کا تصور قلب پر اور "الْحَقُّ" کا تصور اخفیٰ پر... "لَیْسَ الْھَادِیْ" کو اخفیٰ سے واپس شروع کر کے "اِلَّا" کو قلب پر اور "ھُو" کو روح پر اور ساتھ ساتھ زبان سے بھی پڑھنا ہے۔</p>
                    </li>
                    <li className="bg-[#D4AF37]/10 p-3 rounded-lg border border-[#D4AF37]/30">
                      <span className="text-[#ffdd57] font-bold">مراقبہ چشتیہ:</span>
                      <p className="text-lg leading-relaxed mt-1">5 منٹ یا 4 رکعت نماز کی مقدار سانس بند کر کے قلب میں اللہ اللہ کہنا ہے۔</p>
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
                      <span className="text-[#ffdd57] font-bold">پہلا سبق (نفی اثبات):</span>
                      <p className="text-lg leading-relaxed mt-1">سب سے پہلے سانس بند کریں... ترتیب یہ ہے کہ کلمہ "لا" کو قلب سے لے کر دائیں کندھے تک لے جائیں اور "اِلٰہ" کو قالبی پر اور "اِلَّا اللّٰہ" کی ضرب پوری شدت سے قلب پر لگائیں... "لَا مَعْبُوْدَ اِلَّا اللّٰہ، لَا مَقْصُوْدَ اِلَّا اللّٰہ، لَا مَطْلُوْبَ اِلَّا اللّٰہ، لَا مَوْجُوْدَ اِلَّا اللّٰہ" کے تصور کے ساتھ 100 دفعہ پڑھنے کے بعد ایک دفعہ "مُحَمَّدُ رَّسُوْلُ اللّٰہ ﷺ" کہیں۔ تعداد 1000 ہزار ہے۔</p>
                    </li>
                    <li>
                      <span className="text-[#ffdd57] font-bold">دوسرا سبق (اِلَّا اللّٰہ):</span>
                      <p className="text-lg leading-relaxed mt-1">پہلے کی طرح ہے "لَا اِلٰہ اِلَّا اللّٰہ" ایک بار پڑھ کر شروع کریں، پھر "اِلَّا اللّٰہ" کی ضرب قلب پر لگاتے جائیں۔ 100 کے بعد محمد رسول اللہ ﷺ... تعداد 1000۔</p>
                    </li>
                    <li>
                      <span className="text-[#ffdd57] font-bold">تیسرا سبق (اسم ذات اللّٰہ):</span>
                      <p className="text-lg leading-relaxed mt-1">قلب پر، پہلی دفعہ "اللّٰہ جَلَّ جَلَالُہٗ" پھر "اللّٰہ" 100 بار پڑھ کر رکنے کے بعد "جَلَّ جَلَالُہٗ" زبان سے بھی کہنا ہے... تعداد 1000۔</p>
                    </li>
                    <li>
                      <span className="text-[#ffdd57] font-bold">چوتھا سبق (ھُو):</span>
                      <p className="text-lg leading-relaxed mt-1">"ھُو" روح سے، قلب سے سرّ، سرّ سے اخفیٰ، اخفیٰ سے خفی سے دوبارہ روح پر لانا ہے۔ زبان سے بھی کہنا ہے... تعداد 1000۔</p>
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

      <footer className="mt-10 text-gray-400 text-center text-sm px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Info className="w-4 h-4" />
          <span>یہ ایپ سلسلہ عالیہ سیفیہ کے معمولات کو عام کرنے کے لیے بنائی گئی ہے۔</span>
        </div>
        <p>© {new Date().getFullYear()} سلسلہ سیفیہ - تمام حقوق محفوظ ہیں</p>
      </footer>
    </div>
  );
}
