export type ProcessorModes = `pose` | `objects` | `hand` | `face`;

export const getProcessorModes = () => [ `pose`, `objects`, `hand`, `face` ];

export const validateProcessorMode = (a: any, fallback?: ProcessorModes): ProcessorModes => {
  if (typeof a === `string`) {
    if (a === `pose`) return `pose`;
    if (a === `hand`) return `hand`;
    if (a === `face`) return `face`;
    if (a === `objects`) return `objects`;
  }
  if (fallback) return fallback;
  throw new Error(`Invalid mode: ${ a }. Expected: ${ getProcessorModes().join(`,`) }`);
}

