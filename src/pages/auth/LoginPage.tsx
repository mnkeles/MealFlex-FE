import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Store } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import {
  defaultPathForRole,
  loginPathForAudience,
  type LoginAudience,
} from "@/utils/authRoutes";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "E-posta adresinizi girin.")
    .email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Şifrenizi girin."),
});

type LoginForm = z.infer<typeof loginSchema>;

type LoginPageProps = {
  audience?: LoginAudience;
  embedded?: boolean;
  onSwitchToRegister?: () => void;
};

const contentByAudience: Record<
  LoginAudience,
  { title: string; description: string; eyebrow: string }
> = {
  CUSTOMER: {
    eyebrow: "Müşteri girişi",
    title: "Hoş geldiniz",
    description:
      "Aboneliklerinize, teslimatlarınıza ve hesabınıza kaldığınız yerden devam edin.",
  },
  SELLER: {
    eyebrow: "Satıcı hesabı",
    title: "Mağazanıza hoş geldiniz",
    description:
      "Operasyon panelinize devam etmek için hesabınızla giriş yapın.",
  },
  ADMIN: {
    eyebrow: "Yönetici girişi",
    title: "Platformu yönetin",
    description:
      "Kullanıcı, mağaza ve platform operasyonlarını güvenle yönetin.",
  },
};

export default function LoginPage({
  audience = "CUSTOMER",
  embedded = false,
  onSwitchToRegister,
}: LoginPageProps) {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const signedInUser = await login(values.email, values.password);
      if (signedInUser.role !== audience) {
        logout();
        setError("root", {
          message: "Kullanıcı adı veya şifre hatalı.",
        });
        return;
      }
      navigate(defaultPathForRole(signedInUser.role));
    } catch (error: unknown) {
      const response = error as { response?: { data?: { message?: string } } };
      setError("root", {
        message:
          response.response?.data?.message ||
          "Giriş yapılamadı. E-posta adresinizi ve şifrenizi kontrol edin.",
      });
    }
  });

  const content = (
    <>
      <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-primary-600">
        {contentByAudience[audience].eyebrow}
      </p>
      <form
        onSubmit={submit}
        className="space-y-5"
        aria-busy={isSubmitting}
        noValidate
      >
        {errors.root?.message && (
          <p
            role="alert"
            className="rounded-xl border border-danger-100 bg-danger-50 p-3 text-sm font-semibold text-danger-700"
          >
            {errors.root.message}
          </p>
        )}
        <FormField
          label="E-posta"
          type="email"
          autoComplete="email"
          placeholder="ornek@firma.com"
          startAdornment={<Mail className="h-4.5 w-4.5" aria-hidden="true" />}
          error={errors.email?.message}
          required
          {...register("email")}
        />
        <div>
          <FormField
            label="Şifre"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Şifrenizi girin"
            startAdornment={
              <LockKeyhole className="h-4.5 w-4.5" aria-hidden="true" />
            }
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                title={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
                ) : (
                  <Eye className="h-4.5 w-4.5" aria-hidden="true" />
                )}
              </button>
            }
            error={errors.password?.message}
            required
            {...register("password")}
          />
          <Link
            to={`${loginPathForAudience(audience).replace(/\/login$/, "/forgot-password")}`}
            className="mt-2 block text-right text-xs font-bold text-primary-700 hover:underline"
          >
            Şifremi unuttum
          </Link>
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full shadow-[0_12px_28px_rgba(220,54,38,0.24)]"
          disabled={isSubmitting}
          rightIcon={!isSubmitting && <ArrowRight className="h-4 w-4" />}
        >
          {isSubmitting ? "Giriş yapılıyor…" : "Giriş yap"}
        </Button>
      </form>
      {audience !== "ADMIN" && (
        <p className="mt-6 text-center text-sm text-slate-600">
          {audience === "SELLER" ? "Satıcı hesabınız yok mu?" : "Hesabınız yok mu?"}{" "}
          {embedded && onSwitchToRegister ? (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-bold text-primary-700 hover:underline"
            >
              Üye ol
            </button>
          ) : (
            <Link
              to={audience === "SELLER" ? "/register?role=SELLER" : "/register"}
              className="font-bold text-primary-700 hover:underline"
            >
              Kayıt ol
            </Link>
          )}
        </p>
      )}
      {audience === "CUSTOMER" && !embedded && (
        <div className="mt-6 border-t border-slate-200 pt-5 text-center">
          <p className="mb-3 text-sm font-semibold text-slate-600">
            Mağaza veya catering işletmesi misiniz?
          </p>
          <Link
            to="/seller/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-black text-primary-700 transition hover:border-primary-300 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            Satıcı girişi
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
      {audience === "SELLER" && (
        <div className="mt-6 border-t border-slate-200 pt-5 text-center">
          <p className="mb-3 text-sm text-slate-600">
            Yemek hizmeti almak için mi geldiniz?
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 text-sm font-black text-slate-700 transition hover:text-primary-700 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Müşteri girişine dön
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <AuthLayout
      title={contentByAudience[audience].title}
      description={contentByAudience[audience].description}
      variant={audience === "SELLER" ? "seller-login" : "login"}
    >
      {content}
    </AuthLayout>
  );
}
