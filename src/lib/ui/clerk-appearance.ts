type ClerkAppearance = {
  variables?: Record<string, string>;
  elements?: Record<string, Record<string, string>>;
};

const baseVariables = {
  borderRadius: "2px",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontFamilyButtons: "Arial, Helvetica, sans-serif",
  colorBackground: "#ffffff",
  colorForeground: "#172133",
  colorMutedForeground: "#697486",
  colorMuted: "#f5f6f3",
  colorBorder: "#e3e6e2",
  colorInput: "#fbfcfa",
  colorInputForeground: "#172133",
  colorNeutral: "#15273f",
  colorShadow: "transparent",
};

const baseElements = {
  avatarBox: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
  },
  userButtonTrigger: {
    borderRadius: "50%",
  },
  userButtonPopoverCard: {
    borderRadius: "2px",
    border: "1px solid #e3e6e2",
    boxShadow: "0 12px 32px rgba(20, 39, 63, 0.07)",
  },
  userButtonPopoverMain: {
    borderRadius: "2px",
  },
  userButtonPopoverFooter: {
    background: "#f5f6f3",
    borderTop: "1px solid #e3e6e2",
  },
  userButtonPopoverActionButton: {
    borderRadius: "2px",
  },
  userButtonPopoverActionButtonText: {
    fontSize: "12px",
    fontWeight: "600",
  },
  userPreviewMainIdentifier: {
    fontFamily: "Georgia, serif",
    fontWeight: "700",
  },
};

export function staffUserButtonAppearance(): ClerkAppearance {
  return {
    variables: {
      ...baseVariables,
      colorPrimary: "#e96d5e",
      colorPrimaryForeground: "#ffffff",
    },
    elements: baseElements,
  };
}

export function familyUserButtonAppearance(): ClerkAppearance {
  return {
    variables: {
      ...baseVariables,
      colorPrimary: "#ca6d52",
      colorPrimaryForeground: "#ffffff",
      colorNeutral: "#24382f",
      colorMuted: "#f6f5ef",
    },
    elements: baseElements,
  };
}
