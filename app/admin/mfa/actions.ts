"use server";

import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/server/input-validation";
import {
  ADMIN_MFA_COOKIE,
  getSessionIdFromAccessToken,
  signAdminMfaSession,
  verifyAdminMfaSession,
  type AdminMfaProof,
} from "@/lib/admin-mfa-session";

type AdminContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string };
  sessionId: string;
};

async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (error || !user || !adminEmail || user.email?.trim().toLowerCase() !== adminEmail) return null;

  const { data: { session } } = await supabase.auth.getSession();
  const sessionId = getSessionIdFromAccessToken(session?.access_token);
  if (!sessionId) return null;

  return { supabase, user, sessionId };
}

async function getCurrentProof(ctx: AdminContext) {
  const store = await cookies();
  return verifyAdminMfaSession(
    store.get(ADMIN_MFA_COOKIE)?.value,
    ctx.user.id,
    ctx.sessionId
  );
}

async function setAdminMfaCookie(ctx: AdminContext, proof: AdminMfaProof) {
  const now = Date.now();
  const value = await signAdminMfaSession({
    userId: ctx.user.id,
    sessionId: ctx.sessionId,
    issuedAt: now,
    lastActivity: now,
    proof,
  });
  if (!value) return false;

  const store = await cookies();
  store.set(ADMIN_MFA_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return true;
}

function createRecoveryCodes() {
  return Array.from({ length: 10 }, () => {
    const raw = randomBytes(16).toString("hex").toUpperCase();
    return { display: raw.match(/.{1,4}/g)?.join("-") || raw, raw };
  });
}

function hashRecoveryCode(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function createAdminServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function replaceRecoveryCodes(userId: string) {
  const admin = createAdminServiceClient();
  if (!admin) return null;

  const codes = createRecoveryCodes();
  const hashes = codes.map((code) => hashRecoveryCode(code.raw));
  const { data, error } = await admin.rpc("replace_admin_mfa_recovery_codes", {
    p_user_id: userId,
    p_code_hashes: hashes,
  });
  if (error || data !== 10) {
    console.error("Admin MFA recovery code rotation failed:", error?.message || "Unexpected result");
    return null;
  }
  return codes.map((code) => code.display);
}

export async function loadAdminMfaStatus(): Promise<
  | { ok: true; factors: { id: string; friendlyName: string; status: string }[]; currentLevel: string; recoveryCodesRemaining: number; recoveryMode: boolean }
  | { ok: false; message: string }
> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "يجب تسجيل الدخول بحساب المدير." };

  const [{ data: factors, error: factorError }, { data: assurance, error: assuranceError }] = await Promise.all([
    ctx.supabase.auth.mfa.listFactors(),
    ctx.supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (factorError || assuranceError) {
    return { ok: false, message: "تعذر قراءة إعدادات المصادقة. حاول تحديث الصفحة." };
  }

  const admin = createAdminServiceClient();
  if (!admin) return { ok: false, message: "إعدادات الأمان غير مكتملة على الخادم." };
  const { count, error: countError } = await admin
    .from("admin_mfa_recovery_codes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.user.id);
  if (countError) return { ok: false, message: "تعذر قراءة حالة رموز الاسترداد." };

  const currentProof = await getCurrentProof(ctx);
  const totpFactors = (factors?.totp || []).map((factor) => ({
    id: factor.id,
    friendlyName: factor.friendly_name || "Authenticator",
    status: factor.status,
  }));

  return {
    ok: true,
    factors: totpFactors,
    currentLevel: assurance?.currentLevel || "aal1",
    recoveryCodesRemaining: count || 0,
    recoveryMode: currentProof?.proof === "backup",
  };
}

export async function startAdminTotpEnrollment(): Promise<
  | { ok: true; factorId: string; qrCode: string; secret: string }
  | { ok: false; message: string }
> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "غير مسموح." };

  const { data: factors, error: factorError } = await ctx.supabase.auth.mfa.listFactors();
  if (factorError) return { ok: false, message: "تعذر قراءة عوامل المصادقة." };

  const verifiedFactors = (factors?.totp || []).filter((factor) => factor.status === "verified");
  const existingProof = await getCurrentProof(ctx);
  if (
    verifiedFactors.length > 0 &&
    existingProof?.proof !== "backup" &&
    existingProof?.proof !== "totp"
  ) {
    return { ok: false, message: "أثبت هويتك بالرمز الحالي أو برمز استرداد قبل إضافة تطبيق جديد." };
  }

  // Supabase requires a unique friendly name for each factor belonging to a user.
  // Use a random suffix so an already verified factor or an interrupted setup
  // cannot block the next enrollment attempt.
  const friendlyName = `Bitaqati Admin ${randomBytes(6).toString("hex").toUpperCase()}`;
  const { data, error } = await ctx.supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
  });

  if (error) {
    console.error("Admin MFA enrollment failed:", error.code || "unknown", error.message);
    return {
      ok: false,
      message: error.code === "mfa_factor_name_conflict"
        ? "اسم تطبيق المصادقة مستخدم مسبقًا. اضغط إعداد التطبيق مرة أخرى."
        : "تعذر بدء إعداد تطبيق المصادقة. حاول مجددًا.",
    };
  }

  // Narrow the discriminated union before accessing TOTP-only fields.
  if (!data || data.type !== "totp" || !data.id || !data.totp.qr_code || !data.totp.secret) {
    console.error("Admin MFA enrollment returned an unexpected factor type.");
    return { ok: false, message: "لم نتمكن من تجهيز رمز تطبيق المصادقة. حاول مجددًا." };
  }

  return {
    ok: true,
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function verifyAdminTotp(
  factorId: string,
  code: string,
  mode: "setup" | "login"
): Promise<{ ok: boolean; message: string; recoveryCodes?: string[] }> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "غير مسموح." };
  if (!isValidUuid(factorId) || typeof code !== "string" || code.length > 8 || !/^\d{6,8}$/.test(code.trim())) {
    return { ok: false, message: "أدخل رمز التحقق الصحيح." };
  }
  if (mode !== "setup" && mode !== "login") return { ok: false, message: "طلب غير صالح." };

  const { data: factors, error: factorError } = await ctx.supabase.auth.mfa.listFactors();
  if (factorError) return { ok: false, message: "تعذر قراءة عوامل المصادقة." };

  const factor = (factors?.all || []).find((item) => item.id === factorId && item.factor_type === "totp");
  if (!factor || (mode === "setup" && factor.status !== "unverified") || (mode === "login" && factor.status !== "verified")) {
    return { ok: false, message: "عامل المصادقة غير صالح. أعد تحميل الصفحة." };
  }

  if (mode === "setup") {
    const verifiedFactors = (factors?.totp || []).filter((item) => item.status === "verified");
    const existingProof = await getCurrentProof(ctx);
    if (
      verifiedFactors.length > 0 &&
      existingProof?.proof !== "backup" &&
      existingProof?.proof !== "totp"
    ) {
      return { ok: false, message: "يلزم استخدام الرمز الحالي أو رمز استرداد قبل تغيير جهاز المصادقة." };
    }
  }

  const { data: challenge, error: challengeError } = await ctx.supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challenge?.id) {
    return { ok: false, message: "تعذر بدء التحقق. حاول مجددًا." };
  }

  const { error: verifyError } = await ctx.supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: String(code).trim(),
  });
  if (verifyError) {
    return { ok: false, message: "الرمز غير صحيح أو انتهت صلاحيته. جرّب الرمز الحالي." };
  }

  const { data: { session } } = await ctx.supabase.auth.getSession();
  const refreshedSessionId = getSessionIdFromAccessToken(session?.access_token);
  if (!refreshedSessionId) return { ok: false, message: "تم التحقق، لكن تعذر تثبيت جلسة الإدارة. سجّل الدخول مجددًا." };

  const updatedContext = { ...ctx, sessionId: refreshedSessionId };
  const cookieSet = await setAdminMfaCookie(updatedContext, "totp");
  if (!cookieSet) return { ok: false, message: "تعذر إنشاء جلسة إدارية آمنة." };

  if (mode === "setup") {
    const codes = await replaceRecoveryCodes(ctx.user.id);
    if (!codes) {
      return {
        ok: true,
        message: "تم تفعيل المصادقة الثنائية. ادخل إلى صفحة الأمان لتوليد رموز الاسترداد.",
      };
    }
    return {
      ok: true,
      message: "تم تفعيل المصادقة الثنائية. احفظ رموز الاسترداد الآن؛ لن تظهر مرة أخرى.",
      recoveryCodes: codes,
    };
  }

  const admin = createAdminServiceClient();
  if (admin) {
    const { count, error: countError } = await admin
      .from("admin_mfa_recovery_codes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.user.id);
    if (!countError && (count || 0) === 0) {
      const codes = await replaceRecoveryCodes(ctx.user.id);
      if (codes) {
        return {
          ok: true,
          message: "تم التحقق. احفظ رموز الاسترداد الجديدة قبل متابعة لوحة الإدارة.",
          recoveryCodes: codes,
        };
      }
    }
  }

  return { ok: true, message: "تم التحقق بنجاح. يمكنك الآن فتح لوحة الإدارة." };
}

export async function redeemAdminRecoveryCode(code: string): Promise<{ ok: boolean; message: string }> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "غير مسموح." };

  if (typeof code !== "string" || code.length > 39) {
    return { ok: false, message: "رمز الاسترداد غير صحيح." };
  }
  const supplied = code.trim().toUpperCase();
  if (!/^(?:[0-9A-F]{32}|(?:[0-9A-F]{4}-){7}[0-9A-F]{4})$/.test(supplied)) {
    return { ok: false, message: "رمز الاسترداد غير صحيح." };
  }
  const normalized = supplied.replace(/-/g, "");
  if (!/^[0-9A-F]{32}$/.test(normalized)) {
    return { ok: false, message: "رمز الاسترداد غير صحيح." };
  }

  const admin = createAdminServiceClient();
  if (!admin) return { ok: false, message: "إعدادات الاسترداد غير مكتملة على الخادم." };

  const { data: status, error } = await admin.rpc("consume_admin_mfa_recovery_code", {
    p_user_id: ctx.user.id,
    p_code_hash: hashRecoveryCode(normalized),
  });
  if (error) {
    console.error("Admin MFA recovery verification failed:", error.message);
    return { ok: false, message: "تعذر التحقق من رمز الاسترداد." };
  }
  if (status === "locked") {
    return { ok: false, message: "تم إيقاف محاولات رموز الاسترداد مؤقتًا. حاول بعد 15 دقيقة." };
  }
  if (status !== "ok") return { ok: false, message: "رمز الاسترداد غير صحيح أو سبق استعماله." };

  const cookieSet = await setAdminMfaCookie(ctx, "backup");
  if (!cookieSet) return { ok: false, message: "تم قبول الرمز، لكن تعذر إنشاء جلسة الاسترداد. سجّل الدخول مجددًا." };

  return {
    ok: true,
    message: "تم قبول رمز الاسترداد مرة واحدة. أضف تطبيق مصادقة جديدًا الآن لإعادة حماية الحساب.",
  };
}

export async function regenerateAdminRecoveryCodes(): Promise<
  | { ok: true; codes: string[] }
  | { ok: false; message: string }
> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "غير مسموح." };

  const [proof, { data: assurance }] = await Promise.all([
    getCurrentProof(ctx),
    ctx.supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (proof?.proof !== "totp" || assurance?.currentLevel !== "aal2") {
    return { ok: false, message: "تحقق بتطبيق المصادقة قبل إنشاء رموز استرداد جديدة." };
  }

  const codes = await replaceRecoveryCodes(ctx.user.id);
  if (!codes) return { ok: false, message: "تعذر إنشاء رموز الاسترداد. لم تُعرض أي رموز." };
  return { ok: true, codes };
}
