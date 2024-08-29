export const makeModelPath = (basePath: string, provided: string) => {
  if (provided.startsWith(`http`)) return provided;
  return basePath + provided;
}