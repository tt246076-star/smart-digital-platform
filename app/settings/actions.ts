"use server";

import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/server/input-validation";

export async function loadSettingsProfile(): Promise<
  | { ok: true; email: string; name: string }
  | { ok: false; message: string }
> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { ok: false, message: "انتهت جلستك. سجّل الدخول مجددًا." };

    const displayName = typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.slice(0, 80)
      : "";

    return { ok: true, email: user.email || "", name: displayName };
  } catch {
    return { ok: false, message: "تعذر تحميل إعدادات الحساب. حدّث الصفحة وحاول مجددًا." };
  }
}

export async function startSettingsTotpEnrollment(): Promise<
  | { ok: true; mfa: { id: string; totp: { qr_code: string; secret: string } } }
  | { ok: false; message: string }
> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { ok: false, message: "انتهت جلستك. سجّل الدخول مجددًا." };

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Bitaqati Authenticator " + randomUUID(),
    });

    if (error) {
      return {
        ok: false,
        message: error.code === "mfa_factor_name_conflict"
          ? "اسم تطبيق المصادقة مستخدم مسبقًا. أعد المحاولة لإنشاء اسم جديد."
          : "تعذر بدء إعداد المصادقة الثنائية. حاول مجددًا.",
      };
    }

    if (!data || data.type !== "totp" || !data.id || !data.totp.qr_code || !data.totp.secret) {
      return { ok: false, message: "تعذر تجهيز رمز المصادقة. حاول مجددًا." };
    }

    return {
      ok: true,
      mfa: { id: data.id, totp: { qr_code: data.totp.qr_code, secret: data.totp.secret } },
    };
  } catch {
    return { ok: false, message: "تعذر بدء إعداد المصادقة الثنائية حاليًا." };
  }
}

export async function verifySettingsTotp(factorId: string, code: string): Promise<
  { ok: true } | { ok: false; message: string }
> {
  if (!isValidUuid(factorId) || typeof code !== "string" || code.length > 8 || !/^\d{6,8}$/.test(code.trim())) {
    return { ok: false, message: "عامل المصادقة أو رمز التحقق غير صالح." };
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { ok: false, message: "انتهت جلستك. سجّل الدخول مجددًا." };

    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
    if (factorError) return { ok: false, message: "تعذر قراءة عوامل المصادقة. حاول مجددًا." };

    const factor = (factors?.totp || []).find((item) => item.id === factorId);
    if (!factor || factor.status !== "unverified") {
      return { ok: false, message: "عامل المصادقة غير صالح. أعد إعداد المصادقة الثنائية." };
    }

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge?.id) return { ok: false, message: "تعذر بدء التحقق. حاول مجددًا." };

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    if (verifyError) return { ok: false, message: "رمز التحقق غير صحيح أو انتهت صلاحيته." };

    return { ok: true };
  } catch {
    return { ok: false, message: "تعذر التحقق من الرمز حاليًا." };
  }
}
