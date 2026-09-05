import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Check, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

const passwordRules = [
  { label: "En az 8 karakter", test: (value: string) => value.length >= 8 },
  { label: "Bir harf içerir", test: (value: string) => /[a-zA-Z]/.test(value) },
  { label: "Bir sayı içerir", test: (value: string) => /\d/.test(value) },
];

const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Ad en az 2 karakter olmalıdır."),
  lastName: z.string().trim().min(2, "Soyad en az 2 karakter olmalıdır."),
  email: z
    .string()
    .trim()
    .min(1, "E-posta adresinizi girin.")
    .email("Geçerli bir e-posta adresi girin."),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^[+\d][\d\s()-]{9,}$/.test(value),
      "Geçerli bir telefon numarası girin.",
    ),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır.")
    .regex(/[a-zA-Z]/, "Şifre bir harf içermelidir.")
    .regex(/\d/, "Şifre bir sayı içermelidir."),
  role: z.enum(["CUSTOMER", "SELLER"]),
  accepted: z
    .boolean()
    .refine((value) => value, "Devam etmek için koşulları kabul edin."),
});

type RegisterForm = z.infer<typeof registerSchema>;

const roles = [
  {
    role: "CUSTOMER",
    title: "Müşteri",
    detail: "Abonelikleri seçip yönetin.",
    icon: UserRound,
  },
  {
    role: "SELLER",
    title: "Satıcı",
    detail: "Mağazanızın operasyonunu yönetin.",
    icon: Building2,
  },
] as const;

type RegisterPageProps = {
  embedded?: boolean;
  onSwitchToLogin?: () => void;
};

export default function RegisterPage({
  embedded = false,
  onSwitchToLogin,
}: RegisterPageProps) {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "SELLER" ? "SELLER" : "CUSTOMER";
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      role: initialRole,
      accepted: false,
    },
  });
  const selectedRole = watch("role");
  const password = watch("password");
  const accepted = watch("accepted");
  const validPassword = passwordRules.every((rule) => rule.test(password));

  const submit = handleSubmit(async (values) => {
    try {
      await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        role: values.role,
        phone: values.phone || undefined,
      });
      navigate("/");
    } catch (error: unknown) {
      const response = error as { response?: { data?: { message?: string } } };
      setError("root", {
        message:
          response.response?.data?.message ||
          "Kayıt oluşturulamadı. Lütfen bilgilerinizi kontrol edin.",
      });
    }
  });

  const content = (
    <>
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
        {!embedded && <fieldset>
          <legend className="mf-label">Hesap türü</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {roles.map((item) => {
              const Icon = item.icon;
              const selected = selectedRole === item.role;
              return (
                <label
                  key={item.role}
                  className={`cursor-pointer rounded-xl border p-3 transition ${selected ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:border-primary-200"}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    value={item.role}
                    {...register("role")}
                    onChange={() =>
                      setValue("role", item.role, { shouldValidate: true })
                    }
                  />
                  <span className="flex gap-3">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-lg ${selected ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-ink">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-600">
                        {item.detail}
                      </span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Ad"
            autoComplete="given-name"
            error={errors.firstName?.message}
            required
            {...register("firstName")}
          />
          <FormField
            label="Soyad"
            autoComplete="family-name"
            error={errors.lastName?.message}
            required
            {...register("lastName")}
          />
        </div>
        <FormField
          label="E-posta"
          type="email"
          autoComplete="email"
          placeholder="ornek@firma.com"
          error={errors.email?.message}
          required
          {...register("email")}
        />
        <FormField
          label="Telefon"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="05XX XXX XX XX"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <div>
          <FormField
            label="Şifre"
            type="password"
            autoComplete="new-password"
            placeholder="Güçlü bir şifre oluşturun"
            error={errors.password?.message}
            required
            {...register("password")}
          />
          <ul className="mt-2 grid gap-1 text-xs" aria-label="Şifre kuralları">
            {passwordRules.map((rule) => (
              <li
                key={rule.label}
                className={`flex items-center gap-1.5 ${rule.test(password) ? "text-success-700" : "text-slate-500"}`}
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {rule.label}
              </li>
            ))}
          </ul>
        </div>
        <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600"
            {...register("accepted")}
          />
          <span>
            Kullanım koşulları ve gizlilik metnini okudum, kabul ediyorum.
          </span>
        </label>
        {errors.accepted?.message && (
          <p role="alert" className="text-xs font-semibold text-danger-600">
            {errors.accepted.message}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !accepted || !validPassword}
        >
          {isSubmitting ? "Kayıt oluşturuluyor…" : "Hesap oluştur"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Zaten hesabınız var mı?{" "}
        {embedded && onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-primary-700 hover:underline"
          >
            Giriş yap
          </button>
        ) : (
          <Link
            to="/login"
            className="font-bold text-primary-700 hover:underline"
          >
            Giriş yap
          </Link>
        )}
      </p>
    </>
  );

  if (embedded) return content;

  return (
    <AuthLayout
      title="Hesabınızı oluşturun"
      description="Size uygun rolü seçin; birkaç dakikada MealFlex’e katılın."
    >
      {content}
    </AuthLayout>
  );
}
