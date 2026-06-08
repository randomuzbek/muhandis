"use server";

import {
  searchProfiles,
  type DirectoryFilters,
  type DirectoryCard,
} from "@/lib/queries/directory";

export async function searchProfilesAction(
  filters: DirectoryFilters,
): Promise<DirectoryCard[]> {
  return searchProfiles(filters, 60);
}
