export type ProfileSuggestions = {
  cities: string[];
  countries: string[];
  favoriteTeams: string[];
  graduationYearsOrCategories: string[];
  prodeSubgroups: string[];
  provinces: string[];
  schoolGroups: string[];
};

export const emptyProfileSuggestions: ProfileSuggestions = {
  cities: [],
  countries: [],
  favoriteTeams: [],
  graduationYearsOrCategories: [],
  prodeSubgroups: [],
  provinces: [],
  schoolGroups: [],
};
