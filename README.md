# İkimizin Rutini

Cengiz ve Ayşenur için iki kişilik, kişisel bir "kendini geliştirme" sitesi: cilt bakımı, beslenme, spor ve gelişim.
Her kişi kendi hesabıyla giriş yapar ve yalnızca kendi verisini görür.

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
| `npm run users:setup` | Eksik hesapları oluşturur ve geçici şifreleri bir kez yazdırır |
| `npm run users:setup -- --sifirla cengiz` | Şifreyi yeni geçici şifreyle sıfırlar, oturumları kapatır |
| `npm run images` | `gorseller/*.png` → kırpılmış `public/products/*.webp` |
| `npm run icons` | PWA ve favicon ikonlarını üretir |
| `npm run build` | Üretim derlemesi (tip kontrolü dahil) |

## Güvenlik

- Şifreler bcrypt ile özetlenir; ilk girişte geçici şifrenin değiştirilmesi zorunludur.
- Oturum çerezi httpOnly, secure, `AUTH_SECRET` ile HMAC imzalıdır; veritabanında kimliğin yalnızca SHA-256 özeti tutulur.
  "Beni hatırla" işaretliyse 90 gün, değilse tarayıcı kapanınca biter (sunucuda da en fazla 1 gün).
- 5 hatalı denemeden sonra (kullanıcı adı ya da IP bazında) 15 dakika bekleme.
- Her API route'u oturumu sunucuda doğrular ve veriyi oturumdaki `user_id` ile filtreler.
- Herkese açık kayıt yoktur; hesaplar yalnızca `users:setup` betiğiyle oluşturulur.
