import { build } from 'esbuild';
await build({ stdin: { contents: "export { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';", resolveDir: process.cwd() },
  bundle: true, format: 'esm', minify: true, outfile: 'js/vendor/webauthn.js', target: 'es2020', legalComments: 'inline' });
