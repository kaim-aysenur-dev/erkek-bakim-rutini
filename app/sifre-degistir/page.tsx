import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { PasswordForm } from "@/components/password-form";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Şifreni belirle" };

// İlk girişte zorunlu şifre değişimi. Bu tamamlanmadan başka sayfa ve API açılmaz.
export default async function ChangePasswordPage() {
  const user = await requireUser({ duringPasswordChange: true });
  if (!user.mustChangePassword) redirect("/ayarlar");

  return (
    <div className="login-page">
      <main className="login">
        <header className="login-hero">
          <BrandMark large />
          <h1>Hoş geldin, {user.displayName.split(" ")[0]}</h1>
          <p>İlk girişin olduğu için sana verilen geçici şifreyi kendi şifrenle değiştirmen gerekiyor.</p>
        </header>
        <section className="login-card" aria-label="Şifre belirle">
          <PasswordForm username={user.username} firstLogin />
        </section>
        <div className="login-foot">
          <LogoutButton variant="link" />
        </div>
      </main>
    </div>
  );
}
