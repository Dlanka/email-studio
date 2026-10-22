export interface ClientBrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

export interface ClientBrandFonts {
  primary: string;
  secondary: string;
  fallback: string;
}

export interface ClientLogoConfig {
  path: string;
  alt: string;
  width: number;
  height: number;
  url?: string;
}

export interface ClientCompanyConfig {
  name: string;
  website: string;
  address: string;
  supportEmail: string;
  socialLinks?: Record<string, string>;
}

export interface ClientDeliverablesConfig {
  templates: string[];
  signatures: boolean;
}

export interface ClientBuildOptions {
  minify: boolean;
  beautify: boolean;
  inlineCss: boolean;
  keepComments: boolean;
}

export interface ClientHostingConfig {
  assetBaseUrl?: string;
}

export interface ClientConfig {
  name: string;
  slug: string;
  version?: string;
  brand: {
    colors: ClientBrandColors;
    fonts: ClientBrandFonts;
    logo: ClientLogoConfig;
  };
  company: ClientCompanyConfig;
  deliverables: ClientDeliverablesConfig;
  buildOptions: ClientBuildOptions;
  hosting?: ClientHostingConfig;
}

export interface SignatureSocialLink {
  platform: string;
  url: string;
  label: string;
}

export interface SignatureData {
  fullName: string;
  jobTitle: string;
  department?: string;
  companyName: string;
  email: string;
  phone: string;
  mobile?: string;
  websiteUrl: string;
  websiteLabel?: string;
  address?: string;
  logoUrl: string;
  logoAlt: string;
  logoWidth?: number;
  logoHeight?: number;
  avatarUrl?: string;
  avatarAlt?: string;
  socialLinks?: SignatureSocialLink[];
  disclaimer?: string;
  badge?: {
    text: string;
    url?: string;
  };
}

export interface ValidationIssue {
  type: "error" | "warning";
  code: string;
  message: string;
  file?: string;
  line?: number;
}

export interface ValidationResult {
  clientSlug: string;
  valid: boolean;
  issues: ValidationIssue[];
  metrics: {
    templatesChecked: number;
    signaturesChecked: number;
    assetsChecked: number;
    htmlSizeWarnings: number;
  };
}
