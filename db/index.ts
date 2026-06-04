import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// neon-http sürücüsü "lazy"dir: gerçek HTTP isteği yalnızca bir sorgu
// çalıştığında yapılır. Bu yüzden build sırasında (DATABASE_URL yokken)
// geçerli görünüşlü bir yer-tutucu ile örneği oluşturmak güvenlidir;
// gerçek sorgu çalışırsa ve URL eksikse aşağıdaki kontrol uyarır.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && process.env.NODE_ENV !== "production") {
  console.warn("[db] DATABASE_URL tanımlı değil — yalnızca build/geliştirme placeholder'ı kullanılıyor.");
}

const sql = neon(
  databaseUrl ?? "postgresql://placeholder:placeholder@placeholder.neon.tech/placeholder?sslmode=require",
);

export const db = drizzle(sql, { schema });

export { schema };
