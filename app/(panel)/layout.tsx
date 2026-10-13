import { cookies } from "next/headers";
import { Brand } from "@/components/brand";
import { SideNav, TabBar } from "@/components/shell/nav";
import { UserMenu } from "@/components/shell/user-menu";
import { TimerProvider } from "@/components/timers";
import { requireUser } from "@/lib/auth/session";
import { imageUrl } from "@/lib/cloudinary";
import { SITE_NAME } from "@/lib/site";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";

// Oturum gerektiren bütün sayfaların kabuğu.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const avatarUrl = user.avatarPublicId
    ? imageUrl(user.avatarPublicId, { width: 96, height: 96, crop: "fill", gravity: "face" })
    : null;

  return (
    <TimerProvider>
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <SideNav />
        <p className="sidebar-foot">{SITE_NAME}</p>
      </aside>
      <div>
        <header className="topbar">
          <Brand />
          <div className="topbar-spacer" />
          <UserMenu name={user.displayName} username={user.username} avatarUrl={avatarUrl} theme={theme} />
        </header>
        {children}
      </div>
      <TabBar />
    </div>
    </TimerProvider>
  );
}
