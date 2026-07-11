# Muhandis — Faz 2, Dilim 1: Dört Kapı Tam Yönlendirme

> Durum: **Onaylandı (kullanıcı 2026-07-11)** · Tarih: 2026-07-11
> Kapsam: Faz 2'nin ilk dilimi. Ana spec: `2026-06-29-muhandis-topluluk-platformu-design.md` §6.5, §11.
> Önkoşul: Faz 1 (roller + sorular + kişiye-kapı + admin yönlendirme) kodda hazır (dalda; prod'a çıkmadı).

---

## 1. Amaç (tek cümle)

Bir soruyu **doğru insana** ulaştırma döngüsünü tamamla: soran kişi sorusunu etikete göre bir gruba yöneltebilsin, hedeflenen kişiler **Üstlen/Pas** ile yanıt verip vermeyeceğini seçebilsin, yanıtsız/tümü-pas sorular admin kuyruğuna düşsün.

Bu, ürünün "Telegram'ın yapamadığı" çekirdek farklılaştırıcısıdır: boşluğa değil, doğru kişiye sormak.

## 2. Bağlam — mevcut durum (Faz 1'de tohumlanan)

- `questionTargets` tablosu var: `id, postId, userId, source ('asker'|'admin'), createdAt`. **`status` alanı yok.**
- **Door 3 (belirli kişiye)** çalışıyor: `createPost` `targetUserId` alır → `questionTargets(source='asker')` + `notifyQuestionTarget` bot DM (düz metin, buton yok).
- **Admin yönlendirme** çalışıyor: `routeQuestion` (content.moderate-gated) → `questionTargets(source='admin')` + bildirim.
- Bot'ta **yalnızca** `command('start')` handler'ı var — `callback_query` handler'ı **yok**.
- Etiket havuzu hazır: `engineeringFields` (profileFields), `skills` (profileSkills), `interests` (profileInterests), `profiles.country`.
- Cevaplama = mevcut yorum (`comments`) akışı; değişmez.

## 3. Kapsam

**İçinde:**
1. **Door 2 — etikete-hedefli kapı** (compose'da yeni seçenek).
2. **Üstlen/Pas akışı** — bot inline buton + uygulama içi, `status` geçişleriyle.
3. **"Sana yöneltilenler" gelen kutusu** (`/inbox`).
4. **Soran'a geri bildirim** — biri üstlenince bildirim + soru sayfasında "üstlenildi" rozeti.
5. **Admin kuyruğu güncellemesi** — tümü-pas / yanıtsız sorular admin panelinde görünür.

**Dışında (bilerek ertelendi):**
- **"Başkasını öner"** bot akışı — bot DM içinde kişi seçtirmek karmaşık (arama/sayfalama gerekir). Ertelendi; kişi uygulamada zaten başkasına yönlendirebilir (admin) ya da soruyu herkese açık bırakabilir.
- **AI kapı önerisi** (Dört Kapı'nın 4. kapısı) — Faz 3.
- **Sert görünürlük gizleme** — bkz. §4 karar.

## 4. Anahtar karar — "yumuşak hedefleme"

Ana spec "sadece *Almanya + yüksek lisans* etiketliler görsün" der. İki yorum:

| Seçenek | Sonuç |
|---|---|
| Sert gizleme (sadece eşleşen görür) | Ürünün asıl değeri "cevaplar kaybolmasın + aranabilir" ile çelişir; feed, soru sayfası, arama, OG kartı — her yerde erişim kontrolü gerektirir; ağır ve anayasanın açıklık ilkesine ters. |
| **Yumuşak hedefleme (KARAR)** | Soru **herkese açık ve aranabilir kalır**; eşleşen etiketli kişilere **bildirim + gelen kutusu** ile ulaşır. Kişiye-kapıyı bir *gruba* genişletmek. Basit, tutarlı, mevcut public feed'i bozmaz. |

**Karar: yumuşak hedefleme.** "Hedefleme" = bir bildirim/gelen-kutusu yönlendirmesidir, görünürlük kısıtı değil.

## 5. Veri modeli değişikliği (migration 0010)

Yeni tablo yok. `questionTargets` genişletilir:

- **`status text not null default 'pending'`** — değerler: `pending` | `accepted` | `passed`. (Kod düzeyinde birlik; DB check constraint YAGNI.)
- **`source`** metin kolonu; kod düzeyinde kabul edilen değerler artık `'asker' | 'admin' | 'tag'`.

`unique(postId, userId)` korunur: aynı kişi aynı soruya iki kez hedeflenmez (kapılar çakışırsa `onConflictDoNothing`).

Mevcut satırlar `status='pending'` alır (default). Prod'a `npm run db:migrate`.

## 6. Akışlar

### 6.1 Door 2 — etikete-hedefli soru (compose)

- `NewPostForm`'da soru + kapı = "etikete göre" seçilince, çoklu etiket seçici görünür: alan (engineeringFields) / yetenek / ilgi / ülke. En az bir etiket şart.
- Gönderince: yeni server action `createPost` sonrası (ya da `createPost` içine entegre) → seçilen etiketlere **sahip** kullanıcıları çöz (soran hariç), **üst sınır: ilk N=25** (createdAt/isim sırası) → her biri için `questionTargets(source='tag', status='pending')` + `notifyQuestionTarget`.
- **Kimse eşleşmezse:** kullanıcıya uyarı ("kimse bulunamadı; herkese açık paylaşıldı") — soru yine de herkese açık olarak var olur (yumuşak hedefleme). Hedef satırı oluşmaz.
- Sınır aşımı (>N eşleşme): ilk N'e bildirim; kalanı sessizce atlanır (soru zaten public).

### 6.2 Üstlen / Pas — bot + uygulama

**Bot:** `notifyQuestionTarget` DM'i artık inline klavye taşır: **[🙋 Üstlen] [Pas]** (`callback_data = qt:accept:<postId>` / `qt:pass:<postId>`). Yeni `bot.on("callback_query:data")` handler:
- Telegram id → user çöz; `questionTargets` satırını (postId+userId) bul.
- **accept:** `status='accepted'` → `answerCallbackQuery` teyit + mesajı düzenle ("üstlendin ✓") → soran'a bildirim (§6.4).
- **pass:** `status='passed'` → teyit + mesaj düzenle. Tümü-pas kontrolü (§6.3).
- Yetki: sadece o soruya hedeflenmiş kişi kendi satırını değiştirebilir; başkasının callback'i reddedilir.

**Uygulama içi:** Gelen kutusunda (§6.3) aynı iki aksiyon server action olarak (`respondToQuestion({postId, action})`). Bot ve uygulama aynı mantığı paylaşır (ortak `lib/actions/questions.ts` fonksiyonu).

### 6.3 "Sana yöneltilenler" gelen kutusu (`/inbox`)

- Yeni sayfa: giriş yapmış kullanıcıya `status='pending'` hedefli sorular listesi (source fark etmez) + her birinde Üstlen/Pas + soru linki.
- Nav'da (Header) "Gelen kutusu" sekmesi; bekleyen sayı > 0 ise küçük rozet.
- Boşsa EmptyState.

### 6.4 Soran'a geri bildirim

- Biri **Üstlen**'diğinde: soran'a bot DM ("{isim} sorunu üstlendi") + soru sayfasında "🙋 {isim} üstlendi" rozeti (getPost → accepted hedef(ler)i döndürür).
- **Pas** için soran'a bildirim YOK (gürültü; anayasa anti-spam).

### 6.5 Admin kuyruğu

- `listOpenQuestions` güncellenir: "açık" = herkese açık yanıtsız **veya** tüm hedefleri `passed`. Admin bunları görüp `routeQuestion` ile elle başka kişiye atar (mevcut akış).
- (Basit tutulur; gelişmiş filtre/durum rozetleri opsiyonel.)

## 7. Dokunulan dosyalar (tahmini)

- `db/schema.ts` — `questionTargets.status`; migration 0010.
- `lib/actions/questions.ts` — `respondToQuestion` (accept/pass, ortak), tag-hedef çözme; `routeQuestion` dokunulmaz.
- `lib/actions/posts.ts` — `createPost`'a etiket-hedefleme dalı (ya da ayrı action; plan netleştirir).
- `lib/queries/questions.ts` — `listInboxForUser(userId)`, `listOpenQuestions` güncelle, getPost'a accepted-hedef.
- `lib/telegram/bot.ts` — `callback_query:data` handler.
- `lib/telegram/notifications.ts` — `notifyQuestionTarget` inline klavye; `notifyQuestionAccepted` (soran'a).
- `lib/telegram/i18n.ts` — Üstlen/Pas/üstlenildi bot string'leri (4 dil).
- `components/feed/NewPostForm.tsx` — etikete-göre kapı + etiket seçici.
- `app/[locale]/inbox/page.tsx` + bileşen — gelen kutusu.
- `components/layout/Header` (tabs) — Gelen kutusu sekmesi + rozet.
- `messages/{uz,en,ru,tr}.json` — yeni string'ler (4 dil zorunlu, yoksa client çöker).

## 8. Doğrulama

- **Saf mantık TDD (vitest):**
  - Etiket→kullanıcı çözümü: eşleşme mantığı, soranı dışla, N sınırı, kimse-eşleşmedi.
  - Durum geçişleri: pending→accepted, pending→passed; "tümü-pas" tespiti.
  - callback_data ayrıştırma (`qt:accept:123` → {action, postId}), hatalı yük reddi.
- **Bot callback + UI:** typecheck/lint/build + manuel (Mini App + bot DM gerektirir → kullanıcıya kalır).
- **i18n:** eksik anahtar taraması (build sırasında MISSING_MESSAGE riski).

## 9. Riskler

| Risk | Önlem |
|---|---|
| Boş grafik: hedeflenecek etiketli kişi yok | Yumuşak hedefleme → kimse eşleşmese de soru public var olur; özellik zararsız bekler. Kabul edilen gerçek (kullanıcı "inşaya devam" dedi). |
| Geniş etiket → 100 kişiye DM spam | N=25 üst sınır + soran'a "kaç kişiye ulaştı" bilgisi. |
| Bot callback yetki bypass | Satır sahipliği kontrolü (yalnız hedeflenen kişi kendi satırını değiştirir). |
| Aynı kişi çok kapıdan hedeflenir | `unique(postId,userId)` + `onConflictDoNothing`. |
| Yeni bot altyapısı (ilk callback handler) | grammY `callback_query:data` standart; `node_modules` grammY/Next docs okunacak (AGENTS.md). |

## 10. Deploy notu

Bu dilim mevcut yayınlanmamış yığının (Faz 1 + Rahmat) üstüne biner. Deploy sırası değişmez: `0009`+`0010` migrate → merge → push. Deploy kararı kullanıcıda (ayrı, stratejik).
