import { HealthNote } from "@/components/health-note";
import { SubNav } from "@/components/subnav";

const ITEMS = [
  { href: "/spor", label: "Plan", exact: true },
  { href: "/spor/kayit", label: "Kayıt" },
  { href: "/spor/hareketler", label: "Hareketler" },
];

export default function SportLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="main">
      <header className="page-head">
        <p className="eyebrow">Spor listesi</p>
        <h1>Spor</h1>
      </header>
      <SubNav items={ITEMS} label="Spor bölümleri" />
      {children}
      <HealthNote />
    </main>
  );
}
