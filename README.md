# İkimizin Rutini

Cengiz ve Ayşenur için iki kişilik, kişisel bir "kendini geliştirme" sitesi: cilt bakımı, beslenme, spor ve gelişim.
Tek ortak hesapla giriş yapılır, ardından "Kim kullanıyor?" ekranında profil seçilir. Her profilin verisi ayrıdır.

- **Next.js 16** (App Router, TypeScript), Vercel'de yayında: https://erkek-bakim-rutini.vercel.app
- **Neon Postgres** (`@neondatabase/serverless`)
- **Cloudinary**: fotoğraflar `users/<user_id>/...` altında, `authenticated` türünde; adresleri sunucu imzalar.

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

`.env.local` dosyası gerekir (repoya girmez):

| Değişken | Açıklama |
| --- | --- |
| `DATABASE_URL` | Neon bağlantı adresi |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary |
| `AUTH_SECRET` | Oturum çerezini imzalayan en az 32 karakterlik rastgele değer |

Aynı değişkenler Vercel'de "sensitive" olarak tanımlıdır.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run db:migrate` | `db/migrations/*.sql` dosyalarını sırayla uygular (tekrar çalıştırmak güvenlidir) |
| `npm run users:setup` | Ortak hesabı ve profilleri (yoksa) oluşturur, Cengiz'in cilt ürünlerini yükler |
| `HESAP_SIFRESI=... npm run users:setup -- --sifre-belirle` | Ortak hesabın şifresini değiştirir (koda yazılmaz), oturumları kapatır |
| `npm run users:setup -- --sifirla` | Yeni geçici şifre üretip bir kez yazdırır; ilk girişte değiştirmek zorunlu |
| `npm run images` | `gorseller/*.png` → kırpılmış `public/products/*.webp` |
| `npm run icons` | PWA ve favicon ikonlarını üretir |
| `npm run build` | Üretim derlemesi (tip kontrolü dahil) |

## Güvenlik

- Ortak hesabın şifresi bcrypt ile özetlenir; geçici şifre verilirse ilk girişte değiştirmek zorunludur.
- Oturum seçili profili tutar; profil yalnızca bu hesaba aitse seçilebilir.
- Oturum çerezi httpOnly, secure, `AUTH_SECRET` ile HMAC imzalıdır; veritabanında kimliğin yalnızca SHA-256 özeti tutulur.
  "Beni hatırla" işaretliyse 90 gün, değilse tarayıcı kapanınca biter (sunucuda da en fazla 1 gün).
- 5 hatalı denemeden sonra (kullanıcı adı ya da IP bazında) 15 dakika bekleme.
- Her API route'u oturumu sunucuda doğrular ve veriyi seçili profilin `user_id`'si ile filtreler.
- Herkese açık kayıt yoktur; hesap yalnızca `users:setup` betiğiyle oluşturulur.


## 💌

Bu bölüm Mors alfabesiyle yazıldı. Çözmek isteyen, satırlardan birini bir Mors çözücüye yapıştırsın.

```
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
... . -. .. / ... . ...- .. -.-- --- .-. ..- -- / .- -.-- ... . -. ..- .-. ..- --
```
