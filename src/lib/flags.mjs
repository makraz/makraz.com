// Site-wide switches, in plain JS so astro.config.mjs can read them as well as the pages.

/**
 * Blog maintenance: every /blog URL answers 503 with Retry-After, and the blog drops out of the
 * nav, footer, sitemap and llms.txt. A 503 rather than a noindexed 200 tells Google the outage is
 * temporary, so the articles keep their place in the index while it lasts. Keep it short: weeks,
 * not months, or Google starts treating the 503s as permanent. Set to false to restore the blog.
 */
export const BLOG_MAINTENANCE = false;

/**
 * Whether Blog appears in the header menus (desktop and mobile). The footer always links the blog
 * outside maintenance, so the articles are never orphans: crawlers find pages through links.
 */
export const BLOG_IN_MENUS = false;

/** What the menus actually use: never shown during maintenance, otherwise per BLOG_IN_MENUS. */
export const SHOW_BLOG_IN_MENUS = BLOG_IN_MENUS && !BLOG_MAINTENANCE;
