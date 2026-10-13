import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/identity";
import { SITE_NAME } from "@/lib/site";

// Ana sayfa = giriş sayfası. Oturum açıksa doğrudan Bugün'e geçer.
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/sifre-degistir" : "/bugun");

  const { sonra } = await searchParams;
  const next = safeNextPath(sonra) ?? undefined;

  return (
    <div className="login-page">
      <main className="login">
        <header className="login-hero">
          <BrandMark large />
          <h1>{SITE_NAME}</h1>
          <p>Cilt bakımı, beslenme, spor ve kendini geliştirme için ikimize ait küçük bir defter. Devam etmek için giriş yap.</p>
        </header>
        <section className="login-card" aria-label="Giriş">
          <LoginForm next={next} />
        </section>
        <p className="login-foot">Bu site yalnızca iki kişiye özeldir; herkese açık kayıt yoktur.</p>
      </main>
    </div>
  );
}
