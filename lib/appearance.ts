export const colorSchemes = [
  { id: 'sage', name: 'Sage', description: 'Soft greens and warm whites', colors: ['#f4f5ee', '#dfe6d5', '#566b45'] },
  { id: 'slate', name: 'Slate', description: 'Cool neutrals and quiet blues', colors: ['#f1f4f8', '#dce4ef', '#456389'] },
  { id: 'sand', name: 'Sand', description: 'Warm neutrals and earthy accents', colors: ['#f7f2eb', '#eadfce', '#896445'] },
] as const;

export const fontOptions = [
  { id: 'inter', name: 'Inter', description: 'Clean and modern', family: 'var(--font-inter), Arial, sans-serif' },
  { id: 'arial', name: 'Arial', description: 'Simple and familiar', family: 'Arial, Helvetica, sans-serif' },
  { id: 'georgia', name: 'Georgia', description: 'Warm and expressive', family: 'Georgia, "Times New Roman", serif' },
] as const;

export type Appearance = {
  colorScheme: typeof colorSchemes[number]['id'];
  font: typeof fontOptions[number]['id'];
};

export const defaultAppearance: Appearance = { colorScheme: 'sage', font: 'inter' };

export function parseAppearance(value: unknown): Appearance {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    colorScheme: colorSchemes.find(scheme => scheme.id === input.colorScheme)?.id ?? defaultAppearance.colorScheme,
    font: fontOptions.find(font => font.id === input.font)?.id ?? defaultAppearance.font,
  };
}
