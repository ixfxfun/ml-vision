export const makeModelPath = (basePath: string, provided: string, presets: Record<string, string>) => {
  if (provided in presets) {
    const url = presets[ provided ];
    console.log(`Using model preset '${ provided }' Url: ${ url }`);
    return url;
  }
  if (provided.startsWith(`http`)) return provided;
  return basePath + provided;
}