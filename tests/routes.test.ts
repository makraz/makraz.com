import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOCALIZED_PATHS, delocalizePath, localizePath } from '../src/lib/routes.mjs';

const slugsIn = (dir: string) =>
  new Set(
    readdirSync(new URL(`../src/content/${dir}/`, import.meta.url))
      .filter((f) => f.endsWith('.fr.md'))
      .map((f) => f.replace(/\.fr\.md$/, '')),
  );
const services = slugsIn('services');
const blog = slugsIn('blog');

describe('localized URL slugs', () => {
  it('only translates routes that exist', () => {
    for (const [lang, map] of Object.entries(LOCALIZED_PATHS)) {
      for (const key of Object.keys(map)) {
        const [, section, slug] = key.split('/');
        if (section === 'services') expect(services, `${lang} ${key}`).toContain(slug);
        else if (section === 'blog') expect(blog, `${lang} ${key}`).toContain(slug);
        else expect(['/a-propos', '/mentions-legales'], `${lang} ${key}`).toContain(key);
      }
    }
  });

  it('gives every page its own URL and round-trips', () => {
    for (const [lang, map] of Object.entries(LOCALIZED_PATHS)) {
      const served = Object.values(map);
      expect(new Set(served).size, `${lang} has two pages on one URL`).toBe(served.length);
      // A translated URL must not land on another page's French route key.
      for (const local of served) expect(map[local], `${lang} ${local} shadows a route`).toBeUndefined();
      for (const key of Object.keys(map)) expect(delocalizePath(lang, localizePath(lang, key))).toBe(key);
    }
  });

  it('links English and Arabic content to the translated URLs, not the French ones', () => {
    for (const dir of ['blog', 'services', 'case-studies']) {
      const path = new URL(`../src/content/${dir}/`, import.meta.url);
      for (const file of readdirSync(path).filter((f) => /\.(en|ar)\.md$/.test(f))) {
        const lang = file.match(/\.(en|ar)\.md$/)![1];
        const links = [...readFileSync(new URL(file, path), 'utf8').matchAll(new RegExp(`\\]\\(/${lang}(/[^)#?]*)`, 'g'))];
        for (const [, target] of links) {
          expect(LOCALIZED_PATHS[lang][target], `${file} links to the French slug ${target}`).toBeUndefined();
        }
      }
    }
  });

  it('tags articles only with services that exist', () => {
    const dir = new URL('../src/content/blog/', import.meta.url);
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const tags = readFileSync(new URL(file, dir), 'utf8').match(/^services: \[(.*)\]$/m)?.[1].split(',') ?? [];
      for (const tag of tags) expect(services, `${file} tags ${tag}`).toContain(tag.trim());
    }
  });
});
