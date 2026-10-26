import Link from "next/link";
import { createLandingPage } from "./actions";

const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const labelClass = "block text-sm font-bold text-slate-800";

export default function NewLandingPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error;

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-blue-600">← العودة إلى لوحة التحكم</Link>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
          <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">صفحة جديدة</div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">أنشئ صفحة نشاطك التجاري</h1>
          <p className="mt-3 leading-7 text-slate-500">أضف معلومات المحل وروابط التواصل، وسننشئ لك صفحة قابلة للمشاركة.</p>

          {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error === "trial" ? "حسابك التجريبي يسمح بالمشاهدة فقط لمدة 3 أيام. لفتح إنشاء الصفحات، تواصل مع الإدارة بعد الشراء." : error === "limit" ? "وصلت إلى الحد المسموح به من الصفحات في حسابك. تواصل مع الإدارة لزيادة العدد." : error === "name" ? "اسم النشاط مطلوب ويجب ألا يتجاوز 100 حرف." : error === "length" ? "تحقق من أطوال النصوص وأرقام الهاتف." : "تعذر حفظ الصفحة. تأكد أنك نفذت ملفات SQL في Supabase ثم حاول مجددًا."}
          </p>}

          {error === "trial" ? <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">العودة إلى لوحة التحكم</Link> : <form action={createLandingPage} className="mt-8 space-y-6">
            <section className="space-y-4">
              <h2 className="border-b border-slate-100 pb-3 text-lg font-extrabold">معلومات النشاط</h2>
              <div>
                <label className={labelClass} htmlFor="business_name">اسم المحل أو النشاط *</label>
                <input className={inputClass} id="business_name" name="business_name" required maxLength={100} placeholder="مثال: متجر الأناقة" />
              </div>
              <div>
                <label className={labelClass} htmlFor="headline">عنوان الصفحة</label>
                <input className={inputClass} id="headline" name="headline" maxLength={140} placeholder="كل ما تحتاجه في مكان واحد" />
              </div>
              <div>
                <label className={labelClass} htmlFor="description">وصف قصير</label>
                <textarea className={inputClass} id="description" name="description" rows={3} maxLength={1000} placeholder="عرّف الزبائن بنشاطك أو منتجاتك..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelClass} htmlFor="template">القالب الجاهز</label>
                  <select className={inputClass} id="template" name="template" defaultValue="aurora">
                    <option value="aurora">Aurora — عصري متدرج</option><option value="store">Store — متجر إلكتروني</option><option value="minimal">Minimal — بسيط وراقي</option><option value="bold">Bold — جريء</option><option value="beauty">Beauty — جمال وعناية</option><option value="agency">Agency — خدمات وشركات</option><option value="restaurant">Restaurant — مطاعم ومقاهي</option><option value="portfolio">Portfolio — أعمال شخصية</option>
                  </select>
                </div>
                <div><label className={labelClass} htmlFor="theme">ثيم الألوان</label>
                  <select className={inputClass} id="theme" name="theme" defaultValue="violet">
                    <option value="violet">بنفسجي</option><option value="ocean">أزرق</option><option value="sunset">غروب</option><option value="emerald">أخضر</option><option value="rose">وردي</option><option value="midnight">ليلي</option><option value="gold">ذهبي</option><option value="mint">نعناعي</option><option value="berry">توتي</option><option value="slate">رمادي</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="logo_url">رابط صورة المحل أو الشعار</label>
                <input className={inputClass} id="logo_url" name="logo_url" type="url" placeholder="https://example.com/logo.jpg" />
                <p className="mt-2 text-xs text-slate-500">حاليًا أضف رابط صورة مباشر؛ رفع الصور من الجهاز نضيفه لاحقًا.</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="border-b border-slate-100 pb-3 text-lg font-extrabold">التواصل</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="phone">رقم الهاتف</label>
                  <input className={inputClass} id="phone" name="phone" type="tel" maxLength={30} dir="ltr" placeholder="+213..." />
                </div>
                <div>
                  <label className={labelClass} htmlFor="whatsapp">رقم WhatsApp</label>
                  <input className={inputClass} id="whatsapp" name="whatsapp" type="tel" maxLength={30} dir="ltr" placeholder="+213..." />
                </div>
                <div>
                  <label className={labelClass} htmlFor="instagram_url">Instagram</label>
                  <input className={inputClass} id="instagram_url" name="instagram_url" type="url" placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label className={labelClass} htmlFor="facebook_url">Facebook</label>
                  <input className={inputClass} id="facebook_url" name="facebook_url" type="url" placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label className={labelClass} htmlFor="tiktok_url">TikTok</label>
                  <input className={inputClass} id="tiktok_url" name="tiktok_url" type="url" placeholder="https://tiktok.com/@..." />
                </div>
                <div>
                  <label className={labelClass} htmlFor="youtube_url">YouTube</label>
                  <input className={inputClass} id="youtube_url" name="youtube_url" type="url" placeholder="https://youtube.com/..." />
                </div>
              </div>
              <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="custom_label">منصة أخرى (اختياري)</label>
                  <input className={inputClass} id="custom_label" name="custom_label" maxLength={40} placeholder="مثال: Telegram أو موقع المتجر" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="custom_url">رابط المنصة الأخرى</label>
                  <input className={inputClass} id="custom_url" name="custom_url" type="url" placeholder="https://..." />
                </div>
              </div>
            </section>

            <button type="submit" className="w-full rounded-xl bg-blue-600 px-5 py-4 font-extrabold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-200">
              إنشاء الصفحة
            </button>
          </form>}
        </div>
      </div>
    </main>
  );
}
