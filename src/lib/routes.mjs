// Localized URL slugs, in plain JS so astro.config.mjs can read them as well as the pages.
//
// The French paths are the route keys used everywhere in the code (localePath(lang, '/a-propos'))
// and the French URLs never change. English and Arabic get English slugs; Arabic uses them too,
// because Latin URLs survive sharing and copy-paste where percent-encoded Arabic does not.
// A path missing here keeps its French slug in every language.

/** @type {Record<string, string>} French path → English path */
const EN = {
  '/a-propos': '/about',
  '/mentions-legales': '/legal-notice',

  '/services/applications-mobiles': '/services/mobile-apps',
  '/services/applications-web-saas': '/services/web-apps-saas',
  '/services/audit-ingenierie': '/services/engineering-audit',
  '/services/branding-identite': '/services/branding-identity',
  '/services/conseil-accompagnement': '/services/advisory-coaching',
  '/services/contenu-copywriting': '/services/content-copywriting',
  '/services/cto-a-la-demande': '/services/fractional-cto',
  '/services/developpement': '/services/development',
  '/services/direction-technique': '/services/technical-leadership',
  '/services/equipe-produit-dediee': '/services/dedicated-product-team',
  '/services/motion-contenu-visuel': '/services/motion-visual-content',
  '/services/mvp-lancement-rapide': '/services/mvp-fast-launch',
  '/services/publicite-en-ligne-sea': '/services/online-advertising-sea',
  '/services/referencement-naturel-seo': '/services/seo',
  '/services/reseaux-sociaux': '/services/social-media',
  '/services/sites-internet': '/services/websites',
  '/services/strategie-digitale': '/services/digital-strategy',

  '/blog/choisir-agence': '/blog/mvp-without-technical-debt',
  '/blog/seo-multilingue-maroc': '/blog/multilingual-seo-morocco',
  '/blog/vitrine-ou-plateforme': '/blog/website-or-platform',
};

/** @type {Record<string, Record<string, string>>} */
export const LOCALIZED_PATHS = { fr: {}, en: EN, ar: EN };

/** French route key → the path this language serves it at. */
export function localizePath(/** @type {string} */ lang, /** @type {string} */ path) {
  return LOCALIZED_PATHS[lang]?.[path] ?? path;
}

/** A served path back to its French route key (the inverse of localizePath). */
export function delocalizePath(/** @type {string} */ lang, /** @type {string} */ path) {
  const entry = Object.entries(LOCALIZED_PATHS[lang] ?? {}).find(([, local]) => local === path);
  return entry ? entry[0] : path;
}

/** The last segment of a localized path: the `slug` param of a dynamic route. */
export function localizeSlug(/** @type {string} */ lang, /** @type {string} */ section, /** @type {string} */ slug) {
  return localizePath(lang, `/${section}/${slug}`).split('/').pop();
}
