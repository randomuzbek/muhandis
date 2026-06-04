import "dotenv/config";
import { db } from "./index";
import { engineeringFields, topics } from "./schema";
import { ENGINEERING_FIELDS, TOPICS } from "../lib/data/taxonomy";

// Taksonomiyi (mühendislik alanları + forum konuları) tabloya yazar.
// Çalıştırma: npm run db:seed   (DATABASE_URL gerekir)
async function main() {
  console.log("Seeding engineering_fields...");
  for (const f of ENGINEERING_FIELDS) {
    await db
      .insert(engineeringFields)
      .values({ slug: f.slug, labels: f.labels })
      .onConflictDoUpdate({
        target: engineeringFields.slug,
        set: { labels: f.labels },
      });
  }

  console.log("Seeding topics...");
  for (const t of TOPICS) {
    await db
      .insert(topics)
      .values({ slug: t.slug, labels: t.labels })
      .onConflictDoUpdate({ target: topics.slug, set: { labels: t.labels } });
  }

  console.log("Seed tamamlandı ✅");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
