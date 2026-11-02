import AuthPage from "@/components/AuthPage";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const notice =
    params.error === "confirm"
      ? "تعذّر إكمال التأكيد من هذا الرابط. إن كان حسابك مؤكدًا فسجّل الدخول مباشرة."
      : undefined;
  return <AuthPage mode="login" notice={notice} />;
}
