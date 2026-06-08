"use server";

import { getAllCitiesOfCountry } from "@countrystatecity/countries";

// Seçilen ülkenin şehirlerini (benzersiz, sıralı isimler) sunucudan döner.
// Büyük şehir veri seti istemciye gitmez; yalnızca seçilen ülkenin dilimi gelir.
export async function citiesForCountry(iso2: string): Promise<string[]> {
  const code = iso2?.trim().toUpperCase();
  if (!code || code.length !== 2) return [];
  try {
    const cities = await getAllCitiesOfCountry(code);
    const names = [...new Set(cities.map((c) => c.name))];
    names.sort((a, b) => a.localeCompare(b));
    return names;
  } catch {
    return [];
  }
}
