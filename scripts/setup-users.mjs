// Hesap kurulumu ve bakım.
//
//   npm run users:setup                 Eksik hesapları oluşturur, geçici şifreleri BİR KEZ yazdırır,
//                                       Cengiz'in cilt ürünlerini (yoksa) yükler.
//   npm run users:setup -- --sifirla cengiz
//                                       Şifreyi yeni geçici şifreyle değiştirir, oturumları kapatır,
//                                       ilk girişte değiştirmeyi zorunlu kılar.
//
// Herkese açık kayıt yoktur; hesaplar yalnızca bu betikle oluşturulur.
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { Client } from "@neondatabase/serverless";
import { PRODUCTS, seedSkin } from "./seed/cengiz-cilt.mjs";

const ACCOUNTS = [
  {
    username: "cengiz",
    displayName: "Cengiz Kaim",
    skinMetrics: ["kuruluk", "yaglanma", "sivilce", "hassasiyet", "tiras"],
    seedSkin: true,
  },
  {
    username: "aysenur",
    displayName: "Ayşenur Arslan",
    skinMetrics: ["kuruluk", "yaglanma", "sivilce", "hassasiyet"],
    seedSkin: false, // ürünleri koda gömülmez; arayüzden eklenir
  },
];

const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function tempPassword() {
  // 4×4 karakter, ~93 bit; okunması kolay olsun diye benzer karakterler (0/O, 1/l/I) yok
  const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return [group(), group(), group(), group()].join("-");
}


const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tanımlı değil (.env.local).");
  process.exit(1);
}

const args = process.argv.slice(2);
const client = new Client(url);
await client.connect();

try {
  if (args[0] === "--sifirla") {
    const username = (args[1] ?? "").toLowerCase();
    const password = tempPassword();
    const hash = await bcrypt.hash(password, 12);
    const res = await client.query(
      "update users set password_hash = $1, must_change_password = true, updated_at = now() where username = $2 returning id",
      [hash, username],
    );
    if (!res.rowCount) throw new Error(`"${username}" adlı kullanıcı yok.`);
    await client.query("delete from sessions where user_id = $1", [res.rows[0].id]);
    await client.query("delete from login_attempts where identifier = $1", [username]);
    console.log(`${username} için yeni geçici şifre: ${password}`);
    console.log("İlk girişte değiştirilmesi zorunlu. Açık oturumlar kapatıldı.");
  } else {
    for (const acc of ACCOUNTS) {
      await client.query("begin");
      try {
        const existing = await client.query("select id from users where username = $1", [acc.username]);
        let userId = existing.rows[0]?.id;
        if (!userId) {
          const password = tempPassword();
          const hash = await bcrypt.hash(password, 12);
          const res = await client.query(
            `insert into users (username, display_name, password_hash, must_change_password, skin_metrics)
             values ($1, $2, $3, true, $4) returning id`,
            [acc.username, acc.displayName, hash, acc.skinMetrics],
          );
          userId = res.rows[0].id;
          console.log(`+ ${acc.displayName} (${acc.username})  geçici şifre: ${password}`);
        } else {
          console.log(`= ${acc.displayName} (${acc.username}) zaten var, şifresine dokunulmadı.`);
        }
        if (acc.seedSkin && (await seedSkin(client, userId))) {
          console.log(`  ${acc.displayName}: ${PRODUCTS.length} ürün ve rutin adımları yüklendi.`);
        }
        await client.query("commit");
      } catch (err) {
        await client.query("rollback");
        throw err;
      }
    }
  }
} finally {
  await client.end();
}
