import { aboutPage } from './aboutPage';
import { blockContent } from './blockContent';
import { book } from './book';
import { contactPage } from './contactPage';
import { ctaLink } from './ctaLink';
import { cvPage } from './cvPage';
import { homePage } from './homePage';
import { notFoundPage } from './notFoundPage';
import { post } from './post';
import { readingPage } from './readingPage';
import { report } from './report';
import { seo } from './seo';
import { siteSettings } from './siteSettings';
import { workIndexPage } from './workIndexPage';
import { workStory } from './workStory';
import { writingIndexPage } from './writingIndexPage';

export const schemaTypes = [
  // Shared objects
  seo,
  ctaLink,
  blockContent,
  // Content
  post,
  report,
  workStory,
  book,
  // Page copy singletons
  homePage,
  workIndexPage,
  writingIndexPage,
  readingPage,
  aboutPage,
  cvPage,
  contactPage,
  notFoundPage,
  siteSettings,
];
