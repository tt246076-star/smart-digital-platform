// نموذج توضيحي ثابت للبطاقة الرقمية (ليس بطاقة حقيقية)
const actions = ["واتساب", "اتصال", "بريد", "الموقع"];

export default function CardMock() {
  return (
    <div className="mx-auto w-full max-w-sm" aria-label="نموذج توضيحي لبطاقة رقمية">
      <div className="rounded-[2rem] bg-ink p-5 shadow-2xl shadow-brand/30">
        <div className="rounded-3xl bg-gradient-to-br from-brand to-indigo-500 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber text-2xl font-extrabold text-ink">
              س
            </div>
            <div>
              <p className="text-xl font-extrabold">سارة الأحمد</p>
              <p className="text-sm text-blue-100">مصممة هوية بصرية</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-blue-50">
            أصمم هويات تجعل مشروعك يُعرف من النظرة الأولى.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {actions.map((a) => (
            <div key={a} className="rounded-2xl bg-white/10 py-3 text-center text-xs font-bold text-white">
              {a}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-4">
          <div>
            <p className="text-sm font-extrabold">شارك بطاقتك</p>
            <p className="text-xs text-slate-500">برابط أو رمز QR</p>
          </div>
          <div className="grid h-14 w-14 grid-cols-5 gap-0.5" aria-hidden="true">
            {"1110111011010110101101101".split("").map((c, i) => (
              <span key={i} className={c === "1" ? "bg-ink" : "bg-transparent"} />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">نموذج توضيحي للتصميم</p>
    </div>
  );
}
