import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import SharePageButton from "@/components/SharePageButton";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ created?: string; editError?: string; readOnly?: string; vipCreated?: string; vipError?: string; vipUpdated?: string; vipEditError?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("username, display_name").eq("id", user.id).maybeSingle();
  const { data: pages, error: pagesError } = await supabase.from("landing_pages")
    .select("id, slug, business_name, headline, is_published, created_at, template")
    .eq("user_id", user.id).order("created_at", { ascending: false });
  const { data: accessPlan } = await supabase.from("user_access_plans").select("plan_type, expires_at, advanced_features").eq("user_id", user.id).maybeSingle();
  const planActive = !!accessPlan && (!accessPlan.expires_at || new Date(accessPlan.expires_at).getTime() > Date.now());
  const canManagePages = planActive;
  const isTrial = accessPlan?.plan_type === "trial";
  const canCreateVIP = planActive && (isTrial || accessPlan?.plan_type === "vip");
  const planLabel = !planActive ? "انتهت التجربة — يلزم تفعيل الحساب" : isTrial ? "تجربة مجانية" : accessPlan?.plan_type === "vip" ? "عميل VIP" : "عميل مميز";
  const { data: pageTypeLimit, error: pageTypeLimitError } = await supabase.from("user_page_type_limits").select("normal_max_pages,vip_max_pages").eq("user_id", user.id).maybeSingle();
  const maxPages = !planActive || pageTypeLimitError ? 0 : isTrial ? 1 : pageTypeLimit?.normal_max_pages ?? 1;
  const maxVIPPages = !planActive || pageTypeLimitError || (!isTrial && accessPlan?.plan_type !== "vip") ? 0 : isTrial ? 1 : pageTypeLimit?.vip_max_pages ?? 1;
  const pageCount = pages?.length ?? 0;
  const normalPageCount = (pages || []).filter((page) => page.template !== "vip").length;
  const vipPageCount = (pages || []).filter((page) => page.template === "vip").length;
  const atPageLimit = normalPageCount >= maxPages;
  const atVIPPageLimit = vipPageCount >= maxVIPPages;
  const pageIds = (pages || []).map((page) => page.id);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const { data: events } = pageIds.length ? await supabase.from("landing_page_events").select("event_type, created_at, page_id").in("page_id", pageIds).gte("created_at", sevenDaysAgo.toISOString()) : { data: [] as { event_type: string; created_at?: string; page_id?: string }[] };
  const totalViews = events?.filter((event) => event.event_type === "view").length ?? 0;
  const totalClicks = events?.filter((event) => event.event_type === "contact_click").length ?? 0;
  const publishedCount = pages?.filter((page) => page.is_published).length ?? 0;
  const draftCount = pageCount - publishedCount;
  const weeklyStats = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + index);
    const key = date.toLocaleDateString("en-CA");
    const dayEvents = (events || []).filter((event) => event.created_at && new Date(event.created_at).toLocaleDateString("en-CA") === key);
    return {
      label: date.toLocaleDateString("ar-DZ", { weekday: "short" }),
      views: dayEvents.filter((event) => event.event_type === "view").length,
      clicks: dayEvents.filter((event) => event.event_type === "contact_click").length,
    };
  });
  const weeklyMax = Math.max(1, ...weeklyStats.map((day) => day.views + day.clicks));
  const topClickedPages = (pages || []).map((page) => ({
    id: page.id,
    name: page.business_name || page.slug,
    slug: page.slug,
    template: page.template,
    clicks: (events || []).filter((event) => event.page_id === page.id && event.event_type === "contact_click").length,
  })).filter((page) => page.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 5);

  return <>
    <Header />
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div><p className="text-sm font-bold text-blue-600 dark:text-blue-400">مساحة العمل الخاصة بك</p><h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">أهلًا {profile?.display_name || "بك"} 👋</h1><p className="mt-2 text-slate-500 dark:text-slate-400">أنشئ صفحات نشاطك التجاري وصمّمها من مكان واحد.</p></div>
          <div className="flex flex-wrap items-center gap-3">{canManagePages && !atPageLimit ? <Link href="/pages/new" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-extrabold text-white shadow-sm transition hover:bg-blue-700"><span className="ml-2 text-xl">+</span> إنشاء بطاقة</Link> : <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">وصلت للحد المسموح</span>}{canCreateVIP && !atVIPPageLimit && <Link href="/vip/new" className="inline-flex items-center justify-center rounded-xl border border-amber-400 bg-[#2D1E14] px-5 py-3 font-extrabold text-[#C9A86A] shadow-sm transition hover:bg-[#3b281b]"><span className="ml-2 text-xl">✦</span> إنشاء بطاقة <span className="mr-2 rounded-full border border-amber-300/60 bg-amber-400/15 px-2 py-1 text-[10px] font-black tracking-wider text-amber-300">VIP</span></Link>}</div>
        </div>
        {params.created === "1" && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">تم إنشاء صفحتك بنجاح!</div>}
        {params.vipCreated === "1" && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-900">تم إنشاء بطاقة VIP بنجاح!</div>}{params.vipUpdated === "1" && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">تم حفظ تعديلات بطاقة VIP بنجاح.</div>}{params.vipEditError === "1" && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">تعذر حفظ تعديلات بطاقة VIP. حاول مرة أخرى.</div>}
        {params.vipError === "plan" && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-900">بطاقة VIP متاحة في التجربة المجانية ولعملاء VIP.</div>}
        {params.vipError === "limit" && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-900">وصلت إلى الحد المسموح به من البطاقات والصفحات.</div>}
        {params.readOnly === "1" && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">انتهت التجربة المجانية. اشترِ منتجًا من متجرنا أو تواصل معنا عبر واتساب لتفعيل حسابك.</div>}
        {params.editError && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">تعذر تعديل الصفحة. تأكد من تشغيل تحديث قاعدة البيانات في Supabase.</div>}
        <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950"><p className="font-extrabold text-blue-900 dark:text-blue-100">نوع العضوية: {planLabel}</p><p className="mt-1 text-sm text-blue-800 dark:text-blue-200">{canManagePages ? isTrial ? `التجربة تنتهي: ${new Date(accessPlan!.expires_at!).toLocaleString("ar-DZ")} · بطاقة عادية ${normalPageCount}/1 · بطاقة VIP ${vipPageCount}/1.` : pageTypeLimitError ? "تعذر تحميل حدود البطاقات. تواصل مع الإدارة." : `البطاقات العادية: ${normalPageCount}/${maxPages} · بطاقات VIP: ${canCreateVIP ? `${vipPageCount}/${maxVIPPages}` : "غير متاحة في عضويتك"}.` : "انتهت التجربة المجانية. يلزم شراء منتج وتأكيده من الإدارة لتفعيل الحساب."}</p>{!planActive && <div className="mt-4 flex flex-wrap gap-3"><Link href="/#pricing" className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-extrabold text-white">تصفح المنتجات في المتجر</Link><a href="https://wa.me/213557829036?text=السلام%20عليكم،%20أريد%20شراء%20منتج%20لتفعيل%20اشتراكي%20في%20منصة%20بطاقتي." target="_blank" rel="noopener noreferrer" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white">الشراء أو التفعيل عبر واتساب</a></div>}</section>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">صفحات الهبوط</p><p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{pageCount}<span className="mr-1 text-sm font-bold text-slate-500 dark:text-slate-400">{isTrial ? "/ 2" : "بطاقة"}</span></p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">الصفحات المنشورة</p><p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{pages?.filter((page) => page.is_published).length ?? 0}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">زيارات الصفحات</p><p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{totalViews}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">نقرات التواصل</p><p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{totalClicks}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">الحساب</p><p className="mt-2 truncate text-sm font-bold text-slate-950 dark:text-white" dir="ltr">{user.email || "غير متوفر"}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">اسم المستخدم: {profile?.username || "—"}</p></div>
        </section>
        <section className="mt-8 space-y-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-black text-slate-950 dark:text-white">إحصائيات بطاقتك</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ملخص آخر 7 أيام، يتحدّث حسب الزيارات والنقرات المسجّلة</p></div><span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700 dark:bg-blue-950 dark:text-blue-300">آخر 7 أيام</span></div>
          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-slate-500 dark:text-slate-400">مشاهدات</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-lg text-blue-600 dark:bg-blue-950">◉</span></div><p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{totalViews.toLocaleString("ar-DZ")}</p><p className="mt-1 text-xs text-slate-400">زيارات صفحاتك</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-slate-500 dark:text-slate-400">نقرات التواصل</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-lg text-emerald-600 dark:bg-emerald-950">↗</span></div><p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{totalClicks.toLocaleString("ar-DZ")}</p><p className="mt-1 text-xs text-slate-400">ضغطات الهاتف والروابط</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-slate-500 dark:text-slate-400">الصفحات المنشورة</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-lg text-violet-600 dark:bg-violet-950">▣</span></div><p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{publishedCount.toLocaleString("ar-DZ")}</p><p className="mt-1 text-xs text-slate-400">من {pageCount.toLocaleString("ar-DZ")} صفحة</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-slate-500 dark:text-slate-400">المسودات</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-lg text-amber-600 dark:bg-amber-950">◷</span></div><p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{draftCount.toLocaleString("ar-DZ")}</p><p className="mt-1 text-xs text-slate-400">صفحات غير منشورة</p></div>
          </div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-black text-slate-950 dark:text-white">حركة التفاعل خلال الأسبوع</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">مشاهدات ونقرات لكل يوم</p></div><span className="rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800">7 أيام</span></div>
              <div className="mt-6 flex h-44 items-end justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">{weeklyStats.map((day, index) => <div key={day.label + index} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="flex h-32 w-full max-w-10 items-end justify-center gap-1"><div title={`مشاهدات: ${day.views}`} className="w-2/5 rounded-t-md bg-blue-500" style={{height: `${day.views ? Math.max(5, day.views / weeklyMax * 100) : 0}%`}}/><div title={`نقرات: ${day.clicks}`} className="w-2/5 rounded-t-md bg-violet-500" style={{height: `${day.clicks ? Math.max(5, day.clicks / weeklyMax * 100) : 0}%`}}/></div><span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{day.label}</span></div>)}</div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500 dark:text-slate-400"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-blue-500"/>مشاهدات</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-violet-500"/>نقرات التواصل</span></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-black text-slate-950 dark:text-white">أكثر الروابط نقراً</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">حسب نقرات التواصل المسجّلة خلال آخر 7 أيام</p></div><span className="rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800">الأعلى تفاعلاً</span></div>
              {topClickedPages.length ? <div className="mt-5 space-y-3">{topClickedPages.map((page, index) => <div key={page.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-sm font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-800 dark:text-slate-100">{page.name}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400" dir="ltr">{page.template === "vip" ? "/vip/" : "/p/"}{page.slug}</p></div><div className="shrink-0 text-left"><p className="text-lg font-black text-slate-950 dark:text-white">{page.clicks.toLocaleString("ar-DZ")}</p><p className="text-[10px] text-slate-500 dark:text-slate-400">نقرة</p></div></div>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700"><p className="font-bold text-slate-600 dark:text-slate-300">ما كاين حتى نقرة مسجّلة بعد</p><p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">كي يضغط الزائر على رابط التواصل، راح يظهر هنا ترتيب الصفحات حسب التفاعل.</p></div>}
            </div>
          </div>
        </section>
        <section className="mt-10">
          <div className="mb-5"><h2 className="text-2xl font-black text-slate-950 dark:text-white">صفحاتي</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">عاين الصفحة، أو ادخل للمحرر لتغيير القالب والألوان والمعلومات.</p></div>
          {pagesError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">لم نتمكن من تحميل صفحاتك. تأكد من إنشاء جدول landing_pages في Supabase باستخدام ملف SQL.</div> :
          pages && pages.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{pages.map((page) => <article key={page.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-lg font-extrabold text-slate-950 dark:text-white">{page.business_name}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{page.headline || "لا يوجد عنوان فرعي"}</p></div><span className={page.is_published ? "shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"}>{page.is_published ? "منشورة" : "مسودة"}</span></div>
            <p className="mt-4 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300" dir="ltr">{page.template === "vip" ? "/vip/" : "/p/"}{page.slug}</p>
            <div className="mt-4 flex flex-wrap gap-2"><Link href={`${page.template === "vip" ? "/vip/" : "/p/"}${page.slug}`} target="_blank" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 dark:bg-slate-700">معاينة الصفحة</Link>{canManagePages && page.template === "vip" && <Link href={`/vip/${page.slug}/edit`} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400">تعديل بطاقة VIP ✨</Link>}{canManagePages && page.template !== "vip" && <Link href={`/pages/${page.id}/edit`} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-700">تعديل التصميم ✨</Link>}{page.template === "vip" ? <SharePageButton slug={page.slug} basePath="/vip/" /> : <SharePageButton slug={page.slug} />}</div>
          </article>)}</div> :
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl dark:bg-blue-950">↗</div><h3 className="mt-5 text-xl font-extrabold text-slate-950 dark:text-white">ابدأ بإنشاء أول صفحة لك</h3><p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">أضف معلومات نشاطك، ثم خصّص الألوان والقالب وشارك الرابط مع الزبائن.</p><Link href="/pages/new" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-extrabold text-white hover:bg-blue-700">إنشاء أول صفحة</Link></div>}
        </section>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-extrabold text-slate-900 dark:text-white">معلومات الحساب</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400" dir="ltr">{user.email || "غير متوفر"}</p><form action="/auth/signout" method="post" className="mt-4"><button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold hover:border-slate-500 dark:border-slate-700 dark:hover:border-slate-500">تسجيل الخروج</button></form></section>
      </div>
    </main>
  </>;
}
