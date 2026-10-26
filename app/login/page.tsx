import AuthPage from "@/components/AuthPage";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const notice =
    searchParams.error === "confirm"
      ? "تعذّر إكمال التأكيد من هذا الرابط. إن كان حسابك مؤكدًا فسجّل الدخول مباشرة."
      : undefined;
  return <AuthPage mode="login" notice={notice} />;
}
