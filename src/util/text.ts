export const snipBefore = (input: string, match: string) => {
  const pos = input.indexOf(match);
  if (pos >= 0) {
    return input.substring(0, pos);
  }
  return input
}

export const afterMatch = (input: string, match: string) => {
  const pos = input.indexOf(match);
  if (pos >= 0) {
    return input.substring(pos + match.length);
  }
  return input;
}