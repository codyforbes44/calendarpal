export interface BookingTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
  };
}

export const BOOKING_THEMES: BookingTheme[] = [
  {
    id: "default",
    name: "Default",
    description: "Clean indigo theme",
    colors: {
      primary: "238 76% 60%",
      primaryForeground: "0 0% 100%",
      accent: "238 76% 95%",
      accentForeground: "238 76% 30%",
      background: "240 5% 96%",
      foreground: "240 10% 10%",
      card: "0 0% 100%",
      cardForeground: "240 10% 10%",
      muted: "240 5% 92%",
      mutedForeground: "240 4% 46%",
      border: "240 6% 90%",
    },
  },
  {
    id: "warm",
    name: "Warm",
    description: "Earthy amber tones",
    colors: {
      primary: "25 95% 53%",
      primaryForeground: "0 0% 100%",
      accent: "25 95% 94%",
      accentForeground: "25 80% 30%",
      background: "30 20% 96%",
      foreground: "20 14% 12%",
      card: "0 0% 100%",
      cardForeground: "20 14% 12%",
      muted: "30 15% 91%",
      mutedForeground: "20 10% 46%",
      border: "30 12% 88%",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool teal & blue",
    colors: {
      primary: "187 72% 45%",
      primaryForeground: "0 0% 100%",
      accent: "187 72% 93%",
      accentForeground: "187 72% 25%",
      background: "190 15% 96%",
      foreground: "200 18% 10%",
      card: "0 0% 100%",
      cardForeground: "200 18% 10%",
      muted: "190 12% 91%",
      mutedForeground: "200 8% 46%",
      border: "190 10% 88%",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Natural green palette",
    colors: {
      primary: "152 60% 40%",
      primaryForeground: "0 0% 100%",
      accent: "152 50% 92%",
      accentForeground: "152 60% 22%",
      background: "140 10% 96%",
      foreground: "150 15% 10%",
      card: "0 0% 100%",
      cardForeground: "150 15% 10%",
      muted: "140 8% 91%",
      mutedForeground: "150 6% 46%",
      border: "140 8% 88%",
    },
  },
];

export function getThemeById(themeId: string): BookingTheme {
  return BOOKING_THEMES.find((t) => t.id === themeId) || BOOKING_THEMES[0];
}

export function buildThemeCSSVars(
  theme: BookingTheme,
  customColor?: string | null
): Record<string, string> {
  const colors = { ...theme.colors };

  // If a custom brand color is provided, override the primary
  if (customColor) {
    colors.primary = customColor;
  }

  return {
    "--booking-primary": colors.primary,
    "--booking-primary-foreground": colors.primaryForeground,
    "--booking-accent": colors.accent,
    "--booking-accent-foreground": colors.accentForeground,
    "--booking-background": colors.background,
    "--booking-foreground": colors.foreground,
    "--booking-card": colors.card,
    "--booking-card-foreground": colors.cardForeground,
    "--booking-muted": colors.muted,
    "--booking-muted-foreground": colors.mutedForeground,
    "--booking-border": colors.border,
  };
}
