import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation yardımcıları (Link, useRouter, redirect, usePathname)
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
