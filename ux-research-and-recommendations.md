# UX Research & Recommendations for hamishburke.dev

*Comprehensive audit covering user personas, journey maps, competitive analysis, and a prioritised improvement roadmap.*

**Date:** March 21, 2026 (original) · March 21, 2026 (reassessment update)
**Site:** https://hamishburke.dev
**Stack:** Astro 5 + Sanity CMS + Tailwind CSS v4, hosted on Netlify

---

## 0. Reassessment Summary (Post-Update)

After the initial audit, significant changes were implemented across the site. This section tracks what was addressed, what improved, and what remains outstanding.

### Changes Implemented — What's Now Working Well

**Hero section — transformed.** The generic tagline has been replaced with a specific, informative introduction: software engineer, AI infrastructure, self-hosted tools, Wellington NZ, Junior Web Developer at Alphero. The dual CTAs ("See my projects" / "Read my writing") are perfectly journey-appropriate. The "Currently" status line below (role at Alphero, MSc Computer Science, VUW) gives employers immediate context. This is a night-and-day improvement.

**Mobile navigation — fixed.** A hamburger menu now appears on mobile viewports, revealing Projects, Writing, Reading, and About links. This was a critical blocker — mobile visitors can now actually navigate the site.

**About page — substantially enriched.** The bio is now three strong paragraphs covering education (MSc thesis on anomaly detection in electrical distribution networks using diffusion methods), current role, technical interests, and personal hobbies. The new "Currently" card is excellent — Working, Building, Learning, and Reading in a clean 2x2 grid. The "Get in Touch" section with four clear buttons (Email me, GitHub, LinkedIn, View CV) is exactly right. The "This Website" section adds a nice meta-transparency touch.

**CV page — fully implemented.** A dedicated `/cv` route with a prominent "Curriculum Vitae" header, subtitle, Download PDF and Open in New Tab buttons, and an embedded PDF viewer. This is professional and complete. The CV link also appears in the footer navigation.

**Footer — dramatically improved.** Now includes the "Hamish Burke" name, a one-line bio, Alphero link, full navigation links (Home, Projects, Writing, Reading, About, CV), and social icons (GitHub, LinkedIn, Email, RSS). This went from bare-minimum to genuinely useful.

**Blog post reading experience — improved.** Social sharing buttons (Twitter/X, LinkedIn) now appear at the end of posts. An "Enjoyed this post?" RSS subscription prompt is placed after the content — the highest-converting position. A "Back to writing" link provides clear navigation after reading. The scroll progress indicator is active at the top of the page.

**Navigation redesign.** The nav now uses a centred logo/icon with links split either side (Projects, Writing | Reading, About), plus accent colour picker and theme toggle. This is a cleaner layout than the previous left-aligned "Hamish" text.

**"View all" links added.** The bottom of the homepage bento grid now has "View all projects →" and "View all writing →" links, giving visitors a clear path forward after scanning.

### Issues Identified in Reassessment

**Broken logo/favicon in navigation.** The centred nav element that should show a logo or monogram is rendering as a broken image placeholder (a pink-bordered square with an X). This is the most visible thing on every page and reads as unfinished. This needs fixing urgently — either load the correct image asset, use an SVG inline, or fall back to text ("HB" or "Hamish") until the image is sorted.

**About page still lacks a photo.** The bio is much stronger now, but there's still no headshot or working photo. Research consistently shows that a face makes a portfolio more memorable and personable. For employer visitors in particular, putting a face to the application is important for recall during hiring discussions.

**Navigation doesn't include CV link.** The CV is accessible from the About page's "View CV" button and the footer, but not from the main navigation bar. Given that the CV page exists and is well-built, adding it to the nav (or at least making it more discoverable) would help employer visitors who go looking for it.

**No related posts at end of blog articles.** The post ends with sharing buttons and an RSS prompt, but there's no "You might also like" or "More writing" section. With only a few posts this is less critical, but as content grows, related posts keep readers on-site longer.

**Project pages still lack depth.** The project cards remain description + tech tags. No screenshots, no case studies, no live demo links, no architecture diagrams. This is still the single biggest gap for the employer audience (Persona 1: Alex). The hero and About page improvements help get visitors interested — now the projects need to close the deal.

### Updated Priority Matrix

| Recommendation | Original Priority | Status | New Priority |
|----------------|-------------------|--------|--------------|
| Rewrite hero section | P0 | **Done** | — |
| Fix mobile navigation | P0 | **Done** | — |
| Enrich About page | P0 | **Done** (minus photo) | — |
| Add CV link/download | P0 | **Done** | — |
| Improve footer | P1 | **Done** | — |
| Fix broken nav logo | — | **New issue** | **P0** |
| Add photo to About page | P0 (part of About) | **Outstanding** | **P1** |
| Project case studies (top 3) | P1 | **Outstanding** | **P1** |
| Add screenshots to project cards | P1 | **Outstanding** | **P1** |
| Project status badges | P1 | **Outstanding** | **P2** |
| Add CV to main navigation | — | **New suggestion** | **P2** |
| Newsletter signup | P2 | **Partially done** (RSS prompt exists) | **P2** |
| Blog sharing buttons | P2 | **Done** | — |
| Related posts at end of articles | P2 | **Outstanding** | **P2** |
| Rationalise tags | P2 | **Outstanding** | **P3** |
| Add search (Pagefind) | P3 | **Outstanding** | **P3** |
| Social proof / GitHub stats | P3 | **Outstanding** | **P3** |
| Interactive project demos | P3 | **Outstanding** | **P3** |
| Connect Reading page with reviews | P3 | **Outstanding** | **P3** |

### Bottom Line

The Phase 1 recommendations have been comprehensively addressed. The site has gone from "clean but generic" to "specific, professional, and navigable." The hero, About page, footer, mobile nav, CV, and blog post experience are all markedly better. The remaining high-impact work is: fix the broken nav logo (immediate), add a photo to the About page (quick win), and build out project case studies with visuals (the biggest remaining gap for employer visitors).

---

## 1. Executive Summary

hamishburke.dev is a well-built developer portfolio and blog with strong technical foundations — solid SEO metadata, good accessibility basics, a clean design system, and a thoughtful bento-grid homepage. However, the site underperforms relative to its potential in several key areas: it lacks a clear value proposition for its two primary audiences, projects are presented as lists rather than narratives, there is no mechanism to capture or retain visitors, and the About page undersells Hamish's capabilities. This document provides research-backed personas, journey maps, and a phased roadmap of concrete improvements.

---

## 2. Current Site Audit

### 2.1 What's Working Well

**Technical foundations are strong.** The Astro + Sanity stack is modern and performant. Server-side rendering with Netlify gives good TTFB. The design token system (custom properties for colours, spacing, typography) is well-organised and maintainable. Tailwind v4 integration is clean.

**SEO setup is thorough.** Open Graph tags, Twitter Cards, JSON-LD structured data (Person, WebSite, BlogPosting, BreadcrumbList), canonical URLs, sitemap, robots.txt with explicit AI-crawler permissions, and an llms.txt file. This is ahead of most developer portfolios.

**Accessibility basics are in place.** Skip-to-content link, ARIA labels, semantic HTML, focus indicators, reduced-motion support, and font-display swap. These form a solid baseline.

**The bento grid homepage is visually engaging.** The mix of writing, projects, hobbies (bouldering, piano), and reading creates a sense of personality. The hobby tiles with images are a genuine differentiator — most developer portfolios feel sterile by comparison.

**Content quality is high.** The GPU sharing post demonstrates clear thinking, technical depth, and good writing. The projects span AI/ML, infrastructure, web apps, and creative tools — showing genuine range.

**Customisation features are thoughtful.** The accent colour picker and theme toggle (system/light/dark) show attention to user experience detail.

### 2.2 Key Issues Identified

**The hero section is generic.** "Hi, I'm Hamish — I build things with code and write about technology, software engineering, and whatever I'm learning" could describe any developer. It doesn't communicate what makes Hamish's work distinctive (AI infrastructure, self-hosting, systems thinking) or give visitors a reason to explore further.

**The primary CTA is an email address.** The pink `hamishapps@gmail.com` button is the only call-to-action above the fold. For an employer scanning portfolios, this is premature — they want to evaluate before making contact. For a fellow developer, an email address is friction-heavy compared to a GitHub link or an invitation to read.

**Projects lack narrative depth.** Each project card shows a title, date, short description, and tech tags. There are no screenshots, no live demos, no problem-solution framing, no outcomes. Research consistently shows that hiring managers want to understand *how you think*, not just *what you built*. The current presentation treats projects as inventory rather than stories.

**The About page is underdeveloped.** Two short paragraphs and a skills list. No photo, no professional story, no link to CV/resume, no indication of what Hamish is looking for (work, collaborations, open source contributions). The About page is typically the second most-visited page on a portfolio — it's doing very little work here.

**No visitor retention mechanism.** There is no newsletter signup, no RSS discovery beyond the XML endpoint, no "follow me" prompts, no content series organisation. A visitor who reads one post and leaves has no pathway back.

**Navigation hides on mobile.** The mobile view drops the navigation links entirely, leaving only the theme/accent buttons. On a 375px viewport, there's no visible way to navigate to Projects, Writing, Reading, or About without scrolling to the footer.

**Content volume is thin.** Two blog posts and approximately seven projects. The bento grid handles this well aesthetically, but the Writing and Projects pages feel sparse. The tag filtering on Writing shows 17 tags for what appears to be five pieces of content — the tag-to-content ratio suggests over-categorisation.

**No search functionality.** With growing content, there's no way for visitors to find specific topics. This matters more for returning developer-readers than for employer visitors.

**The Reading page is disconnected.** It's a nice personal touch, but the books have no reviews, no connection to blog topics, and no explanation of why they're listed. It sits as an isolated feature.

**Footer is minimal.** GitHub and LinkedIn icons with copyright. No sitemap links, no newsletter signup, no "latest post" teaser.

---

## 3. User Personas

### Persona 1: "Alex" — The Hiring Manager / Potential Client

| Attribute | Detail |
|-----------|--------|
| **Age** | 30–45 |
| **Role** | Engineering Manager, Tech Lead, or CTO at a startup/agency |
| **Goal** | Evaluate Hamish's technical capability, communication skills, and cultural fit |
| **Context** | Found the site via LinkedIn, a job application link, or a Google search for "Hamish Burke developer" |
| **Time on site** | 2–5 minutes (scanning), up to 15 minutes (deep evaluation) |
| **Device** | 60% desktop (at work), 40% mobile (commute screening) |
| **Frustrations** | Generic portfolios that don't show real work; having to guess what the person actually did vs. what the team did; no way to quickly assess seniority level |
| **Success criteria** | Can answer: "Is this person technically strong? Can they communicate? Would they fit our team?" |

**Behavioural patterns:** Alex opens many portfolio tabs at once during a hiring sprint. They spend under 30 seconds deciding whether to stay or close the tab. They look for: a clear "what I do" statement, 2–3 compelling project case studies, evidence of communication ability (blog posts), and an easy way to get in touch or download a CV.

### Persona 2: "Sam" — The Fellow Developer / Technical Reader

| Attribute | Detail |
|-----------|--------|
| **Age** | 22–35 |
| **Role** | Software engineer, CS student, or hobbyist developer |
| **Goal** | Learn something new, find a solution to a problem, or discover interesting projects |
| **Context** | Arrived via a search result, Hacker News/Reddit link, Twitter share, or RSS feed |
| **Time on site** | 5–20 minutes per visit (reading a post), occasional return visits |
| **Device** | 55% desktop (coding alongside), 45% mobile (reading during breaks) |
| **Frustrations** | Blog posts that are all theory and no code; sites that are hard to read on mobile; no way to find related content or follow updates |
| **Success criteria** | Learned something useful; bookmarked/shared the post; discovered other interesting content on the site |

**Behavioural patterns:** Sam typically lands on a specific post, not the homepage. They'll skim the table of contents, scroll to the section that answers their question, and then decide whether to read the full piece. If the content is good, they'll check what else the author has written. They're unlikely to sign up for a newsletter on the first visit but might on the second or third.

### Persona 3: "Jordan" — The Open Source Collaborator / Peer

| Attribute | Detail |
|-----------|--------|
| **Age** | 20–40 |
| **Role** | Developer interested in self-hosting, AI infrastructure, or one of Hamish's specific projects |
| **Goal** | Evaluate whether to use, fork, or contribute to a project |
| **Context** | Found the site from a GitHub repo README link or a project mention in a forum |
| **Time on site** | 3–10 minutes, focused on one project |
| **Device** | 80% desktop |
| **Frustrations** | Can't find live demos, architecture diagrams, or setup instructions; unclear project status (active? maintained? experimental?) |
| **Success criteria** | Understands what the project does, how it works, and whether it's worth trying |

---

## 4. User Journey Maps

### 4.1 Alex's Journey: Evaluating Hamish for a Role

```
STAGE        | ARRIVE              | ORIENT                | EVALUATE              | DECIDE               | ACT
-------------|----------------------|-----------------------|-----------------------|----------------------|-------------------
Action       | Opens hamishburke.dev| Reads hero, scans nav | Clicks 2-3 projects   | Checks About page    | Looks for contact/CV
             | from LinkedIn link   | and bento grid        | and 1 blog post       | for background info  |
             |                      |                       |                       |                      |
Thinking     | "Let's see what      | "OK, developer blog.  | "What did they        | "Where are they      | "How do I get in
             | this person's about" | What stands out?"     | actually build?"      | based? What level?"  | touch or get a CV?"
             |                      |                       |                       |                      |
Feeling      | Neutral, busy        | Mildly interested —   | Frustrated — cards    | Underwhelmed — very  | Slightly annoyed —
             |                      | bento grid is nice    | lack depth, no demos  | sparse, no photo     | only option is email
             |                      |                       |                       |                      |
Pain point   |                      | Hero doesn't tell me  | No screenshots, no    | No CV link, no       | Gmail address feels
             |                      | their speciality      | outcomes, no live     | professional story,  | informal; no
             |                      |                       | demos                 | no work history      | contact form
             |                      |                       |                       |                      |
Opportunity  | Specific value prop  | Highlight featured    | Project case studies  | Rich About page with | CV download, contact
             | in hero              | projects prominently  | with visuals          | photo and story      | form, LinkedIn CTA
```

### 4.2 Sam's Journey: Reading a Technical Post

```
STAGE        | DISCOVER             | LAND                  | READ                  | EXPLORE              | RETURN
-------------|----------------------|-----------------------|-----------------------|----------------------|-------------------
Action       | Finds post via       | Sees title, date,     | Reads through post,   | Checks for related   | ...doesn't, because
             | Google/social link   | tags, reading time    | uses ToC to navigate  | posts or more by     | there's no mechanism
             |                      |                       |                       | same author          | to stay connected
             |                      |                       |                       |                      |
Thinking     | "This looks like     | "7 min read, good.    | "This is well written | "What else have they | "I'll probably forget
             | what I need"         | Let me scan the ToC"  | and substantive"      | written?"            | about this site"
             |                      |                       |                       |                      |
Feeling      | Curious              | Positive — clean      | Engaged — good prose, | Mildly disappointed  | Neutral — no pull
             |                      | layout, ToC helpful   | cited sources         | — only 2 other posts | to come back
             |                      |                       |                       |                      |
Pain point   |                      |                       | No code playgrounds   | Related posts section| No newsletter, no
             |                      |                       | or interactive demos  | is minimal or absent | RSS prompt, no
             |                      |                       |                       |                      | social follow CTA
             |                      |                       |                       |                      |
Opportunity  |                      | Reading progress bar  | Embedded code demos,  | Content series,      | Newsletter signup,
             |                      |                       | copy-to-clipboard     | better related posts | RSS discovery,
             |                      |                       |                       |                      | "follow" prompt
```

### 4.3 Jordan's Journey: Evaluating a Project

```
STAGE        | ARRIVE               | UNDERSTAND            | EVALUATE              | TRY                  | ENGAGE
-------------|----------------------|-----------------------|-----------------------|----------------------|-------------------
Action       | Clicks project card  | Reads description     | Looks for demo,       | Wants to try it /    | Wants to ask a
             | from homepage/GitHub | and tech stack        | architecture, docs    | see it in action     | question or help
             |                      |                       |                       |                      |
Thinking     | "Let me see what     | "OK I get the basic   | "But how does it      | "Can I try this      | "How do I reach
             | this project is"     | concept"              | actually work?"       | without cloning?"    | this person?"
             |                      |                       |                       |                      |
Pain point   |                      | Description is a      | No architecture       | No live demo link,   | Only contact is
             |                      | single paragraph      | diagram, no           | no screenshots       | email address
             |                      |                       | screenshots           |                      |
             |                      |                       |                       |                      |
Opportunity  |                      | Full case study       | Diagrams, screenshots | Live demo links,     | GitHub issues link,
             |                      | with problem/solution | video walkthrough     | Docker quick-start   | discussion link
```

---

## 5. User Stories

### For Alex (Hiring Manager)

- As a hiring manager, I want to **understand Hamish's specialisation within 10 seconds** so I can decide whether to keep evaluating.
- As a hiring manager, I want to **see 2–3 detailed project case studies** so I can assess problem-solving ability and technical depth.
- As a hiring manager, I want to **read about Hamish's background and professional journey** so I can evaluate cultural fit and seniority.
- As a hiring manager, I want to **download or view a CV/resume** so I can share it with my team for discussion.
- As a hiring manager, I want to **see evidence of communication skills** so I can assess whether this person can work in a team.
- As a hiring manager, I want to **easily contact Hamish** through a professional channel so I can start a conversation.

### For Sam (Technical Reader)

- As a developer, I want to **quickly find posts on topics I care about** so I don't waste time browsing irrelevant content.
- As a developer, I want to **copy code snippets easily** so I can use them in my own projects.
- As a developer, I want to **see a reading progress indicator** so I know how much is left.
- As a developer, I want to **subscribe to new posts** so I don't miss future content.
- As a developer, I want to **share a specific post** on social media or with colleagues.
- As a developer, I want to **find related posts** after finishing one, so I can keep learning.

### For Jordan (Collaborator)

- As a potential contributor, I want to **see whether a project is actively maintained** so I know if my contribution will be reviewed.
- As a potential contributor, I want to **find architecture documentation** so I can understand the codebase before diving in.
- As a potential user, I want to **try a live demo** before committing to a local setup.
- As a potential user, I want to **see what technologies a project uses** so I can assess compatibility with my own stack.

---

## 6. Competitive Analysis

### 6.1 Methodology

Analysed top-performing developer portfolios identified through Awwwards, community curations, and developer blog aggregators. Focused on sites serving the same dual audience (employers + developers) as hamishburke.dev.

### 6.2 Key Patterns from Top Portfolios

**Hero sections that communicate specificity.** The strongest portfolios lead with a specific identity, not a generic one. Instead of "I build things with code," effective heroes say something like "I design and build AI infrastructure" or "Full-stack engineer focused on developer tools." This immediately helps visitors self-select.

**Project case studies over project lists.** Award-winning portfolios (Awwwards Portfolio winners 2025–2026) consistently present projects as narratives: problem, approach, solution, outcome. They include screenshots, architecture diagrams, and measurable results. The project card is a teaser; the project page is the substance.

**Strategic CTA placement.** Top portfolios place CTAs contextually: "See my work" after the hero, "Get in touch" after project showcases, "Download CV" on the About page. The CTA evolves with the visitor's journey rather than appearing once above the fold.

**Social proof integration.** GitHub contribution graphs, star counts, testimonial quotes from colleagues or clients, and company logos. These elements appear naturally within content rather than in a dedicated "testimonials" section.

**Newsletter/RSS integration.** Developer blogs with growing audiences (Wes Bos, Josh Comeau, Kent C. Dodds) prominently feature newsletter signups. The highest-converting placement is after a reader finishes a post, not in the header or sidebar.

**Rich About pages.** The About page typically includes: a professional photo, a 3–4 paragraph narrative, a link to CV/resume, current status (available for work, happily employed, open to freelance), and social links. Some include a "fun facts" or "currently" section (currently reading, currently building).

### 6.3 Where hamishburke.dev Stands

| Dimension | Industry Best Practice | hamishburke.dev | Gap |
|-----------|----------------------|-----------------|-----|
| Hero specificity | Niche-specific value prop | Generic "build things with code" | Large |
| Project depth | Full case studies with visuals | Card with description + tags | Large |
| About page | Photo + narrative + status + CV | 2 paragraphs + skills list | Large |
| CTAs | Contextual, journey-appropriate | Single email button | Large |
| Social proof | GitHub stats, testimonials | None visible | Large |
| Visitor retention | Newsletter, RSS, follow prompts | RSS endpoint exists but undiscoverable | Medium |
| Blog reading experience | Progress bar, copy buttons, sharing | ToC + clean typography | Small |
| Mobile navigation | Hamburger menu or slide-out nav | Navigation disappears entirely | Medium |
| Search | On-site search for content | Not available | Medium |
| Design quality | Clean, branded, consistent | Clean and consistent, good tokens | Small — already strong |
| SEO/metadata | Comprehensive | Comprehensive | Negligible — already excellent |
| Accessibility | WCAG AA compliance | Good foundations, some gaps | Small |

---

## 7. Detailed Recommendations

### Phase 1: High-Impact, Low-Effort (1–2 weeks)

These changes address the largest gaps with the smallest implementation cost.

#### 7.1 Rewrite the Hero Section

**Current:** "Hi, I'm Hamish — I build things with code and write about technology, software engineering, and whatever I'm learning."

**Recommended approach:** Lead with specificity. Something along the lines of: "Software engineer building AI infrastructure, self-hosted tools, and full-stack web applications. Based in Wellington, NZ — currently studying at Victoria University."

Add a secondary line that creates intrigue or shows personality, then replace the email CTA with two buttons: "See my projects" (primary) and "Read my writing" (secondary). Move contact information to the About page and footer where it belongs contextually.

#### 7.2 Fix Mobile Navigation

The current mobile layout drops all navigation links. Implement a hamburger menu that reveals the full navigation. This is essential — mobile visitors currently have no way to navigate except by scrolling to the footer or guessing URLs.

#### 7.3 Enrich the About Page

Add a professional photo (headshot or working photo). Expand the bio to 3–4 paragraphs covering: who you are, what you specialise in, what you're currently working on, and what you're looking for (work, collaborations, etc.). Add a "Currently" section (currently reading, currently building, currently learning). Link to your CV. Include a contact form or at minimum a proper "Get in touch" section with email, GitHub, and LinkedIn prominently displayed.

#### 7.4 Add a CV/Resume Page or Download

You have a `/cv` route in the codebase. Make sure it's accessible from the navigation or About page. Offer both a web view and a PDF download. This is table-stakes for employer visitors.

#### 7.5 Improve the Footer

Add: key navigation links (Projects, Writing, About), a one-line site description, an RSS link with a feed icon, and social links (already present but could be more prominent). Consider adding a "Latest post" teaser to encourage exploration.

---

### Phase 2: Project Case Studies (2–4 weeks)

This is the single highest-impact change for the employer audience.

#### 7.6 Create Full Project Pages

For your top 3–4 projects (GPUShare, HealthAgent, Wiki Router, DropETA), create dedicated case study pages with this structure:

1. **Header:** Project name, one-line description, hero screenshot or diagram
2. **The Problem:** What need or curiosity drove this project? (2–3 sentences)
3. **The Approach:** How did you design the solution? What trade-offs did you consider? Include architecture diagrams where relevant.
4. **The Implementation:** Key technical decisions, interesting challenges, code snippets. This is where you show depth.
5. **The Outcome:** What does it do? Metrics if available (users, performance, etc.). Screenshots of the working product.
6. **Tech Stack:** Visual display of technologies used, with brief notes on why each was chosen.
7. **Links:** Live demo (if available), GitHub repo, related blog post.

#### 7.7 Add Screenshots and Visuals to Project Cards

Even before full case studies, adding a single screenshot or diagram to each project card on the homepage and Projects page would dramatically improve scannability and visual interest. The current cards are text-heavy and visually uniform.

#### 7.8 Indicate Project Status

Add a status badge to each project: "Active," "Maintained," "Experimental," "Archived." This helps the collaborator persona (Jordan) assess whether a project is worth engaging with.

---

### Phase 3: Content & Engagement (2–4 weeks)

#### 7.9 Add a Newsletter Signup

Place a newsletter signup at three points: the end of every blog post (highest conversion point for readers who just finished engaging content), the Writing page (for visitors browsing your catalogue), and the footer (passive, always-available). Keep the pitch simple and developer-focused — something like "Occasional posts about AI, infrastructure, and building things. No spam."

Use a service like Buttondown (developer-friendly, supports markdown) or Beehiiv. Even a simple "subscribe via RSS" prompt with a visible link would be an improvement over the current hidden RSS endpoint.

#### 7.10 Improve Blog Post Reading Experience

Add a scroll progress indicator (you have `#scroll-progress` in your CSS — wire it up if it isn't already active). Add copy-to-clipboard buttons on code blocks. Add social sharing buttons at the end of posts (Twitter/X, LinkedIn, Hacker News). Consider a "Share this post" component.

#### 7.11 Strengthen Related Posts

The `RelatedPosts.astro` component exists. Make sure it appears on every post and surfaces genuinely related content (by shared tags). As content volume grows, this becomes increasingly valuable for keeping readers on-site.

#### 7.12 Rationalise Tags

You currently have 17+ tags for roughly 5 pieces of content. Consolidate to 5–8 broad categories that will scale: AI/ML, Infrastructure, Web Development, Data Engineering, Research. Tags should be useful for discovery, not exhaustive metadata.

#### 7.13 Add Content Series Support

Group related posts into series (e.g., "Building GPUShare" as a multi-part series). This encourages return visits and gives readers a structured path through your content.

---

### Phase 4: Polish & Differentiation (4–8 weeks)

#### 7.14 Add Search

Implement client-side search using Pagefind (Astro-native, zero-config) or Fuse.js. As your content library grows past 10 posts, search becomes essential for the developer reader persona.

#### 7.15 Add Social Proof

Integrate GitHub stats for your most popular repos (stars, forks). If you have testimonials from colleagues, classmates, or project collaborators, add 2–3 quotes to the homepage or About page. Even "used by X people" or "Y GitHub stars" on project cards adds credibility.

#### 7.16 Interactive Project Demos

For projects that lend themselves to it (Bedroom Layout Designer, Piano Improvisation Helper), embed live demos or at minimum a video/GIF walkthrough. Interactive elements that *demonstrate your skills* are high-value; they're one of the strongest differentiators in developer portfolios.

#### 7.17 Connect the Reading Page

Add brief notes or reviews to books. Link books to relevant blog posts (e.g., a philosophy book linked to a post about thinking frameworks). This turns the Reading page from a bookshelf into a window into how you think — valuable for both personas.

#### 7.18 Add an "Open to Work" or "Currently" Banner

A subtle homepage indicator of your current status: "Currently looking for full-time roles in AI/infrastructure engineering" or "Open to freelance projects" or "Currently heads-down building GPUShare." This gives employer visitors immediate context.

#### 7.19 Improve 404 Page

Your 404 page is functional (Go Home / Go Back buttons) but could do more. Add a search bar, link to your most popular posts, or add a touch of personality. Some developers use the 404 page as a mini easter egg.

---

### Phase 5: Long-Term Growth (Ongoing)

#### 7.20 Content Calendar

Aim for 1–2 posts per month. Consistency matters more than frequency for building an audience. Your existing posts show you can write well — the challenge is maintaining cadence.

#### 7.21 Cross-Post Strategy

Consider cross-posting to Dev.to or Hashnode (with canonical URLs pointing back to hamishburke.dev) to increase discovery. Both platforms have built-in developer audiences that can drive traffic to your main site.

#### 7.22 Analytics & Iteration

Set up privacy-respecting analytics (Plausible, Umami, or Fathom) to understand which content resonates, where visitors come from, and where they drop off. Use this data to iterate on the recommendations above.

#### 7.23 Performance Monitoring

Run Lighthouse audits quarterly. Your technical foundations are good, but performance can regress as features are added. Maintain a target of 90+ on all Lighthouse categories.

---

## 8. Prioritisation Matrix

| Recommendation | Impact | Effort | Priority |
|----------------|--------|--------|----------|
| Rewrite hero section | High | Low | **P0** |
| Fix mobile navigation | High | Low | **P0** |
| Enrich About page | High | Low | **P0** |
| Add CV link/download | High | Low | **P0** |
| Improve footer | Medium | Low | **P1** |
| Project case studies (top 3) | Very High | Medium | **P1** |
| Add screenshots to project cards | High | Low | **P1** |
| Project status badges | Medium | Low | **P1** |
| Newsletter signup | High | Low | **P2** |
| Blog reading enhancements | Medium | Low | **P2** |
| Strengthen related posts | Medium | Low | **P2** |
| Rationalise tags | Low | Low | **P2** |
| Content series support | Medium | Medium | **P2** |
| Add search (Pagefind) | Medium | Low | **P3** |
| Social proof / GitHub stats | Medium | Medium | **P3** |
| Interactive project demos | High | High | **P3** |
| Connect Reading page | Low | Medium | **P3** |
| "Currently" status banner | Medium | Low | **P3** |
| Improve 404 page | Low | Low | **P3** |
| Content calendar | High | Ongoing | **P4** |
| Cross-posting strategy | Medium | Ongoing | **P4** |
| Analytics setup | Medium | Low | **P4** |

---

## 9. Measuring Success

### Key Metrics to Track

**For the employer audience:** Time on project pages (target: >2 minutes), About page visit rate (target: >30% of sessions), CV download/view count, contact form submissions or email clicks.

**For the developer audience:** Average scroll depth on blog posts (target: >60%), return visitor rate (target: >15%), newsletter subscriber growth, social shares per post, pages per session (target: >2).

**General health:** Bounce rate (target: <50%), mobile usability score (target: 100 on Lighthouse), Core Web Vitals (all green).

---

## 10. Sources & References

This document draws on UX research from the following areas:

- Awwwards portfolio gallery and winner analysis (2025–2026 portfolio category)
- UX Design Institute research on hiring manager portfolio evaluation
- Indeed Design portfolio advice from hiring managers
- Nielsen Norman Group portfolio creation methodology
- Interaction Design Foundation research on grabbing hiring manager attention
- Positional blog research on scroll depth benchmarks (60–80% engagement threshold)
- Developer newsletter design best practices (Sequenzy, Beehiiv research)
- Dev.to vs Hashnode platform comparison (BlogBowl, CSS-Tricks analysis)
- Colorlib, Elementor, Hostinger, and Webflow developer portfolio collections
- Format Magazine navigation design pattern analysis
- We Are Developers portfolio trend report (March 2025)
- Developer personal branding research (Dev Tech Insights, Axiom Themes)
