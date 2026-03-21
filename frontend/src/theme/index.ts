import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        weirwood: {
          red: { value: "#C53030" },
          bark: { value: "#1A1A2E" },
          leaf: { value: "#E2E8F0" },
          sap: { value: "#FEB2B2" },
          darkBg: { value: "#0f0f1a" },
          cardDark: { value: "#16162a" },
          cardLight: { value: "#ffffff" },
        },
      },
      fonts: {
        prophecy: { value: "'JetBrains Mono', 'Fira Code', monospace" },
      },
    },
    semanticTokens: {
      colors: {
        "bg.surface": {
          value: { _light: "{colors.gray.50}", _dark: "{colors.weirwood.darkBg}" },
        },
        "bg.card": {
          value: { _light: "{colors.weirwood.cardLight}", _dark: "{colors.weirwood.cardDark}" },
        },
        "text.primary": {
          value: { _light: "{colors.gray.800}", _dark: "{colors.gray.100}" },
        },
        "text.secondary": {
          value: { _light: "{colors.gray.600}", _dark: "{colors.gray.400}" },
        },
        accent: {
          value: { _light: "{colors.weirwood.red}", _dark: "{colors.weirwood.sap}" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
