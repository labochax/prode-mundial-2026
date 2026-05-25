import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  emptyProfileSuggestions,
  type ProfileSuggestions,
} from "@/lib/profiles/profile-suggestions";
import {
  normalizeProfileSuggestionKey,
  normalizeProfileText,
} from "@/lib/profiles/profile-normalization";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;

type SuggestionRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "city"
  | "country"
  | "favorite_team"
  | "graduation_year_or_category"
  | "prode_subgroup"
  | "prode_subgroups"
  | "province"
  | "school_group"
>;
type ScalarSuggestionKey = Exclude<keyof SuggestionRow, "prode_subgroups">;

const suggestionLimit = 500;
const valuesPerFieldLimit = 24;

function collectSuggestions(
  rows: SuggestionRow[],
  key: ScalarSuggestionKey,
) {
  const values = new Map<string, string>();

  for (const row of rows) {
    const rawValue = row[key];

    if (!rawValue) {
      continue;
    }

    const normalizedValue = normalizeProfileText(rawValue);

    if (!normalizedValue) {
      continue;
    }

    const normalizedKey = normalizeProfileSuggestionKey(normalizedValue);

    if (!values.has(normalizedKey)) {
      values.set(normalizedKey, normalizedValue);
    }
  }

  return [...values.values()]
    .sort((left, right) => left.localeCompare(right, "es-AR"))
    .slice(0, valuesPerFieldLimit);
}

function collectSubgroupSuggestions(rows: SuggestionRow[]) {
  const values = new Map<string, string>();

  for (const row of rows) {
    const rawValues = [
      row.prode_subgroup,
      ...(Array.isArray(row.prode_subgroups) ? row.prode_subgroups : []),
    ];

    for (const rawValue of rawValues) {
      if (!rawValue) {
        continue;
      }

      const normalizedValue = normalizeProfileText(rawValue);

      if (!normalizedValue) {
        continue;
      }

      const normalizedKey = normalizeProfileSuggestionKey(normalizedValue);

      if (!values.has(normalizedKey)) {
        values.set(normalizedKey, normalizedValue);
      }
    }
  }

  return [...values.values()]
    .sort((left, right) => left.localeCompare(right, "es-AR"))
    .slice(0, valuesPerFieldLimit);
}

export async function getProfileSuggestions(
  client: SupabaseDatabaseClient,
): Promise<ProfileSuggestions> {
  const { data, error } = await client
    .from("profiles")
    .select(
      [
        "city",
        "country",
        "favorite_team",
        "graduation_year_or_category",
        "prode_subgroup",
        "prode_subgroups",
        "province",
        "school_group",
      ].join(", "),
    )
    .limit(suggestionLimit);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[getProfileSuggestions]", {
        message: error.message,
      });
    }

    return emptyProfileSuggestions;
  }

  const rows = (data ?? []) as unknown as SuggestionRow[];

  return {
    cities: collectSuggestions(rows, "city"),
    countries: collectSuggestions(rows, "country"),
    favoriteTeams: collectSuggestions(rows, "favorite_team"),
    graduationYearsOrCategories: collectSuggestions(
      rows,
      "graduation_year_or_category",
    ),
    prodeSubgroups: collectSubgroupSuggestions(rows),
    provinces: collectSuggestions(rows, "province"),
    schoolGroups: collectSuggestions(rows, "school_group"),
  };
}
