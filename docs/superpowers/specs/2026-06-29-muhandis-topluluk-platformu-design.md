# Muhandis — Topluluk Platformu Tasarımı

> Durum: **Taslak (kullanıcı onayı bekliyor)** · Tarih: 2026-06-29
> Kapsam: Tam vizyon + **Faz 1** için uygulama-hazır tasarım. Faz 2/3 yol haritası olarak kalır.

---

## 1. Tek cümlelik vizyon

**Muhandis, Özbek mühendisler için amaca-özel inşa edilmiş bir topluluk platformudur — Telegram'ın olamadığı şey.**

Telegram'da 1000 kişilik bir kanal da açılabilir; orada soru sorulur, konuşulur. Ama: sorular birbirine karışır, kim kimdir belli olmaz, geçmiş cevaplar kaybolur, kullanması zordur — çünkü **Telegram bu iş için üretilmedi.** Muhandis bu eksiği kapatır: yapılı, kolay kullanılan, profiller + konular + sorular + rollerle örülü; Telegram'la sıkı entegre ama Telegram'ın yapamadığı yapıyı sağlayan bir site/uygulama.

**Tagline adayları:**
- *"Boşluğa sorma, doğru yere sor"*
- *"Muhandis — diasporanın ortak aklı"*

## 2. Motivasyon (kimlik değil, dürtü)

Kurucuya gençler tanıdık yollarla ulaşıp aynı eğitim/iş sorularını soruyor; kurucu herkese aynı şeyi tekrar tekrar anlatıyor. Yapılı bir platform bunu **temelden** hafifletir: sorular konulara göre düzenlenir, aranabilir ve görünür olur; bir kez verilen iyi cevap kaybolmaz. "Bir kez cevapla, yeniden kullan" ve "doğru kişiye yönlendir" bu yüzden değerli **özelliklerdir** — ama ürünün kimliği değil, platformun içinde yaşayan yetenekler.

## 3. Tasarım felsefesi

- **Platform önce, zekâ sonra.** Önce kullanılabilir, sağlam, düzenli bir topluluk sitesi. AI, kapsül-otomasyonu, akıllı yönlendirme → sonraki fazlarda eklenen opsiyonel katmanlar. Erken aşırı mühendislik yok.
- **Gönüllüyle büyür.** Kâr amacı yok; açık kaynak (MIT, github.com/randomuzbek/muhandis). Bu yüzden **roller** birinci sınıf: farklı kişiler farklı sorumlulukları üstlenebilmeli.
- **Telegram-hibrit.** Yapı web/Mini App'te; giriş, bildirim ve hızlı aksiyon Telegram'da. İkisi deep link ile dikişsiz.
- **Sıkıcı olmasın ama cringe de olmasın.** Mühendis-yerli statü (aşağıda §10), zorlama yok, anonimlik mümkün.

## 4. Değişmez kısıtlar

- **Stack:** Next.js (App Router, TS) + Telegram Mini App (`@telegram-apps/sdk-react`) + grammY bot + Postgres/Drizzle (Neon) + Vercel + next-intl. Mevcut şema zengin (§8).
- **`AGENTS.md`:** Bu Next.js'in API'leri eğitim verisinden farklı olabilir — kod yazmadan `node_modules/next/dist/docs/` okunacak.
- **Sıfırdan içerik.** Hazır cevap/SSS birikimi yok; içerik gelen gerçek post/sorulardan doğar.
- **Diller:** önce uz+ru; en/tr talep oldukça eklenir (baştan x4 dogması yok).

## 5. Onaylanmış kararlar (bu oturum)

| Karar | Sonuç |
|---|---|
| Ne inşa ediyoruz | Amaca-özel topluluk platformu (Telegram'ın yapamadığı yapı), AI konsiyerj **değil** |
| Omurga | Kolay profiller + Reddit-tarzı konular/sorular + **roller** + Telegram entegrasyonu |
| AI & kapsül-otomasyonu | **Ertelendi** — sonraki fazlarda opsiyonel yardımcı katman |
| Soru yönlendirme | Soranın seçtiği **Dört Kapı**; varsayılan **herkese açık**; AI önerisi ertelendi |
| Admin yönlendirme | Kurucu admin panelinden soruyu elle bir kişiye atayabilir |
| Roller | Admin, Moderatör, Konu sorumlusu, Mentor, Doğrulanmış mühendis, Bölge elçisi, Katkıcı + yaratıcı ekler (§7) |
| Kapsam | Faz 1 detaylı; Faz 2/3 yol haritası |

## 6. Mimari omurga

### 6.1 Profiller
Kullanıcı tek-tık (Telegram) girer, sürtünmesiz profil oluşturur. Hiçbir alan zorunlu değil (anonim/takma ad mümkün). Altyapı büyük ölçüde mevcut (`profiles`, `profileFields`, `skills`, `interests`, tamamlanma ölçeri).

### 6.2 Konular → Post/Soru (Reddit-tarzı)
- **Konular (Yo'nalishlar):** kategoriler — ör. "Yurt dışı yüksek lisans", "Yazılım kariyeri", "Vize & başvuru", "Havacılık/savunma", "Staj". (`topics` tablosu hazır.)
- Her konunun altında üyeler **post**, **soru** ve (ileride) **proje** açar. (`posts.type` ve `posts.topicId` hazır.)
- Etkileşim: yorum (`comments`), pozitif onay **Rahmat** (`reactions`) — **downvote yok**.
- Keşif: konuya göre listeleme + basit metin araması (geçmiş cevap kaybolmasın).

### 6.3 Roller & yetkiler
Platformun gönüllüyle büyümesinin motoru. Kurucunun elinde **rol atama paneli**; roller hem **yetki** (moderasyon, sabitleme, konu yönetimi) hem **statü** (güven sinyali) taşır. Detay §7.

### 6.4 Telegram entegrasyonu
- Tek-tık giriş (initData HMAC) — ayrı kayıt yok.
- Bildirimler bot DM ile: *biri seni takip etti*, *soruna cevap geldi*, *sana soru yönlendirildi*, *gönderine yorum* — tek tıkla app'e döner.
- Deep link + `start_param` her paylaşılabilir nesne için; davet linki (`referredBy` zaten var).
- (İleride) inline mode ile kartvizit/kart paylaşımı (`lib/og` altyapısı hazır).

### 6.5 Soru yönlendirme — "Dört Kapı" (Faz 2 çekirdeği, Faz 1'de tohum)
Soru soran kişi sorusunu **kime** sorduğunu seçer:
1. **🌍 Herkese açık (VARSAYILAN)** — herkes görür, isteyen cevaplar.
2. **🏷️ Etikete göre hedefli** — "sadece *Almanya* + *yüksek lisans* etiketliler" görsün (mevcut etiketlerden; AI gerektirmez).
3. **👤 Belirli kişiye** — tek kişiye, sistem içinden.
4. **🤖 AI önerisi — ERTELENDİ** (Faz 3).

Hedefte kimse yoksa/yanıt gelmezse soru admin kuyruğuna düşer; kurucu **elle** birine atar.

## 7. Rol sistemi (detay)

Üç kategori. Roller global ya da konu-kapsamlı olabilir; atamayı admin yapar (ileride bazıları kazanımla/otomatik).

**A) Yönetim rolleri (yetki):**
- **Admin (Kurucu)** — tam yetki, rol atama, kök-ban.
- **Moderatör (Hakam)** — içerik/kullanıcı moderasyonu, şikayet çözümü.
- **Konu sorumlusu (Maintainer)** — belirli bir konunun moderatörü; GitHub "maintainer" mantığı (konu-kapsamlı).

**B) Statü & güven rolleri (rozet):**
- **Doğrulanmış mühendis** — kimlik/iş kanıtı (GitHub OAuth, kurumsal e-posta domaini) → mavi rozet.
- **Mentor** — mentorluğa açık; profilde işaret + mentor listelerinde öne.
- **Aksakal** *(yaratıcı)* — onursal kıdemli/danışman; yüksek güven, az ve kıt.
- **Kafil** *(yaratıcı, Faz 2)* — yeni gelene kefil olan; güven zinciri, "mahalla/kafil" kültürü.

**C) Topluluk-büyütme rolleri (gönüllü):**
- **Bölge elçisi (Hudud elchisi)** — bir ülke/şehirdeki temsilci; yeni gelenleri karşılar.
- **Katkıcı (Hissador)** — açık-kaynak kod / içerik / çeviri katkıcısı; profilde "maintainer/contributor" işareti.

> **İlke:** Roller statü-yarışı değil **hizmet/sorumluluk**tur (GitHub maintainer mantığı). Rozet enflasyonu yok — az, kıt, hak edilmiş. Yaratıcı roller (Aksakal, Hakam, Kafil, Bölge elçisi) Özbek kültürüne yerel ve topluluğa kimlik katar. **Yeni roller zamanla, ihtiyaç doğdukça eklenir** — sistem buna açık tasarlanır (rol = veri, kod değil).

## 8. Veri modeli (mevcut şemaya ekler)

**Yeniden kullanılan tablolar:** `users`, `profiles`, `topics`, `posts(type=post|question|project)`, `comments`, `reactions`, `follows`, `reports`, `engineeringFields`/`profileFields`, `skills`, `interests`, `referralClaims`, `spotlights`.

**Yeni (Faz 1):**
- **`roles`** — `slug`, `labels` (jsonb çok-dilli), `category` (`mgmt`|`status`|`community`), `scope` (`global`|`topic`), opsiyonel açıklama. (Rol = veri; yeni rol eklemek migration değil satır eklemek.)
- **`user_roles`** — `userId`, `roleSlug`, `topicId` (scope=topic için, nullable), `grantedBy`, `grantedAt`. Yetki kontrolü buradan.
- (`topics` zenginleştirme) — `description`, sıralama/aktiflik; takip için `follows` benzeri konu-takibi (opsiyonel).

**Yeni (Faz 2):**
- **`question_targets`** — hedefli/kişiye sorular (soru, hedef kullanıcı, kaynak `asker|admin`, durum `pending|accepted|passed`).
- **`capsules`** + **`capsule_links`** — kanonik cevap kartı + yeniden-kullanım bağı (yankı/dedup).
- **`empty_signals`** — boş arama/talep ısı haritası.

## 9. Faz 1 — Kullanılabilir topluluk platformu (çekirdek)

**Amaç:** Telegram'ın veremediği yapıyı veren, kolay kullanılan, düzenli bir topluluk sitesi. İlk ziyaretçi profilini açar, konulara göz atar, soru/post oluşturur, insanlara ulaşır.

**Özellikler:**
1. **Kolay profil** — tek-tık giriş, sürtünmesiz oluşturma, anonim-önce seçeneği (mevcut altyapı üstüne).
2. **Konular + Post/Soru** — Reddit-tarzı konu listesi; konu altında post/soru oluşturma, görüntüleme; **kapı seçici** (Faz 1'de yalnız **herkese açık** + **belirli kişiye**; etikete-hedefli yönlendirme ve Üstlen/Pas bot akışı Faz 2).
3. **Etkileşim** — yorum, **Rahmat** (pozitif-tek), paylaş/deep-link.
4. **Basit arama** — konu + metin araması (Postgres `tsvector`/trigram); "bu zaten soruldu mu" temel düzeyde.
5. **Rol sistemi + atama paneli** — `roles`/`user_roles`; admin panelinden rol atama; en az Admin/Moderatör/Konu sorumlusu aktif; moderasyon yetkileri rollere bağlı.
6. **Admin yönlendirme** — açık/yanıtsız soruyu elle birine ata (bot DM).
7. **Telegram entegrasyonu** — giriş + temel bildirimler (takip, yorum, soru atama) + deep link.
8. **Moderasyon temeli** — mevcut `reports` üstüne rol-bazlı silme/sabitleme; kök-ban kurucuda.

**Başarı metriği (Ay 1-2):**
- İlk ~25-50 davetli üye profilini açtı; konularda düzenli post/soru akıyor.
- Gelen sorular konulara göre düzenli ve **aranabilir**; kurucu aynı soruya ikinci kez yanıt verirken eski cevaba link verebiliyor.
- En az 2-3 gönüllü rol üstlendi (moderatör/konu sorumlusu/elçi).

## 10. "Sıkıcı olmayan" ilkeler (oyunlaştırma anayasası)

- **Liderlik tablosu / global sıralama / lig YOK** — küçük grafikte kurucu sonsuza dek #1, yeni gelen ezilir. Kıyas yerine kişisel etki anlatısı (ileride).
- **Downvote / alenen aşağılama YOK** — küçük diasporada tek aşağılanma birini kaybettirir. Tek pozitif sinyal: **Rahmat.**
- **Günlük streak YOK** — sömürücü karanlık desen. Ritim olacaksa opt-in, affedici, mevsimlik.
- **İtibar & roller mühendis-yerli dilde** — CI "passing/mentor-ochiq" yeşil rozeti, kariyer "changelog", semver/build-status estetiği; çocuksu maskot/konfeti DEĞİL.
- **Roller hizmet/sorumluluk** — statü-yarışı değil; rozet enflasyonu yok.
- **Bildirim spam'i YOK** — gerektiğinde, kişisel, az.
- **Oyunlaştırma opt-in ve arka planda** — anonim/çekingen kullanıcıya dayatılmaz.

## 11. Faz 2 & Faz 3 — Yol haritası

**Faz 2 — Soru-cevap zekâsı + zengin roller + güven:**
- **Dört Kapı** tam yönlendirme (etikete hedefli + kişiye) + Üstlen/Pas/Başkasını öner bot akışı.
- **Kanonik Cevap** ("bir kez cevapla"): iyi cevabı kalıcı, aranabilir karta yükseltme; **"bu zaten soruldu"** dedup (metin → embedding).
- **Boş Arama Sinyali** — boş aramayı "ilk sen ol" kancası + admin talep bileti.
- **Genişletilmiş roller** — Mentor, Doğrulanmış mühendis, Aksakal, Bölge elçisi, Katkıcı tam aktif; **Kafil** kefalet zinciri.
- **Kimlik modeli "Tek Kök, İki Yüz"** — anonim ama itibarlı; tek kalıcı maske = Sybil bariyeri.
- **Cevap Yankısı (Aks-sado)** — cevabın kaç kişiye yardım ettiği bildirimi.
- **Mühendis-yerli itibar** — gerçek etkiye bağlı (yeniden-kullanım, kefalet, tanıştırma).

**Faz 3 — Büyüme & kendini yöneten topluluk:**
- **AI yardımcı** (opsiyonel) — yönlendirme önerisi (Dört Kapı'nın 4. kapısı), dedup önerisi, kapsül taslağı. **Sıkı sınır:** insan onayı olmadan yayın yok; veri yokken cevap üretmez.
- **Kıtlık-korumalı Tanıştırma Köprüsü** — çift opt-in + aylık intro jetonu.
- **Muhandis Pasporti + Vizitka Inline** — paylaşılabilir kimlik kartı; organik büyüme.
- **Mehfil** — eşik-tetiklemeli salonlar (boş oda yaratmadan).
- **İş/referans köprüsü**, **Hudud elchilari** programı, yumuşak yaptırım merdiveni (throttle→sessize→gölge→kök-ban + itiraz).

## 12. Riskler & önlemler

| Risk | Önlem |
|---|---|
| Cold-start: küçük/boş grafik, az soru | İlk ~25-50 güvenilir mühendisi elle davet; kurucu bilinirliğini kaldıraç yap; konular tohumla |
| "Bir forum daha" olup ölmek | Telegram'ın veremediği yapı + roller + kolay kullanım net farklılaştırıcı; basit ve hızlı tut |
| Aşırı mühendislik (erken AI/embedding/kefalet) | Faz 1 = sade platform; zekâ ve güven Faz 2/3'e ertelendi |
| Gönüllü rol boşlukta kalır | Roller hizmet odaklı, az ve anlamlı; kurucu erkenden 2-3 kişiye gerçek sorumluluk devreder |
| Yanlış-ban / toksisite | Downvote/streak/liderlik yok; kademeli geri-alınabilir moderasyon; kök-ban son çare + itiraz |
| x4 çeviri maliyeti | önce uz+ru; en/tr talep oldukça |

## 13. Açık sorular (Faz 1 başlamadan netleştirilecek)

1. **İlk halka:** ~25-50 kişilik davet listesi kim? İlk roller (moderatör/konu sorumlusu/elçi) kime?
2. **İlk konular:** hangi 5-8 konuyla açıyoruz? (Yurt dışı yüksek lisans, yazılım kariyeri, vize/başvuru, havacılık/savunma, staj...?)
3. **Yaratıcı roller:** Aksakal/Hakam/Kafil/Bölge elçisi isimleri ve kapsamları sana uygun mu; başka rol fikrin var mı?
4. **Anonimlik derinliği:** Faz 1'de anonim kullanıcı soru/post açabilsin mi, yoksa en az takma ad şart mı?
5. **Dil:** uz+ru ile başlamak yeterli mi?

---

*Bu tasarım, 11-mercekli yaratıcı keşif ağı + adversaryal eleştiri turundan damıtıldı ve iki kullanıcı düzeltmesiyle "amaca-özel topluluk platformu" çerçevesine oturtuldu. Ham fikirler oturum çalışma dosyalarında saklı.*
