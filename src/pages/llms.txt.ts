import type { APIRoute } from 'astro';
import { getPosts, getReports, getWorkStories } from '../content/queries';
import { feedTags, getFeed, workTags } from '../content/feed';
import { tagSlug } from '../content/writing';
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from '../site/config';

/** Keep Sanity titles/paragraphs on one line in the machine-readable directory. */
const line = (text: string): string => text.replace(/\s+/g, ' ').trim();
const label = (text: string): string => line(text).replace(/([\\[\]])/g, '\\$1');
const link = (name: string, url: string): string => `[${label(name)}](${absoluteUrl(url)})`;

export const GET: APIRoute = async () => {
  const [stories, posts, reports, feed] = await Promise.all([
    getWorkStories(), getPosts(), getReports(), getFeed(),
  ]);
  const sections = [
    `# ${SITE_NAME}\n\n> ${SITE_DESCRIPTION}`,
    `## About this directory
This catalogue is generated from the same published content as the HTML pages. The canonical HTML pages are the primary sources. Project accounts describe what was built and measured; they are not claims of general expertise.`,
    `## Author and site
- ${link('About', '/about')}
- ${link('CV', '/cv')}
- ${link('Contact', '/contact')}
- ${link('Home', '/')}
- ${link('Work & Writing', '/work')}
- ${link('Reading', '/reading')}`,
    `## Projects\n${stories.map((story) => [
      `- ${link(story.title, `/work/${story.slug}`)}: ${line(story.introduction)}`,
      `  - Published: ${story.date}. ${line(story.descriptor)}.`,
      ...(workTags(story).length ? [`  - Topics: ${workTags(story).map((tag) => link(tag, `/tags/${tagSlug(tag)}`)).join(', ')}.`] : []),
      ...story.links.map((resource) => `  - ${link(resource.label, resource.href)}`),
    ].join('\n')).join('\n')}`,
    `## Articles\n${posts.map((post) => [
      `- ${link(post.title, `/posts/${post.slug}`)}: ${line(post.excerpt)}`,
      `  - Published: ${post.publishedAt}${post.updatedAt ? `. Updated: ${post.updatedAt}` : ''}.`,
      ...(post.tags.length ? [`  - Topics: ${post.tags.map((tag) => link(tag, `/tags/${tagSlug(tag)}`)).join(', ')}.`] : []),
    ].join('\n')).join('\n')}`,
    `## Reports\n${reports.map((report) => [
      `- ${link(report.title, `/reports/${report.slug}`)}: ${line(report.description)}`,
      `  - Published: ${report.publishedAt}. ${link('PDF', report.pdfUrl)}`,
      ...(report.tags.length ? [`  - Topics: ${report.tags.map((tag) => link(tag, `/tags/${tagSlug(tag)}`)).join(', ')}.`] : []),
    ].join('\n')).join('\n')}`,
    `## Topics\n${feedTags(feed).map((tag) => `- ${link(tag, `/tags/${tagSlug(tag)}`)}`).join('\n')}`,
    `## Formats and discovery
- ${link('RSS', '/rss.xml')}: projects, articles and reports.
- ${link('Sitemap', '/sitemap.xml')}: canonical public pages.
- Public HTML pages advertise a generated Markdown twin in a link with type text/markdown. Request the canonical page with Accept: text/markdown, or follow that advertised link.
- PDFs are linked from the report pages. The report summary and the PDF are distinct resources.`,
    `## Access and scope
Public content is free to read. Private analytics and form-confirmation pages are not part of this directory. Dates reflect the published content, not the time of the latest site build.`,
  ];
  return new Response(`${sections.join('\n\n')}\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
