// Mühendislik alanları taksonomisi (4 dilli) + onboarding sabitleri.
// Bu liste db/seed.ts ile engineering_fields tablosuna yazılır.

export type LocalizedLabel = { uz: string; en: string; ru: string; tr: string };

export const ENGINEERING_FIELDS: { slug: string; labels: LocalizedLabel }[] = [
  { slug: "software", labels: { uz: "Dasturiy ta'minot", en: "Software", ru: "Программная инженерия", tr: "Yazılım" } },
  { slug: "mechanical", labels: { uz: "Mexanika", en: "Mechanical", ru: "Механика", tr: "Makine" } },
  { slug: "electrical", labels: { uz: "Elektrotexnika", en: "Electrical", ru: "Электротехника", tr: "Elektrik" } },
  { slug: "electronics", labels: { uz: "Elektronika", en: "Electronics", ru: "Электроника", tr: "Elektronik" } },
  { slug: "aerospace", labels: { uz: "Aerokosmik", en: "Aerospace", ru: "Аэрокосмическая", tr: "Havacılık ve Uzay" } },
  { slug: "civil", labels: { uz: "Qurilish", en: "Civil", ru: "Строительство", tr: "İnşaat" } },
  { slug: "chemical", labels: { uz: "Kimyo", en: "Chemical", ru: "Химическая", tr: "Kimya" } },
  { slug: "mechatronics", labels: { uz: "Mexatronika", en: "Mechatronics", ru: "Мехатроника", tr: "Mekatronik" } },
  { slug: "robotics", labels: { uz: "Robototexnika", en: "Robotics", ru: "Робототехника", tr: "Robotik" } },
  { slug: "industrial", labels: { uz: "Sanoat", en: "Industrial", ru: "Промышленная", tr: "Endüstri" } },
  { slug: "energy", labels: { uz: "Energetika", en: "Energy", ru: "Энергетика", tr: "Enerji" } },
  { slug: "materials", labels: { uz: "Materialshunoslik", en: "Materials", ru: "Материаловедение", tr: "Malzeme" } },
  { slug: "automotive", labels: { uz: "Avtomobilsozlik", en: "Automotive", ru: "Автомобилестроение", tr: "Otomotiv" } },
  { slug: "biomedical", labels: { uz: "Biotibbiyot", en: "Biomedical", ru: "Биомедицинская", tr: "Biyomedikal" } },
  { slug: "data-ai", labels: { uz: "Ma'lumotlar va SI", en: "Data & AI", ru: "Данные и ИИ", tr: "Veri ve YZ" } },
  { slug: "other", labels: { uz: "Boshqa", en: "Other", ru: "Другое", tr: "Diğer" } },
];

// Forum konuları
export const TOPICS: { slug: string; labels: LocalizedLabel }[] = [
  { slug: "general", labels: { uz: "Umumiy", en: "General", ru: "Общее", tr: "Genel" } },
  { slug: "career", labels: { uz: "Karyera", en: "Career", ru: "Карьера", tr: "Kariyer" } },
  { slug: "study-abroad", labels: { uz: "Chet elda o'qish", en: "Study abroad", ru: "Учёба за рубежом", tr: "Yurtdışı eğitim" } },
  { slug: "jobs", labels: { uz: "Ish o'rinlari", en: "Jobs", ru: "Вакансии", tr: "İş ilanları" } },
  { slug: "projects", labels: { uz: "Loyihalar", en: "Projects", ru: "Проекты", tr: "Projeler" } },
  { slug: "help", labels: { uz: "Texnik yordam", en: "Technical help", ru: "Техпомощь", tr: "Teknik yardım" } },
];

export const EDUCATION_LEVELS = [
  "student",
  "bachelor",
  "master",
  "phd",
  "other",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export function labelFor(labels: LocalizedLabel, locale: string): string {
  return labels[locale as keyof LocalizedLabel] ?? labels.en;
}
