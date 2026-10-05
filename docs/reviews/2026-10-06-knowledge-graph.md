# Public knowledge graph review

Reviewed 6 October 2026. The goal is a detailed, connected description of the published site for search engines and assistants. Accuracy, consistent identity and discoverability matter more than adding arbitrary fields.

## Changes

The central graph now always contains Hamish, the website and the canonical page. Detail pages add separate BlogPosting, Report or CreativeWork entities. Stable URL identifiers connect page, content, author, website, images, breadcrumbs and topics across detail pages and indexes. About identifies Hamish through ProfilePage; CV and Contact use their appropriate page types. The author image is an optimised portrait rather than the application icon.

Article bodies, word counts, reading duration and citations derive from rendered content. Project text includes the displayed outcome. Reports connect to PDF MediaObject encodings with actual MIME type and byte size; their summaries do not pretend to contain extracted PDF text. Publication and modification dates come from content fields, including Sanity document modification dates for work and reports. The sitemap uses those modification dates too.

Collection pages describe their actual entries in displayed order. The homepage includes its interspersed writing and reading links. Work and tag indexes use the same feed as their HTML. Reading exposes twelve books in three ordered lists, with each book's own author and available cover and resource link. Hamish is not marked as the author of those books. Five existing topics have shared DefinedTerm identities.

The generated llms.txt directory now lists published projects, posts, reports, topic pages and resource links with summaries and dates. It links RSS and the sitemap and describes the site's existing negotiated Markdown format. Canonicals, redirects, robots and RSS remain unchanged. Private analytics are excluded from the catalogue, and generic page metadata makes no blanket free-access claim about private routes.

JSON-LD serialization escapes markup delimiters to prevent article text from closing the embedding script. Regression checks verify unique identifiers, canonical relationships, ordered lists, portrait metadata, real book authors, PDF encodings and directory coverage.

## Representative graph size

These counts describe generated local HTML, not a ranking measure:

| Page | Nodes | Content represented |
| --- | ---: | --- |
| Home | 11 | Five projects, one post and the reading page |
| About | 4 | Author profile and breadcrumb |
| Work & Writing | 23 | Eight projects, three posts, two reports and five topics |
| Reading | 19 | Twelve books in three lists |
| The City | 6 | Page, project account, image, author, website and breadcrumb |

Full article text adds substantially more detail without duplicating every article throughout the entire site.

## Alphero article

The City's existing hero links now include **Read on Alphero**, pointing to [Who's watching the monitors?](https://www.alphero.com/intelligence/articles/turning-claude-code-sessions-into-a-visual-dashboard). It is a related article, so the graph exposes it through relatedLink rather than sameAs. The original project page and the Alphero article are different resources.

The Sanity update was published at 2026-10-05T21:48:54Z. A follow-up Netlify build started approximately five minutes later. Deploy 6ac41c7087682ef46f44825a reached ready state; its immutable permalink confirmed the link in both HTML and negotiated Markdown. Home and About also returned successful pages. That production build uses remote main; the new local graph code is not deployed yet.

## Remaining opportunities

Employer, education and location could become explicit structured profile fields in Sanity, with matching visible copy and stable organisation identities. Current prose and CV facts contain some of this information, but parsing sentences into credentials would be fragile. Add those fields deliberately rather than hard-code inferred claims into the graph.

Project software can receive separate SoftwareApplication entities if the content model supplies maintained application names, supported platforms, versions and distribution URLs. A case study is currently represented as its written account, which avoids incorrectly assigning product features or offers to the article itself.

PDF text extraction and a human-readable report transcript could improve access to research detail. This requires an accessible published transcript, not an invisible dump in JSON-LD. Existing report summaries and PDF links are represented accurately.

After code deployment, validate representative production URLs with Google's Rich Results Test and Search Console URL Inspection. Monitor indexing and search performance over time. Generic Schema.org entities are useful descriptions but do not all qualify for Google's rich-result formats. No ranking or citation increase has been established by this local implementation.

## Guidance consulted

[Google's structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) require markup to represent the page's content. [ProfilePage guidance](https://developers.google.com/search/docs/appearance/structured-data/profile-page) informs the author's profile relationship. [Google's AI features guidance](https://developers.google.com/search/docs/appearance/ai-features) describes ordinary SEO requirements for AI search and does not prescribe special AI schema. llms.txt is an additional directory, not a substitute for crawlable HTML or evidence of guaranteed assistant consumption.

## Validation

Production build and Astro checks passed. All 183 tests passed against generated output, with no skipped tests. Knip passed. Studio build passed; it reported the existing local/runtime Sanity version difference. No dependencies were changed. The user's existing package.json and local Claude settings edits are excluded from these commits.
