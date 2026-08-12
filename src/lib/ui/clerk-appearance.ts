/** Clerk UserButton appearance + CSS class hooks used with globals.css overrides. */

type ClerkAppearance = {
  variables?: Record<string, string>;
  elements?: Record<string, string>;
};

const sharedElements = {
  avatarBox: "pt-user-avatar",
  userButtonTrigger: "pt-user-trigger",
  userButtonPopoverCard: "pt-user-popover",
  userButtonPopoverMain: "pt-user-popover-main",
  userButtonPopoverFooter: "pt-user-popover-footer",
  userButtonPopoverActionButton: "pt-user-popover-action",
  userButtonPopoverActionButtonText: "pt-user-popover-action-text",
  userPreviewMainIdentifier: "pt-user-preview-name",
  userPreviewSecondaryIdentifier: "pt-user-preview-secondary",
};

export function staffUserButtonAppearance(): ClerkAppearance {
  return {
    variables: {
      colorPrimary: "#e96d5e",
      colorPrimaryForeground: "#ffffff",
      colorBackground: "#ffffff",
      colorForeground: "#172133",
      colorMutedForeground: "#697486",
      colorMuted: "#f5f6f3",
      colorBorder: "#e3e6e2",
      colorInput: "#fbfcfa",
      colorInputForeground: "#172133",
      colorNeutral: "#15273f",
      colorShadow: "rgba(20, 39, 63, 0.12)",
      borderRadius: "2px",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontFamilyButtons: "Arial, Helvetica, sans-serif",
    },
    elements: {
      ...sharedElements,
      rootBox: "pt-user-root pt-user-root-staff",
    },
  };
}

export function familyUserButtonAppearance(): ClerkAppearance {
  return {
    variables: {
      colorPrimary: "#ca6d52",
      colorPrimaryForeground: "#ffffff",
      colorBackground: "#ffffff",
      colorForeground: "#172133",
      colorMutedForeground: "#697486",
      colorMuted: "#f6f5ef",
      colorBorder: "#e3e6e2",
      colorInput: "#fbfcfa",
      colorInputForeground: "#172133",
      colorNeutral: "#24382f",
      colorShadow: "rgba(20, 39, 63, 0.12)",
      borderRadius: "2px",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontFamilyButtons: "Arial, Helvetica, sans-serif",
    },
    elements: {
      ...sharedElements,
      rootBox: "pt-user-root pt-user-root-family",
    },
  };
}
