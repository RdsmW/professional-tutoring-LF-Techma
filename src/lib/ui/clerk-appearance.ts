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

/** Clerk SignIn / SignUp — website navy primary, minimal card chrome. */
export function authClerkAppearance(): ClerkAppearance {
  return {
    variables: {
      colorPrimary: "#010345",
      colorPrimaryForeground: "#ffffff",
      colorBackground: "transparent",
      colorForeground: "#2A2A2A",
      colorMutedForeground: "#697486",
      colorMuted: "#F4F4F4",
      colorBorder: "#e3e6e2",
      colorInput: "#ffffff",
      colorInputForeground: "#2A2A2A",
      colorNeutral: "#010345",
      colorShadow: "transparent",
      borderRadius: "4px",
      fontFamily: '"PT Sans", Helvetica, Arial, sans-serif',
      fontFamilyButtons: '"PT Sans", Helvetica, Arial, sans-serif',
    },
    elements: {
      rootBox: "pt-auth-clerk-root",
      card: "pt-auth-clerk-card",
      headerTitle: "pt-auth-clerk-header-title",
      headerSubtitle: "pt-auth-clerk-header-subtitle",
      socialButtonsBlockButton: "pt-auth-clerk-social",
      dividerRow: "pt-auth-clerk-divider",
      formButtonPrimary: "pt-auth-clerk-primary",
      footerActionLink: "pt-auth-clerk-footer-link",
    },
  };
}
