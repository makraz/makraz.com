# SEO / GEO / AEO: the steps only you can do

These are the items from the [audit](2026-11-23-seo-geo-aeo-audit.md) that code can't fix. They're in order, so do them top to bottom. Each one says how to check it worked.

The code fixes are already in the repo:
- shorter titles
- real H2 and H3 headings on service, contact and blog pages
- Organization, WebSite, Person and Breadcrumb structured data
- blog link in the footer
- "Further reading" links from service pages to articles
- `llms.txt` fix

**Deploy them before step 7.**

---

## 1. Let Perplexity's search crawler in (5 min)

Right now Cloudflare answers PerplexityBot with a 403. Perplexity can't index the site, so it never cites it.

1. Cloudflare dashboard → select **makraz.com**.
2. Open **AI Crawl Control** → **Crawlers**. On older dashboards it's **Security → Settings → "AI Crawler and Agent access policies"**.
3. Find **PerplexityBot** and set it to **Allow**.
4. Leave the training crawlers blocked if you still don't want your content used to train AI: GPTBot, ClaudeBot, Google-Extended, CCBot. Blocking them doesn't affect search or AI answers.
5. Keep these allowed: **OAI-SearchBot**, **ChatGPT-User**, **Claude-SearchBot**, **Claude-User**, **Perplexity-User**, **Googlebot**, **Bingbot**, **Applebot**.
6. Optional: if Cloudflare manages your `robots.txt`, under **Security → Settings → Manage your robots.txt**, set the content signal `ai-input=yes`. That says you're fine with AI answers quoting you, while `ai-train=no` stays. No AI engine documents that it reads this yet.

**Check:** a day later, AI Crawl Control → Crawlers should show **allowed** requests for PerplexityBot. A `curl -A "PerplexityBot"` test from your laptop isn't reliable, because Cloudflare checks the bot's real IP addresses.

## 2. Force HTTPS (5 min)

`http://makraz.com/fr` currently loads over plain HTTP with no redirect.

1. Cloudflare → **SSL/TLS → Edge Certificates**.
2. Turn on **Always Use HTTPS**.
3. Under **HTTP Strict Transport Security (HSTS)**, choose **Enable HSTS**.
   - Max-Age: **6 months**.
   - **Include subdomains: off** for now. Turn it on only once every subdomain you use serves HTTPS.
   - **Preload: off**. It's hard to undo.
   - No-Sniff: on.

**Check:**
```bash
curl -sI http://makraz.com/fr | head -3          # expect 301 → https://makraz.com/fr
curl -sI https://makraz.com/fr | grep -i strict  # expect strict-transport-security: max-age=15552000
```

## 3. Optional: make the trailing-slash redirect permanent (10 min)

`/fr/services/` redirects to `/fr/services` with a temporary 307. That's low priority, since the canonical tags already point to the version without the slash. Only do this if Search Console reports it.

1. Cloudflare → **Rules → Redirect Rules → Create rule**.
2. When: *Custom filter expression*
   ```
   (http.host eq "makraz.com" and ends_with(http.request.uri.path, "/") and http.request.uri.path ne "/")
   ```
3. Then: *Dynamic* redirect, expression `regex_replace(http.request.uri.path, "/$", "")`, status **301**, preserve the query string.

**Check:** `curl -sI https://makraz.com/fr/services/ | head -2` should show 301.

## 4. Add your public profiles (10 min, then ask me or edit one file)

Search engines and AI models link the company and you to your other profiles through `sameAs`. Today it only lists the Google Business Profile short link.

1. Collect the URLs that actually exist:
   - LinkedIn company page
   - your LinkedIn profile
   - your GitHub profile (the one that owns `ddev-claude`)
   - the **full** Google Maps URL of your Business Profile. Open the `share.google/...` link in a browser and copy the final `https://www.google.com/maps/place/...` address.
2. Put them in `src/lib/entities.ts`:
   ```ts
   export const ORG_SAME_AS = ['https://www.google.com/maps/place/…', 'https://www.linkedin.com/company/…'];
   export const PERSON_SAME_AS = ['https://www.linkedin.com/in/…', 'https://github.com/…'];
   ```
3. Optional: add visible links to them on the About page too. Tell me and I'll do it.

**Check:** after deploying, paste `https://makraz.com/fr` and `https://makraz.com/fr/a-propos` into the [Schema Markup Validator](https://validator.schema.org/). `sameAs` should list your profiles.

## 5. Founder photo (you take it, I wire it in)

Every article's author links to the About page, which still shows a grey placeholder.

1. Take a real, recent portrait: square, at least **600×600 px**, plain background.
2. Save it as `src/assets/hamza-makraz.jpg`.
3. Ask me to swap the placeholder, add the alt text "Hamza Makraz, fondateur de MAKRAZ" in all three languages, and add `image` to the Person structured data.

## 6. Article images (you make them, I wire them in)

Every article shows a grey box, and every page shares the same generic preview image.

1. For each of the 6 articles, make one image at **1200×675 px** (16:9). A screenshot, a benchmark chart or a diagram from the article all work, and they beat stock photos.
2. Save them as `src/assets/blog/<slug>.png`, using the French slugs: `choisir-agence`, `claude-code-skills`, `ddev-claude`, `kiri-vs-orbstack`, `seo-multilingue-maroc`, `vitrine-ou-plateforme`.
3. Ask me to add an `image` field to the articles. It will replace the placeholder on the article and its blog card, and set `og:image` and the structured-data `image`.

## 7. Search Console and Bing (30 min, once)

1. **Google Search Console** ([search.google.com/search-console](https://search.google.com/search-console)):
   1. Add a **Domain property** for `makraz.com`. Verify it with the TXT record. Cloudflare DNS can add it for you automatically.
   2. **Sitemaps** → submit `https://makraz.com/sitemap-index.xml`.
   3. **URL Inspection**:
      1. Inspect `https://makraz.com/en/about` and click **Request indexing**. It's a new URL from the slug change.
      2. Do the same for `/en/services/development` and `/fr/blog`.
   4. Check **Pages** for "Not indexed" reasons a week later, comparing fr, en and ar.
2. **Bing Webmaster Tools** ([bing.com/webmasters](https://www.bing.com/webmasters)):
   1. Choose **Import from Google Search Console**. It copies the site and its sitemap.
   2. Bing's index also feeds ChatGPT search and Copilot, so don't skip it.
3. **IndexNow:** Cloudflare → **Caching → Configuration → Crawler Hints → On**. Cloudflare then notifies Bing and Yandex of changed pages through IndexNow after each deploy.

**Check:** in Search Console, after about a week:
- **Enhancements → Breadcrumbs** lists the service, case-study and blog pages with no errors.
- the sitemap shows **Success** with 120 URLs.

## 8. Test the structured data after deploy (10 min)

Run each URL through Google's [Rich Results Test](https://search.google.com/test/rich-results):

| URL | Expect |
|---|---|
| `https://makraz.com/fr` | Organization, LocalBusiness (ProfessionalService), no errors |
| `https://makraz.com/fr/services/devops-cloud` | Breadcrumbs: Accueil › Services › Développement › DevOps & Cloud |
| `https://makraz.com/en/portfolio/aya` | Breadcrumbs: Home › Portfolio › … |
| `https://makraz.com/ar/blog/ddev-claude` | Article + Breadcrumbs (FAQ no longer shows: Google retired FAQ rich results in 2026) |

Warnings about optional fields are fine. Errors aren't, so send them to me.

## 9. Decide how to describe the business in French (decision, then 10 min of edits)

The site is inconsistent:
- French titles, the home description and `llms.txt` say **"agence de communication"**
- the legal page says **"agence digitale"**
- English says **"digital agency"**
- Arabic says **"وكالة رقمية"**, a digital agency
- the About page reads like a **software-engineering studio**

In French, "agence de communication" usually means marketing/PR, while most of the site sells engineering.

1. Pick one descriptor per language, for example *"agence digitale et studio d'ingénierie logicielle"* / *"digital agency and software engineering studio"*.
2. Tell me the choice. I'll update `seo.home_title`, `seo.home_desc`, the `llms.txt` intro and the legal page in all three languages in one pass.

The title suffix is now just " — MAKRAZ", so the titles no longer depend on this choice.

## 10. Content work (ongoing, 1–2 h each)

These are writing jobs. They're ordered by likely return.

1. **Give each service a search-phrase H1.** Most H1s are the short label ("Design", "E-commerce"). Add a `heading:` line to each service's frontmatter, e.g. `applications-mobiles.fr.md` → `heading: "Développement d'application mobile au Maroc"`. Match the phrase people actually type, which Search Console will show you after step 7.
2. **Put the timelines and price ranges on the service pages.** The contact FAQ already says "site vitrine : 2 à 4 semaines ; MVP : 6 à 12 semaines". Repeat those ranges in the matching services' engagement text. Questions about cost and timelines are what "People also ask" and AI answers pull from.
3. **Add outcomes to the case studies.** Add the numbers each client allows you to publish: catalogue size, languages, time to launch, Lighthouse score, traffic after launch. Name no clients beyond those already on the site.
4. **Expand the three older articles.** `choisir-agence` (375 words), `vitrine-ou-plateforme` (513) and `seo-multilingue-maroc` (540) are thin next to the new ones (1,500+):
   - Open each with a 2–3 sentence direct answer to its title question.
   - Add a short FAQ.
   - Set `updated:` in the frontmatter.
   - `seo-multilingue-maroc` can use this site's own hreflang and translated-slug setup as a worked example.
5. **Make the home page's sub-headline a one-line definition**, e.g. "MAKRAZ est une agence digitale basée au Maroc qui conçoit et développe applications web, mobiles et e-commerce pour startups et PME, au Maroc et en Europe." AI answers to "what is MAKRAZ" lift exactly this kind of sentence. Do it after step 9.

## 11. Blog in the header menu (decision, 1 line)

The footer now links the blog on every page, so crawlers can reach it. Whether visitors also see "Blog" in the header is a design choice. To show it, set `BLOG_IN_MENUS = true` in `src/lib/flags.mjs`.

## 12. Keep the address identical everywhere (10 min)

Compare these three:
- the Google Business Profile
- the contact page
- the site's structured data, which says *Centre d'affaires Itrane, Bureau B52, 5e étage, Bab Doukkala, Marrakech*

Make the Business Profile match the site exactly, or tell me what to change on the site.
