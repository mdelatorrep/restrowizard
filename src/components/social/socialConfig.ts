export const platformConfig: Record<string, { label: string; color: string }> = {
  google: { label: 'Google', color: 'bg-blue-100 text-blue-800' },
  tripadvisor: { label: 'TripAdvisor', color: 'bg-green-100 text-green-800' },
  yelp: { label: 'Yelp', color: 'bg-red-100 text-red-800' },
  instagram: { label: 'Instagram', color: 'bg-pink-100 text-pink-800' },
  facebook: { label: 'Facebook', color: 'bg-indigo-100 text-indigo-800' },
  twitter: { label: 'Twitter/X', color: 'bg-sky-100 text-sky-800' },
};

export const PLATFORM_OPTIONS = [
  { value: 'google', label: 'Google' },
  { value: 'tripadvisor', label: 'TripAdvisor' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter/X' },
];
