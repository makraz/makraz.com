# SEO / GEO / AEO audit: makraz.com (2026-11-23)

Scope: every page type in `src/pages/[lang]/` in fr, en and ar. Sources: the build on `main` at `cc7b9d7` (`pnpm build`, 124 HTML files in `dist/client/`) plus live checks with `curl` on https://makraz.com (robots.txt, redirects, crawler user agents).

Labels: **[SEO]** classic search, **[GEO]** citation by ChatGPT, Perplexity, Claude or Google AI features, **[AEO]** snippets, People Also Ask and voice. **Heuristic** marks a practice with no primary-source backing.

Background that shapes the advice (from primary sources):
- Google AI Overviews and AI Mode have no extra requirements. A page only needs to be "indexed and eligible to be shown in Google Search with a snippet", and you "don't need to create new machine readable files, AI text files, or markup" (https://developers.google.com/search/docs/appearance/ai-features). For Google, GEO is plain SEO.
- **Google retired FAQ rich results on 2026-05-07.** The docs page was removed on 2026-06-15 (changelog at https://developers.google.com/search/docs/appearance/structured-data/faqpage). FAQPage markup no longer earns a Google rich result. The visible Q&A text still counts as normal page content.

---

## 1. Summary: top 10 changes, ranked by impact/effort

| # | Change | Why | Effort |
|---|---|---|---|
| 1 | **Unblock PerplexityBot at the Cloudflare edge.** Live: a PerplexityBot UA gets **403**; OAI-SearchBot and Claude-SearchBot get 200. | Perplexity recommends allowing PerplexityBot to appear in its search results (https://docs.perplexity.ai/guides/bots). | Dashboard toggle |
| 2 | **Link the blog from the rest of the site.** `BLOG_IN_MENUS = false` (`src/lib/flags.mjs:16`), and no page outside `/blog/*` links to any blog URL (checked across all 124 built pages). The 21 blog URLs are reachable only from the sitemap and llms.txt. | Google finds pages through links. Every page you care about should be linked from at least one other page (https://developers.google.com/search/docs/crawling-indexing/links-crawlable). | Small |
| 3 | **Redirect HTTP to HTTPS.** Live: `http://makraz.com/fr` returns **200** over plain HTTP, with no redirect and no HSTS. | Google prefers HTTPS when it picks a canonical (https://developers.google.com/search/docs/crawling-indexing/canonicalization). Fix with Cloudflare "Always Use HTTPS" (https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/). | Dashboard toggle |
| 4 | **Shorten the title suffix.** FR `" — MAKRAZ, agence de communication"` (34 chars, `src/i18n/fr.json:270`) puts 32 of 41 FR titles over 70 chars (up to 94; EN 15/41, AR 5/41). The EN and AR suffixes are similar. Use `" — MAKRAZ"`. | Google truncates titles to fit the device. It advises against verbose titles and says a short site name is better than a repeated brand message (https://developers.google.com/search/docs/appearance/title-link). | One i18n key × 3 |
| 5 | **Give service pages real H2s.** The section labels ("Le problème", "Ce qui est inclus", "Comment nous travaillons", "FAQ") render through `Kicker`, which is a `<div>` (`src/components/Kicker.astro:4`). The service outline is H1 → H3 with no H2 (e.g. `/fr/services/api-integrations`, order `13333333`). | Headings help people and search engines see a page's structure (https://developers.google.com/search/docs/fundamentals/seo-starter-guide). Extracting answer passages under question-style headings is **heuristic** for AI engines. | Small template change |
| 6 | **Strengthen the Organization JSON-LD** (`src/pages/[lang]/index.astro:35-66`): add `@id`, `legalName`, `logo` → `/logo.png`, `sameAs`, `founder` and `contactPoint`. Then reference it by `@id` from every BlogPosting `publisher`. | Organization docs list `logo` ≥112px (the current `logo` is the 1200×630 OG banner), `sameAs`, `legalName` and `contactPoint` (https://developers.google.com/search/docs/appearance/structured-data/organization). | Small |
| 7 | **Add WebSite JSON-LD** (`name`, `alternateName`, `url`) on the home pages. | This is how you influence the site name shown in Google results (https://developers.google.com/search/docs/appearance/site-names). | Tiny |
| 8 | **Add a Person entity for the author.** Mark up the founder on About (with `sameAs` to LinkedIn and GitHub) and point BlogPosting `author` at it. Replace the placeholder photo (`a-propos.astro:96`). | Article docs strongly recommend `author.url` or `sameAs` (https://developers.google.com/search/docs/appearance/structured-data/article). The helpful-content docs ask "who created the content" (https://developers.google.com/search/docs/fundamentals/creating-helpful-content). | Small (needs a photo) |
| 9 | **Replace the article image placeholders.** Each article shows a grey "category" box (`blog/[slug].astro:96`; `blog/index.astro` cards). BlogPosting `image` and `og:image` are the generic site banner (`blog/[slug].astro:63`, `Base.astro:44`). | Article images should represent the content and come in 16:9, 4:3 and 1:1 at ≥50K pixels (Article docs above). | Medium (needs images) |
| 10 | **Add BreadcrumbList JSON-LD** to services, case studies and articles, and fix the false line in llms.txt (`src/pages/llms.txt.ts:55` says URL paths are identical across languages; slugs are now translated). | Breadcrumb docs: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb. llms.txt is meant as an accurate map (https://llmstxt.org). | Small |

---

## 2. Site-wide findings

### 2.1 Robots and AI crawlers (live robots.txt is a Cloudflare-managed file prepended to `public/robots.txt`)

Live status for each crawler user agent (spoofed UA from a non-bot IP; see §5):

| Bot | Purpose (vendor doc) | robots.txt | Edge |
|---|---|---|---|
| OAI-SearchBot | ChatGPT search results. "Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers" (https://developers.openai.com/api/docs/bots) | allowed | 200 ✅ |
| ChatGPT-User | user-initiated fetch | allowed | 200 ✅ |
| GPTBot | training | Disallow | 403 (owner's training choice; no effect on ChatGPT search, per the same doc) |
| Claude-SearchBot | search indexing; blocking it may reduce visibility (https://support.claude.com/en/articles/8896518) | allowed | 200 ✅ |
| Claude-User | user-initiated fetch | allowed | 200 ✅ |
| ClaudeBot | training | Disallow | 403 (training only) |
| **PerplexityBot** | **surfaces and links sites in Perplexity search; not used for training** (https://docs.perplexity.ai/guides/bots) | allowed by `*` | **403 ❌** |
| Perplexity-User | user-initiated fetch | allowed | 200 |
| Google-Extended | Gemini training and grounding. "Does not impact a site's inclusion in Google Search nor is it used as a ranking signal" (https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers) | Disallow | n/a: fine for AI Overviews |
| Googlebot / bingbot / Applebot | search | allowed | 200 ✅ |

- **Problem:** PerplexityBot is blocked at the edge, even though robots.txt does not disallow it. The block is enforced by the Cloudflare "AI Crawler and Agent access policies" / AI Crawl Control, not by robots.txt (https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/).
- **Fix:** In Cloudflare go to Security → Settings → AI Crawler and Agent access policies, or AI Crawl Control → Crawlers, and set PerplexityBot to Allow. Keep the training bots blocked if that is the intent. Re-test with `curl -A "...PerplexityBot/1.0..."`.
- Content Signals in the managed file are `search=yes, ai-train=no, use=reference`, and `ai-input` is unset. Cloudflare documents `ai-input` as "inputting content into AI models (RAG, grounding)" (https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/). If the goal is to be cited in AI answers, consider setting `ai-input=yes`. **Heuristic:** no AI vendor has documented that it reads Content-Signal.
- Two `User-agent: *` groups exist (Cloudflare's and the repo's). RFC 9309 merges them, so this is harmless.

### 2.2 Transport and redirects (live)
- `http://makraz.com/fr` → **200 over HTTP**. Turn on Always Use HTTPS (link in §1 #3) and HSTS (https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/).
- A trailing slash gets a **307**, e.g. `/fr/services/` → `/fr/services`. It comes from `wrangler.jsonc` `"html_handling": "drop-trailing-slash"`. Google treats 307 as temporary (https://developers.google.com/search/docs/crawling-indexing/301-redirects). Canonicals already point to the slash-less URL, so this is low priority. Fix with a Cloudflare Redirect Rule (308) if it shows up in Search Console.
- `www` → `https://makraz.com/` → `/fr` is two 301 hops. That is acceptable. The footer link `https://makraz.com` (`src/components/Footer.astro:36`) also costs one hop on every page; point it at `localePath(lang, '')`.

### 2.3 Head tags (`src/layouts/Base.astro`)
- Fine: canonical (`:35`), self-referencing and reciprocal hreflang plus x-default (`:37-40`), og:locale and alternates (`:47-48`), twitter:card (`:49`), `lang` and `dir` (`:29`, AR is `dir="rtl"`).
- **og:image is the same 1200×630 banner on every page** (`:44`), and `og:image:alt` and `twitter:image:alt` are missing. Add a per-page image prop (articles and case studies first) and `<meta property="og:image:alt">`. The spec is https://ogp.me. This matters for social sharing, not ranking.
- **Titles:** see §1 #4. With the suffix removed, the longest FR titles drop to about 60 chars. The home title (`seo.home_title`) can keep the brand plus descriptor.
- **Meta descriptions** are unique everywhere. Several AR descriptions are short (58–69 chars, e.g. `/ar/services/maintenance-optimisation` at 58, `/ar/services/design` at 59). Google sets no limit but wants descriptions that summarise the page (https://developers.google.com/search/docs/appearance/snippet). Low priority.

### 2.4 Structured data inventory (built output)

| Page type | JSON-LD today |
|---|---|
| Home ×3 | `Organization` + `ProfessionalService` |
| Articles | `BlogPosting`, plus `FAQPage` on 3 of 6 articles (claude-code-skills, ddev-claude, kiri-vs-orbstack) |
| Everything else (services ×72, portfolio, case studies, about, contact, blog hub, legal) | **none** |

Recommended additions, as one `@graph` with stable `@id`s:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": "https://makraz.com/#organization",
      "name": "MAKRAZ",
      "legalName": "MAKRAZ SARLAU",
      "alternateName": "makraz.com",
      "url": "https://makraz.com/",
      "logo": "https://makraz.com/logo.png",
      "image": "https://makraz.com/og-image.png",
      "email": "contact@makraz.com",
      "telephone": "+212661764392",
      "address": { "...": "unchanged Marrakech PostalAddress" },
      "founder": { "@id": "https://makraz.com/#hamza-makraz" },
      "sameAs": ["<Google Business Profile maps URL>", "<LinkedIn company URL>", "<GitHub org URL>"],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "sales",
        "email": "contact@makraz.com",
        "telephone": "+212661764392",
        "availableLanguage": ["fr", "en", "ar"]
      },
      "areaServed": "...", "knowsAbout": "...", "hasOfferCatalog": "... (unchanged)"
    },
    {
      "@type": "WebSite",
      "@id": "https://makraz.com/#website",
      "name": "MAKRAZ",
      "alternateName": ["makraz.com"],
      "url": "https://makraz.com/",
      "inLanguage": ["fr", "en", "ar"],
      "publisher": { "@id": "https://makraz.com/#organization" }
    }
  ]
}
```

Notes on that markup:
- `name`: use the brand, with `legalName` holding the registered name. Today `name` is "MAKRAZ SARLAU" while `og:site_name` and the titles say "MAKRAZ". Google wants `name` consistent with the site name (Organization docs).
- `logo` → `/logo.png`: 591×591. The current `og-image.png` is a 1200×630 banner. Google requires a logo of at least 112×112 that looks right on white.
- `sameAs`: the footer already links a `share.google` Business Profile short link (`Footer.astro:39`). Use the full maps URL. Add only profiles that exist.
- **Person** (on About; referenced by BlogPosting `author`): `{"@type":"Person","@id":"https://makraz.com/#hamza-makraz","name":"Hamza Makraz","jobTitle":"Founder, software engineer","worksFor":{"@id":"https://makraz.com/#organization"},"url":"https://makraz.com/fr/a-propos","sameAs":["<LinkedIn>","<GitHub>"],"image":"<real photo URL>"}`. The schema is at https://schema.org/Person. Article docs: author `url`/`sameAs` are "strongly recommended", and `author.name` must hold the name only.
- **LocalBusiness:** `ProfessionalService` is already a LocalBusiness subtype (https://schema.org/ProfessionalService). Google's local-business recommendations add `geo`, `openingHoursSpecification` and `priceRange` (https://developers.google.com/search/docs/appearance/structured-data/local-business). Add `geo` for the Itrane office and opening hours if you publish them. Keep the Marrakech address as decided.
- **BreadcrumbList** on services (Accueil › Services › Développement › Sites internet), case studies (› Portfolio › …) and articles (› Blog › …). Use localized names and URLs. Docs: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb.
- **FAQPage:** do *not* spread it to service and contact pages for Google, since the FAQ rich result is retired (see the top of this report). The visible FAQ text already does the AEO work. Whether ChatGPT, Perplexity or Claude read FAQPage markup is **undocumented (heuristic)**. Keep the existing article markup (harmless) and don't spend effort on more.

### 2.5 Sitemap (`astro.config.mjs`)
- Fine: 120 URLs, `/mycard` excluded (matches its noindex), the 21 blog URLs included, hreflang alternates match the head tags (checked on `/ar/services/seo` and `/fr/blog/choisir-agence`), git-based `lastmod`, no changefreq or priority. This matches https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap.
- Add the sitemap in **Bing Webmaster Tools** and enable **IndexNow** for faster recrawls after deploys (https://www.bing.com/indexnow; guidelines at https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a). Open question: is the site verified in Bing?

### 2.6 llms.txt (`src/pages/llms.txt.ts`)
- Present, generated, H1 + blockquote + H2 link lists per https://llmstxt.org.
- **Bug:** `:55` says "Les chemins d'URL sont identiques dans les trois langues ; seul le préfixe de langue change." That has been false since `cc7b9d7` (translated slugs). Replace it with: "Les URL anglaises et arabes utilisent des slugs anglais (ex. /fr/a-propos ↔ /en/about ↔ /ar/about)."
- `:53` and the blockquote say "Agence de communication" while EN pages say "digital agency" and the FR legal page says "agence digitale". See §2.9.
- Expectation: Google states AI text files are not needed. No major engine has documented reading llms.txt. Treat it as **heuristic / low value**. Keep it because it costs nothing, but don't invest more.

### 2.7 Internal linking
- **The blog is an orphan section** (§1 #2). Concrete links to add:
  - Footer: a Blog link in all three locales (flip `BLOG_IN_MENUS` for the footer at least).
  - Service ↔ article pairs:
    - `/services/referencement-naturel-seo` ↔ `/blog/seo-multilingue-maroc`
    - `/services/mvp-lancement-rapide` ↔ `/blog/choisir-agence` (MVP article)
    - `/services/sites-internet` and `/services/applications-web-saas` ↔ `/blog/vitrine-ou-plateforme`
    - `/services/devops-cloud` ↔ `/blog/kiri-vs-orbstack`, `/blog/ddev-claude`
  - A "related reading" block on leaf service pages fed by a `services: []` frontmatter field on posts.
- The 3 older articles (seo-multilingue-maroc, vitrine-ou-plateforme, choisir-agence) link to no service page. The newer ones do (e.g. kiri → devops-cloud).
- Case studies link out to the client sites (farblieferant.de, phpmorocco.ma, ayapsychomotricite.ma). That is fine and good for verifiability.

### 2.8 Performance basics
- Fine: one CSS file of 30 KB, no JS except the Turnstile widget on contact, responsive WebP with width and height, `loading="eager"` on case-study heroes.
- Google Fonts CSS is render-blocking from a third-party origin (`Base.astro:53-56`). Self-hosting via `@fontsource` (or Astro fonts) removes 2 origins from the critical path. This is only measurable via CWV field data (https://developers.google.com/search/docs/appearance/core-web-vitals). Low priority.

### 2.9 i18n and entity consistency
- Fine: translated slugs, reciprocal hreflang, x-default → fr, `ar` with `dir="rtl"`, `og:locale` fr_MA / en_US / ar_MA, and 301s from the old slugs (44 lines in `dist/client/_redirects`).
- **Inconsistent entity descriptor.** FR "agence de communication" (titles, home, llms.txt), FR legal "agence digitale", EN "digital agency", AR "وكالة رقمية". In French, "agence de communication" usually means a marketing/PR agency, while most pages sell engineering. Pick one descriptor per language and use it in `seo.title_suffix`, `seo.home_*`, the JSON-LD `description` and llms.txt. **Heuristic:** consistent entity descriptions help both Knowledge Graph and LLM entity resolution, but no primary source quantifies this. Google does ask for consistency of the site name across signals (site-names doc). This is a positioning decision; see §5.

---

## 3. Per-page-type findings

### Home (`src/pages/[lang]/index.astro`)
- **There:** Org JSON-LD `:35-66`, unique title and description, H1 `:84`, 5 H2s.
- **Problem 1:** the H1 is built from beats joined with `<br/>` (`:84`). The text content becomes "Construire,moderniser,faire grandir." with no spaces. **Fix:** emit `{' '}` before each `<br />` so the extracted text reads "Construire, moderniser, faire grandir."
- **Problem 2:** the H1 carries no topic words. Fine for brand, but the "what/where" lives only in the title. **Fix (AEO, heuristic):** make the hero sub-paragraph a one-sentence definition: "MAKRAZ est une agence [X] basée au Maroc qui conçoit et développe applications web, mobiles et e-commerce pour startups et PME, au Maroc et en Europe." Engines lift exactly this kind of self-contained sentence for "what is MAKRAZ" questions.
- **Problem 3:** Org JSON-LD gaps and no WebSite markup. See §2.4.

### Services hub (`src/pages/[lang]/services.astro`)
- **There:** title "Développement web & mobile, design, communication" (83 chars with suffix), H1 + 4 H2s, 57 links.
- **Fix:** add BreadcrumbList. Optionally add an `ItemList` of pillar Service entries (schema.org/ItemList). There is no Google feature for it (**heuristic**). Shorten the title via the suffix change.

### Service pages ×72 (`src/pages/[lang]/services/[slug].astro`)
- **There:** good copy depth (490–850 words), an FAQ of ≥2 items each (`:155-171`), engagement/pricing model text, related services, a case study where genuine.
- **Problem 1:** no H2s (§1 #5). **Fix:**
  - Change `Kicker` to accept `as="h2"` and use it at `:62` (problem), `:72` (children), `:85` (included), `:106` (how), `:138` (engagement), `:157` (FAQ), `:176` (related).
  - Turn included-item titles (`:94`) and step titles (`:111`) into `<h3>`.
  - Wrap each FAQ question in `<h3>` inside `<summary>`.
- **Problem 2:** the H1 is the short service name on most pages ("API & intégrations", "Design", "E-commerce"). Only `sites-internet` uses the `heading` field ("Création de site web au Maroc"). **Fix:** set `heading:` on leaves to the search phrase already in `seoTitle`, e.g. `applications-mobiles` → "Développement d'application mobile au Maroc".
- **Problem 3:** the FAQ answers are hidden in `<details>`. Google indexes collapsed content (no doc says otherwise for text in the HTML), so this is OK. Make sure the first answer sentence answers directly (it mostly does: "Deux à quatre semaines…").
- **Problem 4:** no structured data. **Fix:** add BreadcrumbList. Optionally add `Service` (`serviceType`, `provider: {"@id":"https://makraz.com/#organization"}`, `areaServed`, `url`) per https://schema.org/Service. There is no Google rich result for Service; this is entity clarity only (**heuristic**). No FAQPage (retired).
- **AEO:** the "Investissement" section has no figures. Contact FAQ already says "Site vitrine : 2 à 4 semaines ; MVP : 6 à 12 semaines". Repeat those ranges on the matching service pages, since timeline and cost questions are what People Also Ask and AI answers surface (**heuristic**).

### Portfolio hub and case studies (`portfolio.astro`, `portfolio/{farblieferant,phpmorocco,aya}.astro`)
- **There:** H1 = project name (`farblieferant.astro:28`), 3 H2s (context, solution, today), descriptive alt text on every screenshot, client and site facts, 570–820 words.
- **Problem 1:** the H1 is just the client name. **Fix:** keep the name but add the outcome in the H1 or a strong first sentence, e.g. "Farblieferant : une plateforme e-commerce B2B/B2C pour le marché européen".
- **Problem 2:** no measurable outcomes. The "today" section is qualitative. Helpful-content guidance asks for original, substantive information (https://developers.google.com/search/docs/fundamentals/creating-helpful-content). **Fix:** add any figures the client allows (catalogue size, languages, delivery time, Lighthouse/CWV, launch timeline). Don't add client names beyond those already on the site.
- **Problem 3:** no JSON-LD. **Fix:** BreadcrumbList. Optionally `Article`/`CreativeWork` with `about` the client organization and `author` the Organization (**heuristic**, no Google feature for case studies).

### About (`src/pages/[lang]/a-propos.astro`, `about.astro` re-exports it)
- **There:** H1 + 3 H2s, the founder name rendered as a `<div>` (`:98`), a placeholder image (`:96`), description 76–119 chars.
- **Problem:** this page is the `author.url` target for every article, but it has no Person markup, no photo and no external profile links. That is weak E-E-A-T evidence ("who created the content", helpful-content doc).
- **Fix:**
  - Real founder photo with alt "Hamza Makraz, fondateur de MAKRAZ".
  - Make the name an `<h3>` (or `<h2>`).
  - Add LinkedIn and GitHub links.
  - Add Person JSON-LD (§2.4) plus `AboutPage` with `mainEntity: {"@id":"https://makraz.com/#organization"}` (https://schema.org/AboutPage).
  - Optional: a dated list of concrete credentials (years, stacks, notable open source such as ddev-claude, which already has an article).

### Contact (`src/pages/[lang]/contact.astro`)
- **There:** NAP visible (email, phone, office "Itrane Business Center, Marrakech"), 6-question FAQ (`:56-59`) with direct answers including timelines.
- **Problem:** the FAQ questions are not headings, and the office address is abbreviated compared with the JSON-LD street address.
- **Fix:**
  - Use `<h3>` for the questions.
  - Show the full postal address exactly as in the JSON-LD and the Google Business Profile. Consistent NAP is a common local-SEO practice but **heuristic** (Google only says to keep Business Profile info accurate: https://support.google.com/business/answer/7091).
  - Add a link to the Business Profile.
  - No FAQPage (retired). Optionally add a `ContactPage` type (https://schema.org/ContactPage).

### Blog hub (`src/pages/[lang]/blog/index.astro`)
- **There:** H1 "Ce que nous apprenons en construisant.", 6 article cards, **0 H2/H3** (card titles are `<div>`, `:58`), a grey placeholder per card (`:53`).
- **Fix:**
  - Card title → `<h2>`.
  - Replace the placeholders with article thumbnails (or drop them).
  - An H1 with topic words, e.g. "Blog : développement, SEO et outils dev, depuis le Maroc".
  - Link the hub from the footer and nav (§2.7).
  - Optional: `Blog` with `blogPost` list (https://schema.org/Blog). There is no Google feature for it.

### Articles (`src/pages/[lang]/blog/[slug].astro`, `src/content/blog/*.md`)
- **There (verified):**
  - BlogPosting with headline, description, inLanguage, datePublished/dateModified, author Person with url, and publisher logo `/logo.png` (`:53-81`).
  - FAQPage on 3 posts.
  - `article:published_time`, visible `<time>`, real H2 hierarchy, FAQ section with an H2, hreflang to translated slugs.
- **Problem 1:** `image` is the site banner (`:63`) and the visible hero is a placeholder (`:96`). See §1 #9.
- **Problem 2:** author has no `sameAs` or `@id`. **Fix:** `author: {"@id":"https://makraz.com/#hamza-makraz"}` plus the Person node (§2.4). Publisher → `{"@id":"https://makraz.com/#organization"}`.
- **Problem 3:** the 3 older posts (choisir-agence 375 words, vitrine-ou-plateforme 513, seo-multilingue-maroc 540) are thin next to the newer 1,500–1,900-word posts and have no FAQ or service links. **Fix:** expand them with first-hand specifics (the multilingual SEO post can cite this site's own hreflang and slug setup as a worked example). Add `updated:` when revised, which feeds `dateModified`.
- **AEO, heuristic:** open each post with a 2–3 sentence direct answer to the title question. kiri-vs-orbstack already does this in its description with concrete numbers; that pattern is the most quotable.
- `minutes` reading time uses whitespace splitting on the raw markdown (`:38`). It's fine and not an SEO factor.

### Legal (`mentions-legales.astro`, `legal-notice.astro`)
- Fine: indexable, H1 + 2 H2s, legal entity named.
- Optional: say "agence digitale" or whatever descriptor you choose in §2.9 so it matches.
- Keeping it indexed is fine. Nothing to add.

### mycard (`src/pages/[lang]/mycard.astro`, `src/pages/mycard.astro`)
- Fine: `noindex, follow` and excluded from the sitemap.

---

## 4. Checked and fine
- Unique `<title>` and meta description on all 124 pages. Exactly one H1 per page.
- Canonical is self-referencing on every page. No trailing-slash or locale mismatches.
- hreflang fr/en/ar + x-default on every page, reciprocal, matching the sitemap alternates, translated slugs resolve (old slugs 301).
- `<html lang>` and `dir` correct. AR is `rtl`, with Arabic font loaded only for `ar`.
- og:type article on posts, og:locale and alternates, `twitter:card=summary_large_image`.
- Every `<img>` has an `alt`. Decorative ones use `alt=""` (logo-white, hero illustration). Screenshot alts are descriptive and localized.
- Sitemap: 120 URLs, git lastmod, mycard excluded, blog included now that maintenance is lifted (`BLOG_MAINTENANCE = false`).
- `/` → `/fr` 301, `www` → apex 301, unknown URL → 404.
- OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, Perplexity-User, Googlebot, bingbot and Applebot all get 200.
- Training-bot blocks (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot…) do not affect search or AI-search inclusion, per each vendor's docs cited in §2.1.
- Light pages: 30 KB CSS, no framework JS, sized WebP images.
- BlogPosting and FAQPage JSON-LD are valid JSON. The FAQ markup strips backticks and isolates LTR code in Arabic.

## 5. Open questions / not verified
1. **Bot tests used spoofed UAs from a residential IP.** The 403s for GPTBot, ClaudeBot and PerplexityBot may reflect Cloudflare's "unverified bot matching" rather than how the real, IP-verified crawlers are treated. Confirm in Cloudflare → AI Crawl Control → Crawlers (per-bot allowed/blocked counts) before and after the change.
2. **Positioning:** does the business want to be "agence de communication", "agence digitale" or a software-engineering studio in French? The brief says studio; the site says communication agency. Choose before rewriting the titles (§1 #4, §2.9).
3. Which external profiles exist for `sameAs`: LinkedIn company, LinkedIn founder, GitHub org or user, and the canonical Google Business Profile URL?
4. Is the site verified in Google Search Console and Bing Webmaster Tools? With what coverage (indexed counts per locale), and are there CWV field data? None of this can be checked from the repo.
5. **Site-name markup placement:** Google wants WebSite markup on the domain-root home page. `https://makraz.com/` is a 301 to `/fr`, and the docs don't cover a root that redirects. Put the markup on `/fr`, `/en` and `/ar` with `url: "https://makraz.com/"` and verify the site name in results after recrawl.
6. Whether Bing, ChatGPT, Perplexity or Claude consume FAQPage, Service or llms.txt. None of them documents it, so all such advice above is labelled heuristic.
7. The 307 on trailing slashes comes from Workers static-assets `html_handling`. I did not confirm whether that status is configurable in Workers. A Cloudflare Redirect Rule is the fallback.
8. `CF-Cache-Status: HIT` on the plain-HTTP response despite `CDN-Cache-Control: no-store` in `public/_headers`. It may be a different cache path for HTTP; it goes away once HTTP redirects to HTTPS.
