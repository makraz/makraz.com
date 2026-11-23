// @ts-check
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { BLOG_MAINTENANCE } from './src/lib/flags.mjs';
import { LOCALIZED_PATHS, delocalizePath, localizePath } from './src/lib/routes.mjs';

const LOCALES = ['fr', 'en', 'ar'];
const SITE = 'https://makraz.com';

// The old English and Arabic URLs used the French slugs; each one now redirects (301) to its
// translated slug, so links and rankings carry over.
const slugRedirects = Object.fromEntries(
  LOCALES.flatMap((lang) =>
    Object.entries(LOCALIZED_PATHS[lang] ?? {}).map(([fr, local]) => [`/${lang}${fr}`, `/${lang}${local}`]),
  ),
);

/**
 * What a page is actually made of: its template/markdown, plus the slice of the locale JSON that
 * holds its copy. The JSON is shared by every page, so it is queried per key namespace rather than
 * whole-file — otherwise one translation edit marks every URL as changed on the same timestamp,
 * which is no more informative than stamping them all with the build time.
 * @param {string} url
 * @returns {{ files: string[], keyspace?: { file: string, prefixes: string[] } }}
 */
function sourcesFor(url) {
  const path = new URL(url).pathname.replace(/\/$/, '');
  const match = path.match(new RegExp(`^/(${LOCALES.join('|')})(/.*)?$`));
  if (!match) return { files: [] };
  const [, lang, served = ''] = match;
  // Sources are keyed by the French route (file names, collection slugs), not the translated URL.
  const rest = delocalizePath(lang, served);
  const slug = rest.split('/')[2];
  const files = [];
  // The page's i18n namespace: its copy lives in `<ns>.*` keys and its <title>/<meta description>
  // in `seo.<ns>_*` keys, so both count towards its lastmod.
  /** @type {string | undefined} */
  let ns;

  if (rest === '') { files.push('src/pages/[lang]/index.astro'); ns = 'home'; }
  else if (/^\/blog\/[^/]+$/.test(rest)) files.push(`src/content/blog/${slug}.${lang}.md`, 'src/pages/[lang]/blog/[slug].astro');
  else if (/^\/portfolio\/[^/]+$/.test(rest)) {
    files.push(`src/pages/[lang]/portfolio/${slug}.astro`, `src/content/case-studies/${slug}.${lang}.md`);
    ns = `case_${slug}`;
  }
  // Service pages are one dynamic route over a content collection, so the page's own source is the
  // markdown file, not a per-slug .astro. Without this branch they shipped with no lastmod at all.
  else if (/^\/services\/[^/]+$/.test(rest)) {
    files.push(`src/content/services/${slug}.${lang}.md`, 'src/pages/[lang]/services/[slug].astro');
  } else {
    files.push(`src/pages/[lang]${rest}.astro`);
    ns = { '/services': 'services', '/portfolio': 'portfolio', '/a-propos': 'about', '/contact': 'contact', '/blog': 'blog', '/mentions-legales': 'legal' }[rest];
  }

  return {
    files: files.filter((f) => existsSync(f)),
    keyspace: ns ? { file: `src/i18n/${lang}.json`, prefixes: [`${ns}.`, `seo.${ns}_`] } : undefined,
  };
}

/** @type {Map<string, string | undefined>} */
const lastmodCache = new Map();

/**
 * Newest commit date across a page's sources, as the sitemap `lastmod`. Deliberately git-derived
 * rather than build time: stamping every page with "now" on each deploy tells crawlers everything
 * changed every time, which is both false and a reason for them to stop trusting the signal.
 * Returns undefined outside a git checkout so the field is simply omitted.
 * @param {string} url
 */
function lastmodFor(url) {
  if (lastmodCache.has(url)) return lastmodCache.get(url);
  const { files, keyspace } = sourcesFor(url);
  /** @type {string | undefined} */
  let newest;
  /** @param {string[]} args */
  const commitDate = (args) => {
    try {
      return execFileSync('git', ['log', '-1', '--format=%cI', ...args], { encoding: 'utf8' }).trim();
    } catch {
      return ''; // No git history (shallow clone, exported tarball) — lastmod is simply omitted.
    }
  };

  for (const file of files) {
    const out = commitDate(['--', file]);
    if (out && (!newest || out > newest)) newest = out;
  }
  if (keyspace) {
    for (const prefix of keyspace.prefixes) {
      // -G matches commits whose diff touched a line containing this key prefix, so a page's date
      // moves when its own copy or its title/description changed, not when any copy anywhere changed.
      const out = commitDate([`-G"${prefix.replaceAll('.', '\\.')}`, '--', keyspace.file]);
      if (out && (!newest || out > newest)) newest = out;
    }
  }

  lastmodCache.set(url, newest);
  return newest;
}

export default defineConfig({
  site: SITE,
  output: 'static',
  // imageService: 'compile' optimizes images with sharp at build time. Without it the adapter
  // emits runtime /_image?… URLs, which the deployed Worker does not serve for a static build.
  adapter: cloudflare({ imageService: 'compile' }),
  trailingSlash: 'never',
  integrations: [
    // A prerendered page is served straight from static assets with a 200, so the blog routes are
    // switched to on-demand rendering while in maintenance: only then can they answer 503.
    {
      name: 'blog-maintenance',
      hooks: {
        'astro:route:setup': ({ route }) => {
          if (BLOG_MAINTENANCE && route.component.startsWith('src/pages/[lang]/blog/')) route.prerender = false;
        },
      },
    },
    sitemap({
      // No `i18n` option: it pairs languages by identical paths, which translated slugs break
      // (/en/about vs /fr/a-propos). serialize() builds the alternates from the route table instead.
      // Pages that carry noindex are kept out of the sitemap too, so the two signals agree:
      // /mycard is a QR destination rather than search content.
      // In blog maintenance the blog goes too: a sitemap should only list URLs that answer 200.
      filter: (page) =>
        !/\/mycard\/?$/.test(page) && !(BLOG_MAINTENANCE && /\/blog(\/|$)/.test(page)),
      serialize(item) {
        const lastmod = lastmodFor(item.url);
        if (lastmod) item.lastmod = lastmod;
        // fr/en/ar alternates plus x-default (French), matching the hreflang tags in every page's
        // <head>. Each language's URL comes from the route table, so translated slugs pair up.
        const m = new URL(item.url).pathname.match(new RegExp(`^/(${LOCALES.join('|')})(/.*)?$`));
        if (m) {
          const key = delocalizePath(m[1], m[2] ?? '');
          const urlFor = (/** @type {string} */ l) => `${SITE}/${l}${key ? localizePath(l, key) : ''}`;
          item.links = [
            ...LOCALES.map((l) => ({ lang: l, url: urlFor(l) })),
            { lang: 'x-default', url: urlFor('fr') },
          ];
        }
        // changefreq and priority are deliberately omitted: Google ignores both, and inventing
        // values for them is noise that has to be maintained.
        return item;
      },
    }),
  ],
  redirects: { '/': '/fr', ...slugRedirects },
  vite: {
    plugins: [tailwindcss()],
    define: {
      'process.env.ALLOW_MISSING_TURNSTILE': JSON.stringify(process.env.ALLOW_MISSING_TURNSTILE ?? ''),
    },
  },
});
