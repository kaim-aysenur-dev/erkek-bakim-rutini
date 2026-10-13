// Yalnızca yerel doğrulama için geçici "deneme" hesabı.
//   npm run dev:account -- olustur   Hesabı açar (Cengiz'in örnek cilt verisiyle); şifre .env.local'a
//                                    DENEME_SIFRE olarak yazılır, ekrana basılmaz.
//   npm run dev:account -- sil       Hesabı, tüm verisini ve Cloudinary fotoğraflarını siler.
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { Client } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";
import { seedSkin } from "./seed/cengiz-cilt.mjs";

const USERNAME = "deneme";
const mode = process.argv[2];
const client = new Client(process.env.DATABASE_URL);
await client.connect();

async function setEnv(key, value) {
  const text = await readFile(".env.local", "utf8");
  const lines = text.split("\n").filter((l) => !l.startsWith(`${key}=`));
  if (value !== null) lines.splice(lines.length - (lines.at(-1) === "" ? 1 : 0), 0, `${key}=${value}`);
  await writeFile(".env.local", lines.join("\n"));
}

try {
  if (mode === "olustur") {
    const password = randomBytes(18).toString("base64url") + "1a";
    await client.query("begin");
    await client.query("delete from users where username = $1", [USERNAME]);
    const { rows } = await client.query(
      `insert into users (username, display_name, password_hash, must_change_password, skin_metrics)
       values ($1, 'Deneme Hesabı', $2, false, $3) returning id`,
      [USERNAME, await bcrypt.hash(password, 12), ["kuruluk", "yaglanma", "sivilce", "hassasiyet", "tiras"]],
    );
    const userId = rows[0].id;
    await seedSkin(client, userId);
    await client.query("commit");
    await setEnv("DENEME_SIFRE", password);
    console.log("deneme hesabı hazır (şifre .env.local içinde DENEME_SIFRE).");
  } else if (mode === "sil") {
    const { rows } = await client.query("delete from users where username = $1 returning id", [USERNAME]);
    await client.query("delete from login_attempts where identifier = $1", [USERNAME]);
    if (rows[0]) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      try {
        await cloudinary.api.delete_resources_by_prefix(`users/${rows[0].id}/`, { type: "authenticated" });
      } catch {}
    }
    await setEnv("DENEME_SIFRE", null);
    console.log(rows[0] ? "deneme hesabı ve verileri silindi." : "deneme hesabı zaten yok.");
  } else {
    console.log("Kullanım: npm run dev:account -- olustur|sil");
  }
} finally {
  await client.end();
}
