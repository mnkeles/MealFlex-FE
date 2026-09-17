import { useEffect, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { accountService } from "@/services/accountService";
import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { loginPathForAudience, type LoginAudience } from "@/utils/authRoutes";

export default function ForgotPasswordPage({
  audience = "CUSTOMER",
}: {
  audience?: LoginAudience;
}) {
  const loginPath = loginPathForAudience(audience);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (!resendSeconds) return;
    const timer = window.setInterval(
      () => setResendSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const request = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setIsError(false);
    try {
      const result = await accountService.forgotPassword(email);
      setSent(true);
      setResendSeconds(60);
      setMessage(result.message);
      if (result.developmentCode) setToken(result.developmentCode);
    } catch {
      setIsError(true);
      setMessage(
        "Sıfırlama bağlantısı gönderilemedi. E-posta adresinizi kontrol edip tekrar deneyin.",
      );
    } finally {
      setBusy(false);
    }
  };
  const reset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setIsError(false);
    try {
      await accountService.resetPassword(token, password);
      setDone(true);
      setMessage("Şifreniz yenilendi. Yeni şifrenizle giriş yapabilirsiniz.");
    } catch {
      setIsError(true);
      setMessage("Kod geçersiz veya süresi dolmuş. Yeni bir kod isteyin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={
        done
          ? "Şifreniz yenilendi"
          : sent
            ? "Yeni şifrenizi belirleyin"
            : "Şifrenizi sıfırlayın"
      }
      description={
        done
          ? "Hesabınız artık kullanıma hazır."
          : sent
            ? "E-postanıza gönderilen kodla yeni şifrenizi oluşturun."
            : "E-posta adresinizi girin; size güvenli bir sıfırlama kodu gönderelim."
      }
    >
      {message && (
        <p
          role={isError ? "alert" : "status"}
          className={`mb-5 rounded-lg border p-3 text-sm leading-6 ${isError ? "border-danger-100 bg-danger-50 text-danger-700" : "border-info-100 bg-info-50 text-info-700"}`}
        >
          {message}
        </p>
      )}
      {done ? (
        <div>
          <div className="grid h-12 w-12 place-items-center rounded-full bg-success-50 text-success-700">
            <CheckCircle2 />
          </div>
          <Link to={loginPath} className="mt-5 block">
            <Button className="w-full">Giriş yap</Button>
          </Link>
        </div>
      ) : !sent ? (
        <form onSubmit={request} className="space-y-5" aria-busy={busy}>
          <FormField
            label="E-posta"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="ornek@firma.com"
            required
          />
          <Button
            type="submit"
            disabled={busy}
            className="w-full"
            leftIcon={<Mail className="h-4 w-4" />}
          >
            {busy ? "Gönderiliyor…" : "Sıfırlama kodu gönder"}
          </Button>
          <Link
            to={loginPath}
            className="block text-center text-sm font-bold text-primary-700 hover:underline"
          >
            Girişe dön
          </Link>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-5" aria-busy={busy}>
          <FormField
            label="Sıfırlama kodu"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder="6 haneli kod"
            required
            hint="Kodun süresi sınırlıdır; süresi dolduysa yeni kod isteyin."
          />
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Kod genellikle 15 dakika geçerlidir.{" "}
            {resendSeconds > 0 ? (
              <strong>
                {resendSeconds} sn sonra yeni kod isteyebilirsiniz.
              </strong>
            ) : (
              <strong>Yeni kod isteyebilirsiniz.</strong>
            )}
          </p>
          <FormField
            label="Yeni şifre"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            placeholder="En az 8 karakter"
            required
          />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Şifre yenileniyor…" : "Şifreyi yenile"}
          </Button>
          <button
            type="button"
            disabled={busy || resendSeconds > 0}
            onClick={() => {
              setSent(false);
              setToken("");
              setMessage("");
            }}
            className="block w-full text-center text-sm font-bold text-primary-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-500"
          >
            {resendSeconds > 0
              ? `Yeni kod için ${resendSeconds} sn bekleyin`
              : "Yeni kod iste"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
