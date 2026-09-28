/** Colours for one appearance mode. */
export type Palette = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
};

export type ColorScheme = {
  id: string;
  name: string;
  /** The second colour in the pair. */
  description: string;
  light: Palette;
  dark: Palette;
};

/**
 * Colour pairs for the Colours & themes step.
 * Each pair has a light palette and a dark palette.
 */
export const colorSchemes: ColorScheme[] = [
  {
    id: "synthetic-lime",
    name: "Synthetic Lime",
    description: "Bio Black",
    light: {
      background: "#F7F8F2",
      surface: "#FFFFFF",
      text: "#101610",
      muted: "#3E5248",
      accent: "#9AC400",
      onAccent: "#142006",
    },
    dark: {
      background: "#0C1410",
      surface: "#17241C",
      text: "#F3F6EE",
      muted: "#B7C4B4",
      accent: "#D8FF4D",
      onAccent: "#142006",
    },
  },
  {
    id: "hyper-cobalt",
    name: "Hyper Cobalt",
    description: "Sin Sand",
    light: {
      background: "#FFF8F4",
      surface: "#FFFFFF",
      text: "#1A120E",
      muted: "#6A5044",
      accent: "#0033EE",
      onAccent: "#FFFFFF",
    },
    dark: {
      background: "#14110F",
      surface: "#2A211C",
      text: "#FFF4EC",
      muted: "#E2C2A8",
      accent: "#8AA4FF",
      onAccent: "#101428",
    },
  },
  {
    id: "toxic-phosphor",
    name: "Toxic Phosphor",
    description: "Soft Slate",
    light: {
      background: "#F7F4FB",
      surface: "#FFFFFF",
      text: "#1B0E2A",
      muted: "#5A5168",
      accent: "#6B21A8",
      onAccent: "#F8F2FF",
    },
    dark: {
      background: "#140A1C",
      surface: "#261436",
      text: "#F6F0FF",
      muted: "#CDB8E4",
      accent: "#D8B4FE",
      onAccent: "#1B0E2A",
    },
  },
  {
    id: "carbon-teal",
    name: "Carbon Teal",
    description: "Mint Foam",
    light: {
      background: "#F3FBF7",
      surface: "#FFFFFF",
      text: "#063033",
      muted: "#3B5C58",
      accent: "#0F766E",
      onAccent: "#F0FDFA",
    },
    dark: {
      background: "#062426",
      surface: "#0E3A3C",
      text: "#F2FFF8",
      muted: "#B7DCC8",
      accent: "#5EEAD4",
      onAccent: "#042F32",
    },
  },
  {
    id: "lead",
    name: "Lead",
    description: "Glass Blue",
    light: {
      background: "#F4FBFE",
      surface: "#FFFFFF",
      text: "#0C2A34",
      muted: "#456571",
      accent: "#0E7490",
      onAccent: "#F4FBFE",
    },
    dark: {
      background: "#07141A",
      surface: "#12303A",
      text: "#F3FCFF",
      muted: "#B7D8E4",
      accent: "#7DD3FC",
      onAccent: "#07141A",
    },
  },
  {
    id: "warm-lime",
    name: "Warm Lime",
    description: "Olive Ink",
    light: {
      background: "#F8F7F0",
      surface: "#FFFFFF",
      text: "#2A2E18",
      muted: "#5A6046",
      accent: "#5C7200",
      onAccent: "#F8FFE8",
    },
    dark: {
      background: "#16180E",
      surface: "#2C3118",
      text: "#F7F8EE",
      muted: "#D2D6B6",
      accent: "#E4FF8A",
      onAccent: "#1C2010",
    },
  },
];
