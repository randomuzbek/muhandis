# Muhandis — AI Konsiyerj & Cevap Kapsülü Tasarımı

> Durum: **Taslak (kullanıcı onayı bekliyor)** · Tarih: 2026-06-29
> Kapsam: Tam vizyon + **Faz 0 & Faz 1** için uygulama-hazır tasarım. Faz 2/3 yol haritası olarak kalır.

---

## 1. Tek cümlelik vizyon

Muhandis bir forum, sohbet grubu ya da iş panosu **değil** — **kurucunun beynini ölçeklenebilir kılan bir AI konsiyerj katmanıdır.**

**Tagline adayları:**
- *"Bir marta javob ber — abadiy ishlasin"* (Bir kez cevapla, sonsuza dek çalışsın)
- *"Boşluğa sorma, doğru kişiye sor"*

## 2. Çözülen acı

Gençler kurucuya tanıdık yollarla ulaşıp aynı eğitim/iş sorularını soruyor; kurucu **herkese aynı şeyi tekrar tekrar anlatıyor.** Ürün bunu tek bir kazanan döngüye indirger:

> **Bir kez cevapla → cevap kalıcı bir "Cevap Kapsülü"ne kristalleşsin → aynı soru tekrar geldiğinde ya hazır kapsül gösterilsin ya da boşluğa düşmeden doğru kişi(ler)e yönlensin.**

Geri kalan her şey (kimlik, kefalet, pasaport, oyunlaştırma) bu döngünün gerçekten döndüğü **kanıtlandıktan sonra** eklenir. Bu bir özellik kataloğu değil, **risk-sıralı bir bahistir.**

## 3. Değişmez kısıtlar

- **Telegram-hibrit.** Telegram beyin değil, en yüksek etkileşimli **teslimat + aksiyon** katmanı. Yapı (profiller, sorular, kapsüller, keşif) web/Mini App'te yaşar; bildirim/giriş/aksiyon Telegram'da.
- **Mevcut stack:** Next.js (App Router, TS) + Telegram Mini App (`@telegram-apps/sdk-react`) + grammY bot + Postgres/Drizzle (Neon) + Vercel + next-intl. (Detay: `AGENTS.md` — bu Next.js'in API'leri eğitim verisinden farklı olabilir; kod yazmadan `node_modules/next/dist/docs/` okunacak.)
- **Sıfırdan başlıyoruz.** Hazır cevap/SSS birikimi **yok**. Kapsüller tohumlanamaz; gelen gerçek sorulardan **doğmaları** gerekir. → Faz 0 buna göre kurgulandı (§7).
- **Açık kaynak.** MIT, gönüllüler farklı rolleri üstlenebilir (github.com/randomuzbek/muhandis).

## 4. Onaylanmış ürün kararları (bu oturum)

| Karar | Sonuç |
|---|---|
| Strateji yönü | Telegram-hibrit; "bir forum daha" değil, AI konsiyerj + kapsül döngüsü |
| Çekirdek değer | "Bir kez cevapla, yeniden kullan" + "doğru kişiye yönlendir" |
| Kapsül tohumu | **Sıfırdan** — gelen gerçek sorulardan doğar (eski "elle 50 cevap" planı iptal) |
| Soru yönlendirme | Soranın seçtiği **4 kapı** (aşağıda); AI önerisi **ertelendi** |
| Varsayılan kapı | **Herkese açık** (soran seçmezse) |
| Admin yönlendirme | Kurucu admin panelinden **herhangi bir soruyu elle istediği kişiye** yönlendirebilir (Wizard-of-Oz) |
| Spec kapsamı | Faz 0 + Faz 1 detaylı; Faz 2/3 yol haritası |

## 5. Soru yönlendirme modeli — "Dört Kapı"

Soru soran kişi, sorusunu **kime** sorduğunu seçer. Tek bir kapı yerine soranın kontrolünde dört kapı:

1. **🌍 Herkese açık (VARSAYILAN)** — topluluktaki herkes görür, isteyen cevaplar. Kürasyonlu Reddit hissi.
2. **🏷️ Etikete göre hedefli** — "sadece *Almanya* + *yüksek lisans* etiketli kişiler" görsün/bildirilsin. İlgisiz herkesi rahatsız etmez. (Etiketler mevcut `engineeringFields` / `skills` / `interests` + ülke/şehirden gelir — **AI gerektirmez.**)
3. **👤 Belirli kişiye** — tek kişiye, sistemin içinden (bugün kurucuya DM atmanın yapılandırılmış hâli).
4. **🤖 AI önerisi — ERTELENDİ** — AI "buna en iyi şu 3 kişi cevap verir" der, soran onaylar. Faz 2+. İlk etapta overkill.

**Boş hedef güvenliği:** Hedefli/kişiye sorulan soruya yanıt gelmezse veya hedefte uygun kişi yoksa, soru otomatik **Boş Arama Sinyali**'ne (§6) düşer ve admin kuyruğuna girer.

**Admin yönlendirme (Wizard-of-Oz):** Kurucu, admin panelinden açık/yanıtsız herhangi bir soruyu seçip **elle bir kullanıcıya atar**; o kişiye bot DM gider. Bu, AI yönlendiricinin Faz 0/1'deki insan-içinde-döngü taklididir.

## 6. Çekirdek döngü (sıfırdan-başlama sürümü)

```
0. KURUCU DAVRANIŞ SÖZLEŞMESİ (ürünün ön koşulu)
   Kurucu gelen tanıdık-yol sorularını özel DM'de cevaplamayı bırakır;
   tek tıkla sisteme yönlendirir: "Buni Muhandisda javob beraman".

1. Genç Telegram'dan tek tıkla girer (initData HMAC; ayrı kayıt yok).
   8 adımlı form değil → kısa karşılama + TEK kutu: "Nima bilmoqchisan?"
   + Kapı seçici (varsayılan: Herkese açık).

2. AI/sistem soruyu mevcut kapsüllere karşı tarar (Faz 0: elle; Faz 1: metin araması).
   Eşleşme varsa kartı ANINDA gösterir — kurucu hiç dokunmaz. (Acının doğrudan çözümü.)

3. Eşleşme yoksa, seçilen kapıya göre:
   (a) Herkese açık → soru akışa düşer, isteyen üstlenir/cevaplar.
   (b) Hedefli/kişiye → ilgili kullanıcı(lar)a bot DM: [Üstlen] [Pas] [Başkasını öner].
   (c) Kimse yoksa → "Boş Arama Sinyali": arayana "ilk cevaplayan SEN ol",
       kurucuya admin kuyruğunda kanıtlanmış talep bileti. AI CEVAP UYDURMAZ.

4. Cevaplayan yazar → (Faz 1) sistem yapılandırılmış bir kapsül taslağı önerir →
   yazar [Yayınla]/[Düzelt]/[Atla]. HİÇBİR cevap insan onayı olmadan yayınlanmaz.

5. Onaylanan cevap → kalıcı, aranabilir, deep-link'lenebilir Cevap Kapsülü (önce uz+ru).

6. Sorana "cevabın hazır" bot DM'i. Cevaplayana, kapsül her yeniden kullanıldığında
   gecikmeli/toplu "Yankı" (Aks-sado) bildirimi.
```

Her tur grafı zenginleştirir, talep haritasını netleştirir, kurucunun tekrar yükünü düşürür.

## 7. Faz 0 — Sıfır-Kod Konsiyerj (Wizard-of-Oz)

**Amaç:** AI altyapısına tek kuruş harcamadan en pahalı varsayımı elle yanlışla: *"Gerçek sorular gelir → yönlendirilir → cevaplanır → cevaptan kapsül doğar → benzer soru o kapsüle yönlenir → kurucunun yükü AZALIR"* — bu döngü gerçekten dönüyor mu?

Sıfırdan başladığımız için Faz 0'ın işi **arzı ve talebi tohumlamaktır** (kapsülü değil):

- **Kurucu Davranış Sözleşmesi** — gelen tanıdık-yol sorularını özel DM yerine sisteme akıt. *Ürünün gerçek başarı koşulu budur.*
- **İnsanı tohumla** — ilk ~25-50 güvenilir mühendisi (kurucunun çevresi: Baykar/yurtdışı) elle davet et. Cevaplayacak arz bunlar.
- **Talebi tohumla** — gelen ilk gerçek sorular + her boş arama elle kaydedilir → ilk **talep ısı haritası**.
- **Elle yönlendirme + elle kapsül** — kurucu/küçük çekirdek soruları doğru kişiye elle iletir; gelen cevapları basit bir not deposunda kanonik karta çevirir. (AI yok, basit araçlar: mevcut admin + Telegram.)
- **Öldürme kriterleri** baştan yazılır.

**Faz 0 araçları (minimum kod):** mevcut `posts(type=question)` + admin paneli + bot DM yeter; gerekirse küçük bir "kapsül notu" alanı. Hedef: davranışı ve döngüyü test etmek, ürün inşa etmek değil.

**Başarı / öldürme metriği (Ay 1):**
- ≥10 kapsül **gelen gerçek sorulardan** doğdu, **VE**
- bunlardan en az birkaçı **birden fazla kez** yeniden kullanıldı (benzer soruya gösterildi), **VE**
- kurucunun tekrar eden sorulara harcadığı süre ölçülebilir biçimde düştü.
- **Bu olmadıysa kapsül hipotezi yanlıştır → HİÇBİR AI yatırımı yapılmaz, döngü yeniden tasarlanır.**

## 8. Faz 1 — Sihirli Çekirdeği Otomatikleştir

**Amaç:** Faz 0'da kanıtlanan döngüyü **en az altyapıyla** otomatikleştir; ilk ziyaretçi boşluk değil değer görsün. **Sadece çekirdek.** Kimlik/kefalet/pasaport YOK.

**Özellikler:**

1. **Bitta Savol onboarding** — form değil; kısa karşılama + tek soru kutusu + Dört Kapı seçici (varsayılan herkese açık).
2. **Cevap Kapsülü** — insan cevabını kalıcı, aranabilir, deep-link'lenebilir karta çevirir; tek-tık onay (Yayınla/Düzelt/Atla); versiyonlanır; önce uz+ru. Mevcut `lib/og/card.tsx` ile paylaşım kartı.
3. **Soru İkizi (basit dedup)** — soru yazılırken sistem en yakın kapsülleri **gönderimden önce** gösterir. **Faz 1'de AI/embedding değil**, Postgres metin araması (`tsvector` / trigram) ile başlar; dürüst sınır: <50 kapsülde çoğu zaman boş döner — o boşluğu Boş Arama Sinyali doldurur. (Embedding/semantik arama Faz 2.)
4. **Dört Kapı yönlendirme** — herkese açık (varsayılan) / etikete hedefli / belirli kişiye. Bot DM ile Üstlen/Pas/Başkasını öner.
5. **Boş Arama Sinyali** — boş aramayı "ilk sen ol" kancası + admin talep bileti olarak yakala; tekrar eden boş aramalar talep ısı haritasına akar.
6. **Admin yönlendirme paneli** — kurucu açık/yanıtsız soruyu elle bir kişiye atar (Wizard-of-Oz routing).
7. **Boş Graf / halüsinasyon-güvenli mod** — veri yoksa sistem cevap ÜRETMEZ; soruyu sinyal olarak yakalar ve insana eskale eder. (Faz 1'de AI taslağı yok; bu Faz 2 RAG işi.)
8. **Hayalet mod** — anonim-önce, sıfır kayıt sürtünmesi (tam kimlik modeli Faz 2).
9. **Rahmat** — pozitif-tek onay reaksiyonu (mevcut `reactions`); **downvote YOK.**

**Başarı metriği (Ay 2-3):**
- Gelen soruların belirlenen oranı kurucu hiç dokunmadan kapsülle kapanıyor.
- Her ilk oturumda kullanıcı ya işe yarar cevap/yönlendirme ya da anlamlı "ilk sen ol" kancası alıyor (kuru boş ekran ≈ 0).
- Kurucu yükü Faz 0'a göre düşmeye devam ediyor.

## 9. Veri modeli (mevcut şemaya ekler)

Mevcut tablolar yeniden kullanılır: `users`, `profiles`, `engineeringFields`/`profileFields`, `skills`/`profileSkills`, `interests`/`profileInterests`, `topics`, `posts(type=question)`, `comments`, `reactions`, `follows`, `reports`, `referralClaims`, `spotlights`.

**Yeni (Faz 1):**

- **`questions`** (veya `posts.type='question'` üzerine kurulu meta) — soru metni, soran, **kapı tipi** (`public`|`tag`|`direct`), hedef etiketler/hedef kullanıcı, durum (`open`|`assigned`|`answered`|`empty_signal`), dil.
- **`question_targets`** — hedefli/kişiye sorularda (soru, hedef kullanıcı, kaynak: `asker`|`admin`, durum: `pending`|`accepted`|`passed`).
- **`capsules`** — kanonik cevap kartı: başlık, gövde, dil, etiketler (topic/field), `authoredBy`, `sourceQuestionId`, sürüm, `reuseCount`, oluşturma/güncelleme.
- **`capsule_links`** — bir sorunun hangi kapsüle bağlandığı (yeniden kullanım sayımı + Yankı için).
- **`empty_signals`** — boş arama kaydı: sorgu metni, normalize edilmiş etiket, sayım (talep ısı haritası).

(Kesin sütunlar uygulama planında; Faz 0 bunların çoğunu elle/mevcut tablolarla taklit eder.)

## 10. Kimlik, anonimlik & güven (özet — detay Faz 2)

**Tek Kök, İki Yüz.** Her hesap görünmez tek bir köke (Telegram `telegramId`, initData HMAC) bağlı. Üstüne ya gerçek yüz ya da **tek + kalıcı** maske (Niqob). İtibar köke yazılır, seçilen yüze yansır → "anonim ama itibarlı" + pratik Sybil bariyeri.

**Kafil (kefalet zinciri).** Güven kurucudan (`referredBy` zaten var) dallanır, derinlikle azalır; kefil itibarını riske atar.

**Doğrulama belge değil KANIT'la:** GitHub OAuth, kurumsal e-posta domaini, akran çapraz-kefaleti → üç kademeli rozet (gri Telegram → yeşil Kefilli → mavi Kanıtlı).

**Moderasyon:** kademeli ve geri alınabilir (rapor→throttle→sessize→gölge); geri dönüşsüz **kök-ban yalnız kurucuda**, görünür gerekçe + itiraz hakkıyla, son çare. Küçük diasporada her yanlış-ban felakettir.

> **Faz sıralaması notu:** Bu model güçlü ama **Faz 1'in işi değil.** Faz 1 = hayalet mod + anonim-önce. Tam kimlik/kefalet ancak döngü kanıtlandıktan sonra (Faz 2) inşa edilir.

## 11. "Sıkıcı olmayan" ilkeler (oyunlaştırma anayasası)

- **Liderlik tablosu / global sıralama / lig YOK** — küçük grafikte kurucu sonsuza dek #1, yeni gelen ezilir. Kıyas yerine kişisel etki anlatısı (AI Yilnoma, Faz 3).
- **Downvote / alenen aşağılama YOK** — küçük diasporada tek aşağılanma birini sonsuza dek kaybettirir. Tek sinyal pozitif: **Rahmat.**
- **Günlük streak YOK** — sömürücü karanlık desen. Ritim olacaksa opt-in, affedici, mevsimlik.
- **İtibar mühendis-yerli dilde** — CI "passing/mentor-ochiq" yeşil rozeti, kariyer "changelog" (v2.4.0 — yeni şehir), semver/build-status estetiği. Çocuksu maskot/konfeti DEĞİL.
- **Puan ham sayımdan değil GERÇEK ETKİDEN** — yeniden-kullanım yankısı, tutmuş kefalet, işe dönüşen tanıştırma.
- **Roller statü-yarışı değil HİZMET** — Aksakal, Hakam, Kafil, Hudud elchisi (GitHub "maintainer" mantığı).
- **Bildirim spam'i YOK** — haftalık tek güçlü kişiselleştirilmiş vuruş; yankılar gecikmeli/toplu.
- **Oyunlaştırma opt-in ve arka planda** — anonim/çekingen kullanıcıya dayatılmaz.

## 12. Faz 2 & Faz 3 — Yol haritası (sonra detaylandırılacak)

**Faz 2 — Yükü dağıt, güveni inşa et:** Tek Kök/İki Yüz kimlik + üç kademeli rozet, Kafil, RAG taslak (Onayla/Düzelt/Reddet), Cevap Yankısı, AI önerili yönlendirici (Dört Kapı'nın 4. kapısı), embedding tabanlı semantik dedup, **Kıtlık-korumalı Tanıştırma Köprüsü** (çift opt-in + aylık intro jetonu), mühendis-yerli statü katmanı, **Kashfiyotchi** (şehirde-ilk anlık bağ), **Muhandis Pasporti** + **Vizitka Inline**, kademeli dil genişlemesi (en/tr talep ısı haritası gösterince).

**Faz 3 — Kendini büyüten kürasyonlu yapı:** **Mehfil** (eşik-tetiklemeli salonlar — boş oda yaratmadan), **AI Yilnoma** (liderlik tablosu yerine kişisel mevsim anlatısı), **Yashovchi Hujjat** (kapsül tazelik teyidi), **Qaytish Ko'prigi** (kefil zorunlu iş/referans köprüsü + aylık iş drop), **Hudud Elchilari** + açık kaynak gönüllü rolleri, yumuşak yaptırım merdiveni.

## 13. Riskler & önlemler

| Risk | Önlem |
|---|---|
| **En büyük sessiz risk:** kurucu alışkanlığını değiştirmez, hâlâ özel DM'de cevaplar → sistem değer yakalamaz | Kurucu Davranış Sözleşmesi Faz 0'ın 1. maddesi; başarı metriği bu davranışı doğrudan ölçer |
| Cold-start: asıl kıt kaynak **soru hacmi** | Boş Arama Sinyali Faz 1 kalbinde + davranış sözleşmesi mevcut DM inbound'unu sisteme yönlendirir |
| Halüsinasyon: boş grafikte AI cevap üretirse en çok güvenildiği anda en zayıf | Veri yokken cevap ÜRETME; sinyal + insana eskale; AI taslağı yalnız RAG + "doğrulanmadı" + insan onayı (Faz 2) |
| Aşırı mühendislik (erken semantik/yük-dengeli routing) | Faz 1 = metin araması + Dört Kapı; embedding & AI öneri Faz 2 |
| Özellik dağılması (24 mekaniği yığmak) | Risk-sıralı yol haritası; her faz öldürme kriterli |
| x4 çeviri maliyeti | Kademeli dil: önce uz+ru; en/tr talep ısı haritası gösterince |
| Yanlış-ban toksisitesi | Liderlik tablosu/downvote/streak yok; kademeli geri-alınabilir yaptırım; kök-ban son çare + itiraz |

## 14. Açık sorular (Faz 0 başlamadan netleştirilecek)

1. **İlk halka:** ~25-50 kişilik concierge davet listesi kim? Rol-model olacak ilk mühendis halkası net mi?
2. **Davranış sözleşmesi pratiği:** kurucu gelen her özel DM'yi sisteme yönlendirme disiplinini ne hatırlatacak/zorlayacak?
3. **Öldürme kriteri kabulü:** "Ay 1'de ≥10 kapsül + birkaç yeniden-kullanım" eşiği gerçekçi ve kabul edilebilir mi?
4. **Dil:** uz+ru ile başlamak çekirdek için yeterli mi?
5. **Anonim katkı ağırlığı:** Niqob kullanıcı kapsül "imzalayabilecek" mi; yönlendirmede ağırlığı ne? (Faz 2 tasarımına girer)
6. **AI bütçe/gizlilik:** embedding+çeviri+taslak maliyeti ve kişisel-veri temizleme politikası (Faz 2 öncesi).

---

*Bu tasarım, 11-mercekli yaratıcı keşif ağı (araştırma + icat) + adversaryal eleştiri turundan damıtıldı. Kaynak ham fikirler ve eleştiri çıktısı oturum çalışma dosyalarında saklı.*
