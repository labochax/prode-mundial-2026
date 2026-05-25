export function normalizeProfileText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeProfileSuggestionKey(value: string) {
  return normalizeProfileText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR");
}

export function normalizeOptionalProfileText(value: string) {
  const normalized = normalizeProfileText(value);

  return normalized.length > 0 ? normalized : null;
}

export function normalizeProfileSubgroups(values: string[]) {
  const subgroups = new Map<string, string>();

  for (const value of values) {
    const normalizedValue = normalizeProfileText(value);

    if (!normalizedValue) {
      continue;
    }

    const normalizedKey = normalizeProfileSuggestionKey(normalizedValue);

    if (!subgroups.has(normalizedKey)) {
      subgroups.set(normalizedKey, normalizedValue);
    }

    if (subgroups.size === 3) {
      break;
    }
  }

  return [...subgroups.values()];
}
