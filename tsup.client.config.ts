import { defineConfig } from 'tsup';

export default defineConfig({
  entryPoints: [ './src/client/index.ts' ],
  format: [ 'esm' ],
  target: "chrome130",
  dts: true,
  outDir: './dist/client',
  clean: false,
  sourcemap: true
});
