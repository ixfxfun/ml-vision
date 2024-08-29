import { defineConfig } from 'tsup';

export default defineConfig({
  entryPoints: [ './src/index.ts' ],
  format: [ 'esm' ],
  target: "chrome130",
  dts: true,
  outDir: './dist',
  clean: false,
  sourcemap: true
});
