export const parseUrlParams = (url?: string) => {
  const params = new URL(url ?? document.location.toString()).searchParams;

  return {
    params,
    int: (name: string, defaultValue: number = Number.NaN) => intParamOrDefault(params, name, defaultValue),
    float: (name: string, defaultValue: number = Number.NaN) => floatParamOrDefault(params, name, defaultValue),
    string: (name: string, defaultValue: string = ``) => stringParamOrDefault(params, name, defaultValue),
    bool: (name: string) => boolParamOrDefault(params, name)
  }
}

/**
 * Return an integer value from URL parameter or use a default value.
 * Value is considered _false_ if it's not present, or it is explicitly 'false'
 * @returns 
 */
function boolParamOrDefault(params: URLSearchParams, name: string) {
  const p = params.get(name);
  if (p === null) return false;

  if (p === `true`) return true;
  return false;
}

/**
 * Return an integer value from URL parameter or use a default value
 * @returns 
 */
function intParamOrDefault(params: URLSearchParams, name: string, defaultValue: number) {
  const p = params.get(name);
  if (p !== null) {
    const v = Number.parseInt(p);
    return v;
  }
  return defaultValue;
}

/**
 * Return a float value from URL parameter or use a default value
 * @returns 
 */
function floatParamOrDefault(params: URLSearchParams, name: string, defaultValue: number) {
  const p = params.get(name);
  if (p !== null) {
    const v = Number.parseFloat(p);
    return v;
  }
  return defaultValue;
}

/**
 * Return a string value from URL parameter or use a default value
 * @returns 
 */
function stringParamOrDefault(params: URLSearchParams, name: string, defaultValue: string) {
  const p = params.get(name);
  if (p !== null) {
    return p;
  }
  return defaultValue;
}