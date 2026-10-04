import type { AstroGlobal } from 'astro';

// How long crawlers are told to wait before retrying a blog URL during maintenance. A day keeps
// Google checking back regularly without treating the outage as permanent.
const RETRY_AFTER_SECONDS = 86_400;

/** Marks the current response as "temporarily unavailable" for a blog route in maintenance. */
export function answerBlogMaintenance(response: AstroGlobal['response']) {
  response.status = 503;
  response.headers.set('Retry-After', String(RETRY_AFTER_SECONDS));
  response.headers.set('Cache-Control', 'no-store');
}
