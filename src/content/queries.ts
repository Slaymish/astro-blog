import { fetchSanity } from './sanity';
import { validatePosts, validateReports, validateWorkStories } from './validate';
import type {
  AboutPage,
  Book,
  ContactPage,
  CvPage,
  HomePage,
  NotFoundPage,
  NowPage,
  Post,
  ReadingPage,
  Report,
  SiteSettings,
  WorkIndexPage,
  WorkStory,
  WritingIndexPage,
} from './types';

/** Expands an image asset to the fields the srcset helper and <img> need. */
const ASSET = '"asset": asset->{ _id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height }';

const image = (field: string) => `"${field}": ${field}{ ..., ${ASSET} }`;

const RELATED = `"related": related[]->{ _type, title, "slug": slug.current, publishedAt, date }`;

/**
 * A build renders several pages from the same collection. Memoising by
 * function name means each collection is fetched once per build rather than
 * once per page.
 */
const cache = new Map<string, Promise<unknown>>();

function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit) return hit as Promise<T>;
  const promise = load();
  cache.set(key, promise);
  return promise;
}

async function singleton<T>(id: string, projection: string): Promise<T> {
  const doc = await fetchSanity<T | null>(`*[_id == $id][0]${projection}`, { id });
  if (!doc) throw new Error(`Missing Sanity document "${id}"`);
  return doc;
}

// ------------------------------------------------------------- page singletons

export const getHomePage = () =>
  once('homePage', () =>
    singleton<HomePage>(
      'homePage',
      `{
        seo, eyebrow, heading, intro, aboutLabel,
        "featured": featured[]->slug.current,
        leadLinkLabel, moreWorkHeading, allWorkLabel, writingLabel,
        "writingEntry": writingEntry->{ _type, title, "slug": slug.current },
        writingBlurb, writingLinkLabel, allWritingLabel,
        readingLabel, readingText, readingLinkLabel
      }`,
    ),
  );

export const getWorkIndexPage = () =>
  once('workIndexPage', () => singleton<WorkIndexPage>('workIndexPage', '{ seo, hero }'));

export const getNowPage = () =>
  once('nowPage', () =>
    singleton<NowPage>('nowPage', '{ seo, hero, updatedAt, updatedLabel, entries }'),
  );

export const getReadingPage = () =>
  once('readingPage', () =>
    singleton<ReadingPage>('readingPage', '{ seo, eyebrow, headline, quote, groups, recommend }'),
  );

export const getAboutPage = () =>
  once('aboutPage', () =>
    singleton<AboutPage>(
      'aboutPage',
      '{ seo, eyebrow, heading, intro, portraitAlt, largeCopy, projects, background }',
    ),
  );

export const getCvPage = () => once('cvPage', () => singleton<CvPage>('cvPage', '{ seo, hero, facts, academic }'));

export const getWritingIndexPage = () =>
  once('writingIndexPage', () =>
    singleton<WritingIndexPage>(
      'writingIndexPage',
      '{ seo, hero, filterLabel, emptyMessage }',
    ),
  );

export const getContactPage = () =>
  once('contactPage', () =>
    singleton<ContactPage>('contactPage', '{ seo, hero, availabilityNote, channels }'),
  );

export const getNotFoundPage = () =>
  once('notFoundPage', () =>
    singleton<NotFoundPage>(
      'notFoundPage',
      '{ seo, code, heading, body, homeLabel, backLabel, suggestionsLabel, suggestions }',
    ),
  );

export const getSiteSettings = () =>
  once('siteSettings', () => singleton<SiteSettings>('siteSettings', '{ contactBand }'));

// ----------------------------------------------------------------- collections

export const getWorkStories = () =>
  once('workStories', async () => {
    const stories = await fetchSanity<WorkStory[]>(`*[_type == "workStory"] | order(order asc){
      _id, title, descriptor, "slug": slug.current, kind, order, date, timeframe,
      summary, introduction, role, body, resultHeading, result,
      links,
      "cover": cover{ kind, alt, figure, ${image('image')} },
      "evidence": evidence[]{ _key, alt, label, heading, caption, ${image('image')} },
      "artifacts": artifacts[]->{
        _type, title, "slug": slug.current, publishedAt,
        "excerpt": coalesce(excerpt, description)
      },
      ${RELATED}
    }`);
    assertValid('workStory', validateWorkStories(stories));
    return stories;
  });

export const getPosts = () =>
  once('posts', async () => {
    const posts = await fetchSanity<Post[]>(`*[_type == "post"] | order(publishedAt desc){
      _id, title, "slug": slug.current, publishedAt, updatedAt, excerpt,
      "tags": coalesce(tags, []), markdownBody,
      ${image('coverImage')},
      ${RELATED}
    }`);
    assertValid('post', validatePosts(posts));
    return posts;
  });

export const getReports = () =>
  once('reports', async () => {
    const reports = await fetchSanity<Report[]>(`*[_type == "report"] | order(publishedAt desc){
      _id, title, "slug": slug.current, publishedAt, description,
      "tags": coalesce(tags, []), body,
      "pdfUrl": pdfFile.asset->url,
      "pdfBytes": pdfFile.asset->size,
      ${RELATED}
    }`);
    assertValid('report', validateReports(reports));
    return reports;
  });

export const getBooks = () =>
  once('books', () =>
    fetchSanity<Book[]>(`*[_type == "book"]{
      _id, title, author, status, note, link, order, sharedNote,
      ${image('coverImage')}
    }`),
  );

export const getTags = () =>
  once('tags', () =>
    fetchSanity<string[]>('array::unique(*[_type in ["post", "report"]].tags[])').then((tags) =>
      (tags ?? []).filter(Boolean),
    ),
  );

function assertValid(type: string, errors: string[]): void {
  if (errors.length > 0) throw new Error(`Invalid ${type} collection: ${errors.join('; ')}`);
}
