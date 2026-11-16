import { registerHooks } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const projectRoot = process.cwd();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/server') {
      return nextResolve('next/server.js', context);
    }
    if (specifier.startsWith('@/')) {
      const rel = specifier.slice(2);
      const baseCandidate = path.join(projectRoot, 'src', rel);
      const candidates = [
        baseCandidate,
        `${baseCandidate}.ts`,
        `${baseCandidate}.tsx`,
        path.join(baseCandidate, 'index.ts'),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return nextResolve(pathToFileURL(candidate).href, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});

