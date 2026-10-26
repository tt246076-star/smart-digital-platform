import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function socialLinks(page: any) {
  const links = [
    { label: "WhatsApp", url: page.whatsapp ? `https://wa.me/${page.whatsapp.replace(/\\D/g, "")}` : "" },
    { label: "Instagram", url: page.instagram_url },
    { label: "Facebook", url: page.facebook_url },
    { label: "TikTok", url: page.tiktok_url },
    { label: "YouTube", url: page.youtube_url },
    ...(Array.isArray(page.custom_links) ? page.custom_links : []),
  ];
  return links.filter((link) => link.url);
}

export default async function PublicLandingPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("landing_pages")
    .select("business_name, headline, description, phone, whatsapp, logo_url, instagram_url, facebook_url, tiktok_url, youtube_url, custom_links, is_published")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) notFound();

  const links = socialLinks(page);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="h-2 bg-gradient-to-l from-blue-600 via-indigo-500 to-violet-500" />
        <section className="px-6 pb-8 pt-10 text-center sm:px-10">
          {page.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.logo_url} alt={page.business_name} className="mx-auto mb-5 h-24 w-24 rounded-2xl border border-slate-100 object-cover shadow-sm" />
          ) : (
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-black text-blue-700">
              {page.business_name.slice(0, 1)}
            </div>
          )}
          <p className="text-xs font-extrabold tracking-widest text-blue-600">صفحة نشاط تجاري</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">{page.business_name}</h1>
          {page.headline && <p className="mt-3 text-lg font-bold text-slate-700">{page.headline}</p>}
          {page.description && <p className="mx-auto mt-4 max-w-md whitespace-pre-wrap text-sm leading-8 text-slate-500">{page.description}</p>}

          <div className="mt-8 grid gap-3">
            {page.phone && <a href={`tel:${page.phone}`} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50">اتصل بنا · {page.phone}</a>}
            {links.map((link: { label: string; url: string }, index: number) => (
              <a key={`${link.label}-${index}`} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-blue-700">{link.label}</a>
            ))}
          </div>
        </section>
        <footer className="border-t border-slate-100 px-6 py-4 text-center text-xs text-slate-400">صُنعت هذه الصفحة باستخدام بطاقاتي</footer>
      </div>
    </main>
  );
}
