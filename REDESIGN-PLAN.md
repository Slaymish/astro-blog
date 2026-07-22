# Rebuild Hamish Burke's Site Around Clear Work and Easy Contact

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

Maintain this document in accordance with `PLANS.md` at the repository root. It is intentionally self-contained so a contributor can execute the redesign without access to the conversation that produced it.

## Purpose / Big Picture

The rebuilt site should help a visitor arriving from LinkedIn understand what Hamish can help with, see credible proof, and know how to start a conversation within one screen. Apply an 80/20 glance principle to every major page: the initial viewport communicates roughly 80 percent of the decision-relevant story, while scrolling supplies the final 20 percent of evidence, process, and technical depth. This is an information-priority rule, not a demand to compress every word above the fold. It should still feel like Hamish's current site at its best: bold, youthful, technical, and alive. It should stop feeling slow, fragile, dense, or over-designed.

After this work, a visitor can scan a concise homepage, understand each selected project from a visual case snapshot, inspect projects, writing, and reports as one body of work, learn enough about Hamish to trust him, and book a call or email him. Native browser scrolling must always work. The logo, typography, and project graphics should provide the memorable visual energy, while content and controls stay stable.

The implementation is a presentation and editorial rebuild inside the existing Astro application. Astro, Sanity, Netlify, metadata helpers, crawl endpoints, and the guarded PDF proxy remain. Sanity document types, content, and detail destinations may change when the approved work-story model makes that useful. Replacing the framework would add migration risk without solving the current problems, which are concentrated in layout, animation, navigation, content hierarchy, and content quality.

## Design Read

Read this as a personal consultancy and portfolio for business owners, technical leads, and collaborators arriving from LinkedIn. The visual language is expressive editorial technology rather than agency spectacle or developer-dashboard UI. The system should feel confident, direct, energetic, and precise.

Use these design dials throughout implementation:

- `DESIGN_VARIANCE: 8`. Desktop composition may be asymmetric and poster-like, but mobile collapses to a disciplined single column.
- `MOTION_INTENSITY: 6`. Motion is visible and memorable, but it never alters scrolling or delays access to content.
- `VISUAL_DENSITY: 3`. The site is concise and spacious, with enough real work imagery and evidence to avoid feeling empty.

The working visual idea is **confident utility**. Large type communicates decisiveness. The existing HB mark supplies personality. A restrained vermilion accent communicates action without turning the site into a dark-tech cliché. Restrained surfaces, real project media, and readable body text communicate professionalism. The site should not imitate an Awwwards portfolio, a generic three-card SaaS landing page, or a terminal-themed developer portfolio.

## Product Strategy and Visitor Journey

The primary visitor is a potential client or collaborator who has already seen Hamish on LinkedIn. They are not browsing a general-interest blog. They are deciding whether Hamish understands useful business and technical problems and whether contacting him feels worthwhile.

The homepage should tell one continuous story:

1. Hamish designs and builds useful digital systems for complicated problems.
2. His practical offers are AI automation, websites and digital products, and solution architecture or technical direction.
3. His work and writing demonstrate both implementation ability and clear thinking.
4. His background, current role, and MSc provide context without becoming the headline.
5. A short call is the easiest next step, with email as the lower-commitment alternative.

Use one primary action label everywhere: **Book a call**. Use one secondary browsing label: **See my work**. Do not create competing labels such as “Let's talk,” “Start something,” “Connect,” and “Get in touch” for the same intent.

The first copy direction to test in the rebuilt hero is:

    Useful software for complicated problems.

    I design and build AI automations, digital products, and technical systems for teams that need a practical way forward.

This is a working copy direction, not a claim to publish without review. Final copy must remain accurate to work Hamish is willing and able to sell. Do not invent clients, testimonials, outcomes, or metrics.

## Information Architecture

The visible primary navigation has three destinations and one action:

- Home: `/`
- Work: `/work`
- About: `/about`
- Book a call: `https://cal.com/hamishburke/30min`

`/work` is the single public index for coherent work stories, not a dump of projects, posts, and reports. A work story represents one underlying piece of work and may contain several CMS artifacts. For example, GPUShare is one public story whose supporting artifacts are the project, the original technical post, the setup-update post, live product, and repository. It appears once in `/work`.

The CMS types stay separate because their fields and detail renderers are genuinely different. A project can have technologies and live links, a post can contain markdown and interactive elements, and a report can contain a PDF. The presentation layer groups those artifacts without destructive Sanity migration.

The current detail routes remain canonical and functional:

- `/projects/[slug]`
- `/posts/[slug]`
- `/reports/[...slug]`

The `/cv`, `/reading`, and tag routes remain available as secondary destinations but leave the primary navigation. Reading can appear as a small personal detail on the About page. The CV remains linked from About and the footer.

The first redesigned release has one explicit migration state. `/work` returns 200, appears in navigation and the sitemap, and is the preferred internal discovery route. `/projects`, `/writing`, and `/tools` continue to return 200 with their existing self-canonical URLs, but no longer appear in primary or footer navigation. Every existing detail URL remains resolvable either as its retained page or as an explicit redirect to its merged successor. This avoids orphaning indexed URLs while permitting deliberate content consolidation.

Legacy index redirects are a separate post-launch decision. Review at least 30 days of inbound traffic and search data before redirecting `/projects`, `/writing`, or `/tools` as whole indexes. Detail-route redirects caused by an approved content merge are different: ship those in the same release as the replacement story so an old post or project URL never becomes an unexplained 404. When any redirect is approved, update status behavior, sitemap entries, canonical policy, RSS discovery copy, `llms.txt`, and analytics together.

Do not create a separate Contact page or contact form in the first release. The existing Cal.com booking flow and email address already cover synchronous and asynchronous contact with less maintenance and less friction. A contact form is only justified later if analytics or user feedback show that email and booking are insufficient.

Booking links should use the same tab by default and make the external destination clear in accessible text, for example an `aria-label` that identifies Cal.com. The final contact band and About page must place the email fallback next to the booking option so a third-party outage or a visitor's scheduling preference never creates a dead end.

## Homepage Structure

The homepage should contain six purposeful sections. It should not be a long inventory of every content type.

The header is quiet and stable. The logo is visible at a normal size, the three navigation choices fit on one line at desktop, and the booking action is visually clear. On mobile, show the logo, booking action, and one menu control. Keep touch targets at least 44 by 44 CSS pixels.

The initial viewport is a poster-like proof strip, not an ornamental hero. It contains a specific headline of at most roughly 12 words, a supporting sentence of roughly 20 to 30 words, one dominant **Book a call** action, a quieter **See my work** link, two or three short proof cues, and one controlled logo, typographic, or project-graphic composition. The next section should visibly enter the bottom of common desktop viewports so the page advertises that more exists without withholding the core offer. The logo must be in normal document layout rather than transformed from a sticky header using measured viewport coordinates. Use content-led sizing with a bounded minimum, never a fixed viewport height. At increased text size or short viewports, the section must grow naturally rather than clip content merely to preserve a one-screen composition.

The offer section names exactly three ways Hamish can help: AI automation, websites and digital products, and solution architecture or technical direction. Each item gets one plain-language sentence and a tangible result. This section should use editorial grouping and spacing rather than three identical floating cards.

The selected work section contains two or three lead stories, not enough cards to resemble an inventory. At least one story should demonstrate practical software delivery and one should demonstrate systems or AI depth; communication skill can be evidence within those stories rather than a separate weak entry. Every lead story gets an original editorial graphic assembled from real interface fragments, system diagrams, outcome numerals, or project-specific shapes and labels. Never use stock imagery or a fabricated product screen.

The proof section explains how Hamish works using concrete evidence already available: current professional experience, MSc research, end-to-end technical breadth, and selected work outcomes. Do not add a logo wall or testimonial section until real, permissioned material exists. Do not turn job title or education into unsupported seniority claims.

The about preview pairs the existing headshot with a short personal and professional introduction. It should feel human without diverting the page into hobbies, a reading database, or a full CV.

The final contact band repeats **Book a call** and offers email as a secondary text link. It should be visually decisive but simpler than the current layered card stack.

## Content Curation and Work Stories

Treat every existing project, post, and report as a raw **artifact**. Treat the smaller set shown on `/work` as **work stories**. A work story has one primary artifact that owns its public destination and zero or more supporting artifacts that provide technical depth, updates, PDFs, demos, or source code. A supporting artifact never receives a second competing card on `/work` or the homepage.

This is a capability portfolio, not a product directory. A story does not need a public demo, maintained hosted service, open repository, or adoption CTA to be credible. Screenshots, architecture, source excerpts, decisions, and honest results can provide the proof. Live-product and repository links are optional supporting evidence; the primary action after every story remains booking or email. Never imply that Hamish promises ongoing access to a side project merely because a historical demo once existed.

The content pass must classify each potential story as **lead**, **support**, **improve**, or **archive**:

- Lead stories are the two or three strongest examples used on the homepage. They align with a service Hamish wants to sell, show meaningful ownership or decisions, contain enough evidence to discuss confidently, and are visually presentable.
- Support stories are polished enough for `/work` but do not need homepage prominence.
- Improve stories have a worthwhile core but need clearer writing, stronger media, an explicit contribution, or an honest outcome before publication.
- Archive stories are weak, duplicative, obsolete, off-positioning, or no longer work Hamish is proud to discuss. They leave all indexes and internal navigation; after export and redirect review, their source documents may remain unlisted, be unpublished, or be deleted.

Use five plain-language gates rather than rewarding volume: Does this support one of the three offers? Is Hamish proud to discuss it in a client call? Does it demonstrate a non-obvious decision, skill, or result? Is there enough real evidence or media to make the claim credible? Does it add something that a stronger story does not already demonstrate? Failure on two or more gates is a strong archive signal. Two artifacts about the same underlying problem are a merge signal, not a reason to publish both independently.

Every lead or support story needs a concise editorial brief before visual design: an explicit outcome-led title that says what was built, one-sentence value, context and problem, Hamish's role, two or three important decisions or tradeoffs, implementation evidence, honest result or learning, primary media, and supporting artifact links. Also write the initial-viewport version: one problem sentence, up to three intervention bullets of roughly 14 words each, result or learning, role, timeframe, and graphic concept. Do not force an outcome metric where none exists.

The Sanity inventory contains fourteen artifacts: eight projects, three posts, and three reports. You Inc is an additional live production product not yet represented in that inventory. The existing documents already form two definite multi-artifact stories:

- `GPUShare`: primary project `project:gpu-share`; supporting posts `post:gpu-share` and `post:splitting-the-stack-and-making-setup-actually-work`; live product and GitHub repository.
- `Health Agent`: primary project `project:health-agent`; supporting post `post:healthagent-apple-health-data-ingestion-and-insights`; live product and GitHub repository.

The remaining projects and reports require explicit review rather than automatic publication. `Otto` has a cover but no project body. `brontehf.nz`, `DropETA`, and `Bedroom Layout Designer` have bodies but uneven media readiness. `Wiki Router` and `Piano Improvisation Helper` have neither body nor cover. The three reports are PDF-only. These facts do not decide quality, but they identify the work required before each item can become a lead or support story.

Use this updated decision matrix:

| Proposed story | Grouped artifacts | Evidence now | Recommended starting status | Decision or missing work |
| --- | --- | --- | --- | --- |
| `brontehf.nz` | Project, live client site | Finished real-client delivery, public credit, body, CMS and CI/CD detail | Lead, first | Build the narrative around translating Brontë's design into a fast, editor-friendly production portfolio. Confirm which public screens and process details may be shown. |
| You Inc | Live production product at `youinc.hamishburke.dev` | Public onboarding, bank-sync proposition, double-entry ledger, dashboard, pricing and security explanation | Lead | Add it to Sanity; tell the honest product-and-business story without presenting illustrative landing-page commissions as real clients or implying continued commercial operation. |
| GPUShare | Project, two posts, optional hosted demo, repository | Body, cover, implementation history and substantial system evidence | Lead | Rewrite as one capability story and design a compute-sharing/system-flow graphic. Do not require Hamish to keep a public demo running or frame it as a product visitors should adopt. |
| Health Agent | Project, post, live product, repository | Detailed technical post and real ingestion pipeline | Support | Merge into one story; add project body and visual; retain if it contributes distinct data-pipeline evidence beyond You Inc and GPUShare. |
| Sprint coaching website | Upcoming client project, not yet in production | Real commissioned work but currently incomplete | Improve / future lead | Do not publish or block launch. Capture process and assets now; promote after client approval, production launch, and a complete case-study review. |
| Otto | Project, repository | Distinctive native AI assistant concept and cover, but incomplete behavior | Improve, unlisted | Keep out of the first public portfolio. Reconsider only after completing and documenting the core workflow; do not present partial functionality as finished proof. |
| Bedroom Layout Designer | Project, live product, repository | Small unfinished demo project | Archive | Remove from redesigned discovery; no further presentation work. |
| DropETA | Project, live product, repository | Body and working PWA, but identified by Hamish as vibe-coded work | Archive | Remove from redesigned discovery; no further presentation work. |
| Wiki Router | Project, live product, repository | Interesting semantic A* concept, but identified by Hamish as vibe-coded work | Archive | Remove from redesigned discovery; no further presentation work. |
| Home Lab Architectural Study | PDF report | Direct solution-architecture evidence and operational detail | Support | Add an executive summary and simplified architecture graphic; use it as focused evidence for the technical-direction offer. |
| Wildfire Analysis with PySpark | Self-authored university report | Genuine large-scale data, PySpark, Hadoop and AI-system evidence | Support | Label it transparently as academic work and create a concise pipeline graphic; its purpose is large-scale technical proof, not client proof. |
| NoSQL survey | University report | Research and written communication, but general academic work | Archive | Remove from redesigned discovery; no further presentation work. |
| Piano Improvisation Helper | Project, live product, repository | Small vibe-coded experiment | Archive | Remove from redesigned discovery; no further presentation work. |

Professional Alphero client work is excluded unless Hamish later obtains explicit permission because it is covered by client NDAs. The Alphero reference informs only the visual storytelling approach. BrontëHF and the upcoming sprint coaching site are freelance work Hamish intends to discuss, but each still requires a public-information and client-permission check before process details or unpublished assets appear. The first-release shortlist is approved.

The provisional lead graphics have distinct narrative spines within the shared frame:

- **BrontëHF — design becomes a living portfolio.** Pair a stylized maker figure and selected real project imagery with cropped public site components, then show the short publishing path from editable CMS content to the finished portfolio. The graphic should communicate faithful implementation and easy ownership, not claim authorship of Brontë's visual design.
- **You Inc — bank feed becomes a CFO view.** Route a few real-shaped but anonymized transaction rows through balanced debit and credit entries into net-worth, runway, and cashflow components. A simplified person-at-the-centre figure may reinforce “run yourself like a company.” Clearly label sample data and do not reuse the site's illustrative commissions as proof.
- **GPUShare — idle hardware becomes shared compute.** Show one GPU host serving a small invited group, with distinct AI-inference and Blender-render paths, authorization boundaries, and usage or electricity metering. Use product UI crops only where they clarify setup or operation; no public-demo CTA is required.

Support stories use lighter-weight evidence graphics rather than three more hero-scale compositions: Health Agent gets an Apple Health export-to-insight pipeline, Home Lab gets the deployment and recovery architecture, and Wildfire Analysis gets the Spark/YARN feature-engineering and model-evaluation path.

### Draft Editorial Briefs and Case Snapshots

These drafts are the proposed source of truth for the six first-release stories. They use a precise, candid, technically fluent, and outcome-led voice. Initial-viewport copy uses four visible fields: a literal title, one plain-language summary, Hamish's role, and an honest status. Technical terms belong in the evidence and long-form narrative rather than competing with the first scan. These drafts require Hamish's content approval before Milestone 4 builds their public templates.

**BrontëHF — Client portfolio website.** Summary: Built an editor-friendly portfolio from the client's design. Role: implementation, responsive refinement, CMS integration, and technical delivery. Status: live at `brontehf.nz` with public author credit; no private client outcome or unpublished process claim. The problem was turning Brontë's visual direction and project material into a finished site they could update without editing code. The key decisions were Astro for a fast low-JavaScript front end, Decap CMS for project and page editing, and GitHub Actions for automated linting, building, and auditing. The honest result is a complete public portfolio with Home, Projects, About, Contact, CV, and live project content—not a claim that Hamish designed Brontë's visual identity. The deeper narrative is Context: a designer needed faithful technical execution; Constraint: preserve their authorship while making the site responsive and maintainable; Decisions: componentize the editorial layouts, separate content from code, and automate release checks; Execution: implement and refine the supplied direction; Evidence: public screens, CMS content path, CI configuration, and site credit; Reflection: good delivery can be technically quiet and make the client's work—not the developer's framework—the focus. Graphic brief: combine the public homepage typography, a real project-detail crop, and a three-step “Brontë's content → CMS → live portfolio” path. Use only public screens until Brontë approves private mockups or process material. Suggested alt text: “Brontë's portfolio homepage and project page connected to an editable publishing workflow.”

**You Inc — Personal finance ledger.** Summary: Built a personal-finance system that imports New Zealand bank feeds into a double-entry ledger and CFO-style dashboard. Role: solo product engineer responsible for product direction, data model, integrations, security posture, and delivery. Status: live signup and sample demo; no traction claim, and Hamish is not currently pursuing it as a business. The problem was that ordinary budgeting tools do not provide a coherent view of assets, liabilities, cashflow, and runway. The key decisions were read-only Akahu bank access, balanced journal entries with uncertain transactions held in suspense rather than guessed, server-side bank-token storage, and tenant isolation with row-level security. The honest result is a working system and public product demonstration, not evidence that the illustrative concierge commissions shown on its marketing page happened. The deeper narrative is Context: personal finance data was fragmented; Constraint: financial data needs auditability and explicit uncertainty; Decisions: model money as a ledger, separate ingestion from reporting, and make the security boundaries legible; Execution: connect, route, balance, and report; Evidence: public ledger table, dashboard, bank-to-board pipeline, security explanation, signup, and sample-data mode; Reflection: the accounting model was more important than adding more dashboard widgets. Graphic brief: route clearly labeled sample transactions through paired debit and credit lines into real net-worth, runway, and cashflow UI fragments. Label every number “sample data.” Suggested alt text: “Sample bank transactions becoming balanced journal entries and a personal finance dashboard.”

**GPUShare — Self-hosted GPU sharing platform.** Summary: Built the core of a self-hosted AI and rendering platform designed to share idle GPU capacity at electricity cost. Role: solo engineer across product design, distributed architecture, hardware integration, billing logic, and installers. Status: the core platform and setup workflow work; the portfolio does not promise a hosted demo, managed service, or user adoption. The problem was making one intermittently available home GPU useful to a trusted group without exposing hardware controls publicly or hiding usage cost. The strongest decisions were splitting public authentication and billing middleware from an internal-only hardware backend, using an outbound Cloudflare Tunnel rather than opening router ports, preserving OpenAI-compatible streaming and tool calls, metering electricity-based usage, and replacing a twelve-step setup guide with GPU-aware installers. The honest result is a substantial 130-commit implementation with working setup, corrected per-type ledger totals, and documented caveats around uptime, model quality, and desktop hardware—not a cloud competitor. The deeper narrative is Context: expensive hardware sits idle; Constraint: the host can be offline and hardware operations must stay private; Decisions: split trust boundaries, support local and fallback inference, sanitize Blender jobs, and automate setup; Execution: FastAPI services, Ollama, Blender, Postgres, R2, Stripe-optional billing, and cross-platform scripts; Evidence: dashboard screenshot, architecture, installer output, energy formula, and the two existing technical articles; Reflection: installability and correct accounting mattered more than adding another feature. Graphic brief: show Vercel/public middleware on one side of a clear trust boundary and the tunneled internal GPU/Ollama/Blender node on the other, with invited users and a small electricity-meter strip. Suggested alt text: “Invited users reach public GPUShare middleware, which securely proxies AI and rendering jobs to a private home GPU.”

**HealthAgent — Apple Health data pipeline.** Summary: Built a pipeline that normalizes daily Apple Health exports into Postgres and produces personal trend views. Role: solo engineer across ingestion, data normalization, API, dashboard, authentication, and cloud deployment. Status: ingestion and trend views work; generated insight backends are optional and should not be presented as completed health advice. The problem was comparing nutrition, workouts, heart rate, activity, and recovery signals that existed separately across apps. The key decisions were preserving raw exports before transformation, producing canonical user-scoped tables, using per-user ingest tokens, keeping model keys server-side, and scheduling daily Cloud Run processing while allowing local development. The honest result is a working end-to-end data pipeline and dashboard with an optional weekly insight layer, not a medical product or validated recommendation system. Graphic brief: show Health Auto Export JSON entering raw GCS storage, moving through Fastify/Prisma normalization into Postgres, then becoming daily metrics and optional weekly insights in the Next.js UI. Suggested alt text: “Apple Health exports move through raw storage and normalization into user-scoped trends and optional insights.”

**Home Lab — Raspberry Pi recovery architecture.** Summary: Designed and tested a resource-constrained home-lab stack with private administration, public access, and encrypted offsite recovery. Role: system architect and operator. Status: real self-hosted system; a full restore was tested in 1 hour 45 minutes and 96GB of backup storage cost $2.82 per month at the recorded point in time. The problem was operating multiple services on one 8GB Raspberry Pi behind CGNAT while keeping administration private and recovery practical. The important decisions were Docker Compose instead of Kubernetes, Cloudflare Tunnel and Caddy for public traffic, Tailscale for administration, explicit memory budgets, and encrypted `rclone` backups to Backblaze B2. The result is evidence of architecture, operations, and disaster-recovery discipline rather than a client delivery. Graphic brief: simplify the report's public/private traffic diagram and pair it with a restore path and two measured proof labels: “1h45 restore test” and “$2.82/month at 96GB.” Suggested alt text: “A Raspberry Pi service stack separates public and private access and restores from encrypted offsite backups.”

**Wildfire PySpark — Academic machine-learning study.** Summary: Tested a distributed Spark ML pipeline on 1.88 million United States wildfire records. Role: individual university-project author responsible for preprocessing, feature engineering, distributed training, and evaluation. Status: academic work; class weighting raised the rarest class's recall from 0 to 0.7518 while overall accuracy fell to 32% and rarest-class precision fell to 0.0099. The problem was predicting final wildfire-size classes from information available at discovery under extreme class imbalance. The strongest decisions were removing leakage fields, engineering temporal and spatial features, comparing multiple Spark ML models, and evaluating scaling, PCA, and weighting as explicit trade-offs. The honest result is not a useful production predictor: it demonstrates that improving rare-event recall can produce unacceptable false positives, alongside measured efficiency gains such as reducing one GBT run from 154.69 seconds to 47.09 seconds with near-equivalent reported accuracy. Graphic brief: combine the report's five-stage Spark pipeline with a before/after rare-class recall plot and an adjacent precision warning, clearly labeled “academic study.” Suggested alt text: “A Spark feature pipeline feeds model experiments where rare-fire recall improves at the cost of precision and overall accuracy.”

The first-release artifact policy follows from these briefs. BrontëHF, You Inc, and GPUShare are leads. HealthAgent, Home Lab, and Wildfire are support. GPUShare's original overview post should redirect to the primary GPUShare story once that replacement exists because it repeats the same narrative; the setup and architecture update remains an independently useful supporting article. HealthAgent's technical post remains supporting material. Otto remains resolvable but unlisted and `noindex` until finished. Bedroom Layout Designer, DropETA, Wiki Router, Piano Improvisation Helper, and the NoSQL survey have no honest replacement destination and should return `410 Gone` after their CMS documents are unpublished. No archived item should be redirected to an unrelated stronger project.

Use a dedicated `workStory` document for the six public stories. It should own status, order, service alignment, glance copy, role, timeframe, interventions, result or learning, graphic specification, primary artifact, and ordered supporting artifacts while leaving artifact-specific project, post, and report content in its existing type. Six curated grouping documents are enough to justify the model because two public stories span several artifacts, two are report-led, and You Inc currently has no artifact. This is narrower and less duplicative than adding the same portfolio fields independently to three artifact schemas.

The real-media inventory is sufficient to begin compositions after approval. BrontëHF has a public 1440px homepage capture and a Tei detail capture showing title, narrative, role, year, duration, collaborators, and real project photography; use the title-and-image region rather than a crop that truncates collaborators. You Inc has its public ledger hero and a settled sample dashboard explicitly labeled `SAMPLE COMPANY DATA`; the strongest fragments are the ledger status row, net-worth chart, action center, and control-brief metrics. GPUShare has a 3644×2194 repository screenshot showing the hybrid local/cloud model picker and chat UI. HealthAgent has a 2446×1394 repository screenshot showing its demo Status view, energy-balance signal, projection, and processed-ingest count. Home Lab's PDF provides the system architecture diagram, ADR summary, and tested recovery evidence. Wildfire's PDF provides the Spark experiment flowchart, PCA timing table, and baseline-versus-weighted per-class metrics. Preserve the original files or public URLs as source references; do not enlarge, fabricate, or silently alter their data.

The CMS may be changed substantially to support the approved editorial model. Before mutation, export the production dataset and record the backup path. Then add structured case-study fields to the canonical project documents or introduce a `workStory` document if the approved lead set contains non-project primary stories. The fields must cover status, service alignment, glance title and summary, problem, role, timeframe, interventions, result or learning, graphic specification and assets, primary artifact, and ordered supporting artifacts. Choose between extending `project` and adding `workStory` only after the shortlist is known; do not create a universal schema for hypothetical content.

The user has approved destructive CMS work, but destructive does not mean irreversible. Once the export exists and migrated content has been previewed, duplicate or obsolete documents may be unpublished or deleted and weak content may be rewritten in place. Keep old public routes as redirects when a migrated story has a clear successor; use `410 Gone` only for content intentionally removed with no replacement. Supporting artifacts remain indexable only when they add independent value, stay linked from their primary story, and do not repeat the same narrative.

Aim for two or three lead stories and no more than roughly six lead-plus-support stories. This is a maximum, not a target. A small excellent portfolio is better than filling visual slots with work Hamish does not want to discuss.

## Work Index and Detail Experience

Create a shared work-story view model in `src/lib` from the approved Sanity model. It needs a stable key, explicit title, glance summary, status, service alignment, date, destination URL, image or graphic data, case snapshot, and ordered supporting artifacts. Keep artifact-specific rendering at the page boundary instead of leaking project, post, and report field differences into cards.

Own story order explicitly in Sanity or in one small ordered configuration if editorial ordering does not justify a schema field. A project story may continue to link to `/projects/<slug>`; supporting posts appear within that project story rather than replacing its destination. If the approved content model introduces `/work/<slug>`, provide explicit redirects from every superseded primary route and preserve canonical consistency.

The `/work` page should lead with a brief statement and then show lead stories followed by support stories in a compact editorial list. Because the deliberately reduced collection is small, do not add search, tag clouds, or complex filtering in the first release. Every story has a persistent type or service label plus appropriate metadata, so visitors can distinguish evidence without relying on media or color. Add filters only if testing the complete list demonstrates a real scanning problem.

Detail pages should share one stable article shell: back link, content kind, case snapshot, optional media, primary content, supporting material, and contextual contact action. Preserve the specialized body behavior for posts and PDF reports. Remove decorative parallax circles and make all content visible before JavaScript runs.

Every work detail begins with a **Case Snapshot** designed to supply the 80 percent. In the initial unzoomed desktop viewport it should show the explicit title, one-sentence problem, Hamish's role and timeframe, up to three short intervention statements, an honest result or learning, and one labeled editorial graphic. On mobile, preserve that semantic order and all facts even when the graphic moves below the text; do not hide information to force a one-screen composition.

The scrolled narrative supplies the remaining 20 percent in a consistent order: Context, Constraint, Decisions, Execution, Evidence, Reflection, and Technical depth where relevant. Each section begins with its conclusion and uses a literal heading that says what was built, decided, or learned. Technical write-ups may remain dense, but must begin with a plain-language summary and use diagrams, captions, code labels, and short paragraphs to support scanning. Do not hide substantive content in accordions, carousels, tabs, hover states, or modal dialogs.

## Project Graphic System

Each lead story requires one original, reusable graphic family rather than a decorative cover image. Build these graphics from evidence: cropped interface components, simplified architecture paths, real output, a meaningful number when one exists, and two-to-four-word labels. Simple stylized human figures may establish who uses a product or show a genuine workflow, echoing the case-study approach the user likes, but they must read as editorial illustration rather than a real customer or testimonial. A graphic must communicate at least one concrete project concept without its surrounding paragraph. Do not invent UI, metrics, clients, or outcomes.

Use a repeatable frame so a non-designer can create coherent assets: the site's dark base, one controlled project accent selected from an accessible palette, a simple grid, one dominant artifact or diagram, no more than three supporting fragments, and concise editorial annotations. The site's vermilion signal remains reserved for global interaction; project accents are identifiers inside media and must not redefine button meaning. Avoid stock photography, generic device-on-gradient mockups, random 3D objects, and decorative people who do not explain a real audience or interaction.

Prefer responsive HTML, CSS, and SVG for system diagrams and component compositions because they remain sharp and editable. Use exported PNG, WebP, or AVIF only for real screenshots, photographic material, or graphics that cannot be represented robustly in markup. Every graphic needs a CMS art-direction brief, alt text or an adjacent equivalent explanation, source-asset references, focal behavior, and a static reduced-motion state. Create desktop, tablet, and mobile crops as part of the same composition instead of allowing arbitrary `object-fit` clipping.

## Design System

Replace the current broad token inventory with a small semantic system used by actual components. Keep tokens in `src/design-system/tokens.css`. Add the new semantic variables and temporary compatibility aliases first. Remove an old alias or legacy tile token only after a final consumer search proves that no retained route uses it and browser QA covers `/reading`, tags, CV, 404, and the legacy indexes.

### Color

The first redesigned release uses one intentional dark theme and one restrained vermilion accent. A later light theme is an optional enhancement that requires its own complete token, contrast, persistence, and no-flash QA. The implemented first-release values are:

- Canvas: near-black with a subtle green-neutral bias, `#0b0d0c`.
- Raised surface: `#121614`; inset surface: `#070908`.
- Primary text: soft off-white, `#f2f5ef`; secondary text: `#aab3ac`.
- Subtle rule: `#2b332e`; strong rule and control boundary: `#69736b`.
- Signal vermilion: `#e96b50`; signal ink: `#100b09`.

Measured contrast is 17.72:1 for primary text on canvas, 9.05:1 for secondary text, 6.21:1 for signal vermilion on canvas, 6.22:1 for signal ink on the action fill, and 3.96:1 for strong rules. Do not invert individual sections into a different theme.

### Typography

Keep Syne as the display face and Figtree as the body face for the first implementation. They already express the intended youthful, geometric character. Rename the misleading `--font-serif` token to `--font-display`; Syne is not a serif. JetBrains Mono remains limited to code and genuine technical metadata.

Use a short fluid scale rather than page-local arbitrary clamps. The hero may reach roughly 8rem on wide displays only when the final headline remains within two lines. Section headings should stay materially smaller. Body text is 1rem to 1.125rem with a 1.55 to 1.7 line height and a measure between 45 and 75 characters. Avoid forced line breaks except where tested as part of the desktop composition, and remove them on small screens.

Font loading must not control layout or animation coordinates. Self-hosting the two fonts is desirable for stability and privacy, but adding font files or dependencies requires a separate review of licensing and repository policy. It is not required to begin the structural rebuild.

### Layout and Spacing

Use a 12-column desktop grid, a 6-column tablet grid, and one deliberate content column on mobile. Use a fluid page gutter from 20px to 64px and a fluid grid gap from 12px to 24px. Cap the primary canvas at 1440px, with a 68-character reading measure inside it.

Use an 8px spacing rhythm with 4px permitted for optical corrections. Components may be asymmetric on screens at least 768px wide. Below 768px every section must declare a deliberate single-column order, spacing, and media treatment.

Do not use `overflow-x: clip` as a global way to hide layout defects. Do not use fixed aspect ratios on text containers. Use `min-height: 100dvh` only where a true full-height composition is intentional, and ensure the hero's content and actions fit without requiring scroll.

Use a sharp editorial shape rule: primary media and controls use 2px corners, with 4px reserved only where a larger retained component needs it. Do not use full pills, neumorphic shadows, glass panels, or generic floating cards. Prefer spacing, contrast, and a single 1px rule to communicate hierarchy.

### Shared Components

Keep shared components few and concrete. Build or refactor these components as the repeated system emerges:

- `Header.astro`: stable navigation, normal-flow logo, mobile menu, and booking action.
- `Logo.astro`: the existing mark with one entry behavior and one hover or focus behavior.
- `ButtonLink.astro`: primary, secondary, and text-link variants with consistent focus and active states.
- `WorkCard.astro`: shared normalized work item rendering with featured and row variants.
- `MediaFrame.astro`: responsive image presentation with explicit dimensions and alt-text behavior.
- `ArticleShell.astro`: shared detail-page title, metadata, body width, and next action.
- `ContactBand.astro`: the repeated booking and email conversion block.
- `Footer.astro`: concise secondary navigation, contact, social links, and CV.

Do not extract a component merely because a block exists once. Homepage offer and proof sections can remain local until a second consumer demonstrates a shared responsibility. Prefer Astro components and server-rendered HTML. Use React only for an interaction that genuinely needs client state.

## Motion Philosophy

Motion has four permitted jobs: establish identity, reveal hierarchy, acknowledge interaction, and explain a state change. Every animation must identify one of those jobs in a code comment or component description.

Native document scrolling is non-negotiable. Remove Lenis initialization and all related CSS. Remove the custom cursor. Remove scroll-linked logo scaling, decorative parallax, forced scroll smoothing, and any wheel or touch interception. Remove the loading bar and ClientRouter during the stabilization milestone; plain Astro navigation is preferable to lifecycle bugs. A later enhancement may reintroduce a small native view transition only after the rebuilt pages are stable.

The logo may animate once on initial page load using only transform and opacity for about 450 to 600ms. Hover and keyboard focus may produce a brief, controlled split-color or offset response for about 180 to 240ms. Do not use a glitch loop, forced reflow, or measured scroll position.

Section entrances may use a small opacity and vertical transform over 300 to 450ms. Base CSS must author content at `opacity: 1`, `transform: none`, and visible. Only after JavaScript initializes successfully may a scoped class such as `.motion-ready` opt eligible elements into an entrance state. Failed scripts, crawlers, print output, keyboard focus, full-page screenshots, and reduced-motion users must never receive invisible content. No more than one animated composition should compete for attention in a viewport.

All motion must become static under `prefers-reduced-motion: reduce`. Animate transform and opacity only. Do not animate layout properties, width-based progress bars on every scroll frame, or permanent requestAnimationFrame loops.

## Performance, Accessibility, and Content Requirements

Meet WCAG 2.2 AA contrast: 4.5:1 for normal text and 3:1 for large text, focus indicators, and meaningful UI boundaries. Every interactive element needs a visible focus state and a logical keyboard order. Mobile touch targets are at least 44 by 44 CSS pixels. Navigation, booking, email, work summaries, and outcomes cannot depend on hover, color, or motion alone.

Use semantic landmarks and one page-level `h1`. Keep headings in order. Images that communicate work need useful alt text; decorative imagery uses empty alt text or CSS. Reserve image dimensions to avoid layout shift, use Sanity's image pipeline for responsive sizes, and lazy-load below-fold media. The headshot and any above-fold media receive explicit dimensions.

Target mobile LCP below 2.5 seconds, CLS below 0.1, and INP below 200ms. The rebuilt shell should ship no permanent animation loop and no smooth-scroll library at runtime. Avoid adding new dependencies. Removing Lenis from `package.json` requires user approval under the repository's dependency-change rule, so first remove runtime usage and verify that it is unused; request approval before changing the dependency. Motion remains in use by retained interactive components and is not part of this dependency-removal decision.

Review every visible sentence before launch. Keep claims concrete and in Hamish's natural voice. Do not use generic consultancy phrases such as “elevate,” “unlock,” “seamless solutions,” or “digital experiences that matter.” Do not invent quantified outcomes. The final site should explain what was made, why it mattered, and what Hamish personally contributed.

## Progress

- [x] (2026-07-22) Audited the repository architecture, current design system, navigation, Sanity models, crawl endpoints, contact flow, and motion implementation.
- [x] (2026-07-22) Rendered the current homepage at 375px, 768px, 1440px, and 1920px widths and recorded layout failures.
- [x] (2026-07-22) Defined the product strategy, visible information architecture, design philosophy, component boundaries, motion rules, and migration approach in this ExecPlan.
- [x] (2026-07-22) Stress-tested the draft plan with design-domain and architecture reviews, then resolved release-policy, sequencing, theme, curation, and scroll-behavior ambiguities.
- [x] (2026-07-22) Inventoried all current Sanity projects, posts, and reports; identified definite GPUShare and Health Agent multi-artifact stories and content-readiness gaps.
- [x] (2026-07-22) Adopted the user's 80/20 glance principle, coherent case-study narratives, custom evidence-led project graphics, and permission for export-first destructive CMS cleanup.
- [x] (2026-07-22) Selected BrontëHF, You Inc, and GPUShare as the provisional first-release leads; made Health Agent support; kept Otto and the upcoming sprint coaching site unlisted until complete; archived DropETA, Wiki Router, the NoSQL survey, and Piano Improvisation Helper.
- [x] (2026-07-22) Excluded NDA-covered Alphero client work and removed any requirement for public demos or ongoing side-project hosting.
- [x] (2026-07-22) Approved the first-release classification, including archiving Bedroom Layout Designer and the remaining demo-scale work.
- [x] (2026-07-22) Approved all six public editorial briefs, Case Snapshots, responsive graphic directions, story ordering, booking URL, and contact email.
- [x] (2026-07-22) Replaced the draft homepage claim with the concrete “I make complicated software useful” offer and three approved service areas.
- [x] (2026-07-22) Completed Milestone 1: restored native scrolling and navigation; fixed the dark theme; removed active cursor, loading, progress, scroll-linked logo, parallax, and hidden-content systems; verified desktop, mobile, and no-JavaScript behavior.
- [x] (2026-07-22) Removed the approved dead cursor, theme-picker, accent-picker, and light-theme files and removed Lenis from the dependency manifest and lockfile.
- [x] (2026-07-22) Completed Milestone 2: established the fixed dark semantic system, fluid type and layout roles, restrained interaction motion, shared ButtonLink and MediaFrame primitives, and responsive no-JavaScript header and concise footer.
- [x] (2026-07-22) Exported and verified the production Sanity dataset before Milestone 3 content changes; recorded its checksum and exact replacement-import command.
- [x] (2026-07-22) Completed Milestone 3: imported the six approved work stories and You Inc artifact, then deleted the five approved archive documents after redirects and `410` behavior were verified.
- [x] (2026-07-22) Completed Milestone 4: added mirrored `workStory` schemas, normalized validated queries, shared Work cards and evidence graphics, `/work`, stable Case Snapshot pages, redirect policy, and source-material links.
- [x] (2026-07-22) Completed Milestone 5: replaced the inventory homepage with a conversion-led, native-scroll homepage using the approved lead stories and service offer.
- [x] (2026-07-22) Completed Milestone 6: rebuilt About around current context, concrete capabilities, research background, and one conversion path; reduced the footer to secondary navigation and contact metadata.
- [x] (2026-07-22) Completed Milestone 7: aligned metadata, structured data, sitemap, RSS, LLM guidance, source-page back links, legacy routes, and Umami events with Work and Book-a-call behavior.
- [ ] Complete Milestone 8. Automated responsive, no-JavaScript, route, reduced-motion, 200%-zoom, coarse-pointer, content, and performance QA passes; remaining acceptance item is the five-person comprehension test.

## Surprises & Discoveries

- Observation: The current hero is taller than the viewport at every audited size except the smallest mobile capture, so the principal action is not reliably above the fold.
  Evidence: At 1440 by 900 the hero measured 1,640px tall and its primary CTA began at about 1,671px. At 768 by 1024 the hero measured about 1,260px tall and the CTA began around 1,291px.

- Observation: The visual emptiness in full-page capture is caused by content being hidden until IntersectionObserver callbacks run, not by missing Sanity data.
  Evidence: `src/pages/index.astro` initializes every `[data-reveal]` block at `opacity: 0`. A full-page Playwright capture showed the hero, long black gaps, separators, and footer while the project and writing content remained invisible.

- Observation: Several long-lived animation and event systems are reinitialized on Astro page transitions.
  Evidence: `src/components/layout/Layout.astro` starts Lenis and a permanent requestAnimationFrame loop on `astro:page-load`; `src/components/ui/CustomCursor.astro` starts another permanent loop and document listeners; `src/components/ui/Logo.astro` adds new hover and accent listeners; `src/components/features/ParallaxHero.astro` adds an uncancelled scroll listener.

- Observation: The signature logo behavior depends on unstable geometry rather than a stable composition.
  Evidence: `src/components/layout/Header.astro` measures an invisible 180px homepage reference, applies a hard-coded 5x scale to a sticky 36px logo, remeasures after font loading and viewport changes, and contains a fallback for bad geometry during view transitions.

- Observation: The CMS already contains the fields needed for an image-led work presentation.
  Evidence: Both project and post schemas include `coverImage`; project documents also include body content, technologies, live URL, GitHub URL, and an optional related post. A unified index can be created without changing or merging document types.

- Observation: Fourteen CMS artifacts represent fewer than fourteen meaningful bodies of work.
  Evidence: GPUShare is one project plus two posts, and Health Agent is one project plus one post. Publishing each artifact as a peer produces five cards for two underlying projects.

- Observation: Content readiness varies sharply even among currently featured projects.
  Evidence: GPUShare has a body, cover, live product, repository, and two posts. Otto has a cover but no body. Health Agent has no project body or cover but has a supporting post. Wiki Router and Piano Improvisation Helper have neither body nor cover. All three reports are PDF-only.

- Observation: You Inc is stronger portfolio evidence than several existing Sanity projects but is absent from the CMS inventory.
  Evidence: The public production site exposes real onboarding, a double-entry ledger proposition, bank-sync and security explanations, dashboard concepts, pricing, and a sample-data demo. Its three concierge commission examples are explicitly labeled illustrative and must not be presented as completed client work.

- Observation: BrontëHF is public, finished client work with visible authorship evidence.
  Evidence: The live portfolio has complete Home, Projects, About, and Contact navigation, published project content, a CV, responsive editorial presentation, and a public “Site by Hamish Burke” credit.

- Observation: The layout referenced a favicon file that does not exist.
  Evidence: The Milestone 1 browser audit found a repeatable 404 for `/favicon.ico`; the valid SVG icon already exists, so the stale ICO link was removed.

- Observation: The repository has an untracked `freelance_pricing_guide.pdf` unrelated to this planning work.
  Evidence: `git status --short` reported it before any plan edits. Do not modify, delete, or commit it unless the user requests that separately.

- Observation: The previous design foundation defined light semantic defaults, dark overrides, inline critical overrides, and a second Tailwind base layer for the same roles.
  Evidence: Before Milestone 2, `tokens.css`, `.dark`, `Layout.astro`, `base.css`, and `globals.css` each supplied overlapping background, text, heading, focus, or motion values. The rebuilt system keeps canonical brand primitives in `tokens.css`, dark semantic roles and compatibility aliases in `themes/dark.css`, and removes the duplicate inline variables.

- Observation: A native HTML disclosure is sufficient for the mobile navigation and improves failure behavior.
  Evidence: Replacing the menu script with `<details>` and `<summary>` preserved the 44px target, active-link styling, and responsive panel. Playwright confirmed that all three links can be opened at 375px with JavaScript disabled.

- Observation: The production dataset's existing project documents cannot carry the approved narratives without either duplication or special cases.
  Evidence: GPUShare's project body contains only “Read my post about it,” HealthAgent has no project body, two support stories are report-led, and You Inc has no Sanity artifact. A grouping document can own one coherent narrative while retaining specialized posts, projects, and PDFs as evidence.

- Observation: Every approved story now has real graphic evidence; no placeholder illustration is required.
  Evidence: Public captures exist for BrontëHF and You Inc, repository screenshots exist for GPUShare and HealthAgent, and both approved report stories contain usable architecture, pipeline, timing, recovery, and evaluation figures.

- Observation: Sanity's authenticated document creation command worked without a separate import token, while dataset import and Studio document validation did not.
  Evidence: `sanity documents create` upserted six `workStory` documents and `project-you-inc`; root `sanity schema validate` passed, while the nested Studio environment could not resolve its declared `styled-components` and `@sanity/vision` dependencies.

- Observation: The first Work-page visual audit exposed two false “evidence” panels and a duplicated conversion band.
  Evidence: Remote GPUShare and HealthAgent captures rendered as unreadable dark panels at portfolio scale, and the shared contact band repeated the old footer CTA. GPUShare now uses a legible trust-boundary composition, HealthAgent uses the existing local screenshot, and the footer is concise metadata only.

- Observation: The approved archive can be made deliberate without maintaining weak CMS documents.
  Evidence: Successor routes return permanent redirects, four archived project routes and the NoSQL route return `410 Gone`, Otto returns `X-Robots-Tag: noindex, nofollow`, and the production backup predates all deletions.

- Observation: The public CV page and PDF had diverged from current reality.
  Evidence: The PDF still describes an MSc expected in February 2026 and does not contain the current Alphero role. The rebuilt `/cv` presents current verified context and labels the downloadable PDF as an earlier academic snapshot rather than silently presenting it as current.

- Observation: The retained Writing and Reading headings were absent from server-rendered HTML.
  Evidence: Both routes wrapped their only `h1` in a client-hydrated Motion component. Replacing that wrapper with semantic static headers restored one visible `h1` with and without JavaScript and removed the final consumers of `FadeIn`.

## Decision Log

- Decision: Keep Astro, Sanity, and Netlify, but allow the Sanity schemas and production content to change after an export.
  Rationale: The platform foundations are sound, but the storage model should serve coherent work stories rather than constrain them. The user explicitly approved rewriting, consolidating, archiving, and deleting CMS content where useful.
  Date/Author: 2026-07-22 / Amp

- Decision: Treat the work as a ground-up presentation rebuild rather than incremental styling of the current homepage.
  Rationale: The hero, logo, scrolling, reveals, cursor, and navigation are coupled. Fixing each symptom would preserve the system that creates the glitches.
  Date/Author: 2026-07-22 / Amp

- Decision: Present coherent work stories at `/work` and choose the smallest Sanity model that supports the approved shortlist.
  Rationale: Visitors need evidence of one practice, not knowledge of CMS types. Existing detail routes are preserved or redirected intentionally after the canonical story model and content are approved.
  Date/Author: 2026-07-22 / Amp

- Decision: Use `/`, `/work`, and `/about` as the only visible internal primary routes, with Cal.com as the primary action.
  Rationale: This is the smallest information architecture that supports understanding, evidence, trust, and conversion. A separate contact page or form adds no current value.
  Date/Author: 2026-07-22 / Amp

- Decision: Preserve the HB logo and Syne-led typography as the primary brand signatures.
  Rationale: They already deliver the bold, youthful character the user likes. Their current implementation, not their identity, is the problem.
  Date/Author: 2026-07-22 / Amp

- Decision: Remove smooth scrolling, custom cursor behavior, scroll-linked logo geometry, decorative parallax, loading-bar choreography, and SPA-like routing in the stabilization phase.
  Rationale: Native scrolling and normal page navigation establish a reliable baseline. Expressive motion can then be added locally without permanent loops or lifecycle coupling.
  Date/Author: 2026-07-22 / Amp

- Decision: Give every lead story a custom editorial graphic system built from real project evidence.
  Rationale: Visual storytelling improves glance comprehension and memorability, while real screens, system paths, outputs, and labels preserve credibility. Do not use stock imagery, imaginary interfaces, fake people, or invented metrics.
  Date/Author: 2026-07-22 / Amp

- Decision: Ship one intentional dark theme in the first redesigned release and remove theme and accent customization controls.
  Rationale: One fully tested brand presentation is simpler and more reliable than retaining two customization systems during a ground-up rebuild. A light theme can be added later as a complete feature.
  Date/Author: 2026-07-22 / Amp

- Decision: Redirect `/projects` to `/work` in the redesigned release; keep `/writing` and `/tools` available as secondary legacy destinations until their content is separately reviewed.
  Rationale: `/work` fully replaces the project inventory and every project detail now has an explicit successor, `410`, or unlisted policy. Technical writing still adds independent source value and should not be collapsed blindly.
  Date/Author: 2026-07-22 / Amp

- Decision: Make coherent work stories, not CMS documents, the public unit of the portfolio.
  Rationale: Visitors need one strong account of an underlying problem and solution. Project pages, articles, updates, demos, repositories, and reports are supporting evidence, not separate reasons to repeat the same work in an index.
  Date/Author: 2026-07-22 / Amp

- Decision: Use an export-first CMS migration, then permit destructive cleanup after preview and approval.
  Rationale: Keeping obsolete or duplicate public content forever undermines the intentionally small portfolio. A recorded production export and explicit redirect or `410` map make consolidation recoverable and protect useful inbound routes.
  Date/Author: 2026-07-22 / Amp

- Decision: Apply an 80/20 glance principle to the homepage and every case study.
  Rationale: Low-attention visitors should understand the offer or project without committing to a long read. The initial viewport carries the decision-critical title, problem, role, intervention, result, visual proof, and next action; scrolling provides supporting narrative and technical depth.
  Date/Author: 2026-07-22 / Amp

- Decision: Use BrontëHF, You Inc, and GPUShare as the provisional first-release lead stories; use Health Agent, Home Lab Architectural Study, and Wildfire Analysis as support.
  Rationale: The leads show finished client delivery, a real production product, and substantial systems implementation. GPUShare proves capability without requiring a maintained public demo. The support set adds application data pipelines, solution architecture, and large-scale data/AI evidence without competing for homepage prominence.
  Date/Author: 2026-07-22 / Hamish and Amp

- Decision: Archive Bedroom Layout Designer, DropETA, Wiki Router, the NoSQL survey, and Piano Improvisation Helper; keep Otto unlisted until complete.
  Rationale: Hamish identified these as unfinished demo-scale, vibe-coded, or generic university work he does not want representing him. Otto has a compelling premise but incomplete behavior, so publishing it would conflict with the portfolio's finished-work standard.
  Date/Author: 2026-07-22 / Hamish

- Decision: Exclude Alphero client work unless explicit publication permission is obtained.
  Rationale: Hamish's professional client work is NDA-covered. Alphero case studies are an art-direction reference, not an implied source of portfolio content.
  Date/Author: 2026-07-22 / Hamish

- Decision: Treat the sprint coaching website as a future lead candidate, not a launch dependency.
  Rationale: It is genuine commissioned work and should be documented now, but it must be complete, in production, and cleared by the client before appearing publicly.
  Date/Author: 2026-07-22 / Hamish and Amp

- Decision: Use near-black `#0b0d0c`, off-white `#f2f5ef`, muted `#aab3ac`, and restrained vermilion `#e96b50` as the fixed release palette, with square 1px rules and 2px primary radii.
  Rationale: This keeps the site's bold editorial identity without the generic dark-tech signal of a neon accent. Measured contrast is 17.72:1 for primary text, 9.05:1 for muted text, 6.21:1 for vermilion on the canvas, 6.22:1 for dark ink on the action fill, and 3.96:1 for strong rules and control boundaries.
  Date/Author: 2026-07-22 / Amp

- Decision: Keep only the homepage viewport-led; use one compact hero spacing token for all other page headers.
  Rationale: The layout shell already provides 2-4rem of space below the sticky navigation. Stacking another 7-8rem of page-local top padding made every title feel detached and delayed the evidence below it. Shared zero-additional top spacing and a controlled bottom rhythm keep the large type bold without sacrificing the 80/20 glance principle.
  Date/Author: 2026-07-22 / Hamish and Amp

- Decision: Use native `<details>` for mobile primary navigation rather than a JavaScript-managed menu.
  Rationale: The native element provides keyboard, pointer, and no-JavaScript operation with less lifecycle code. The header remains sticky and solid but never hides in response to scrolling.
  Date/Author: 2026-07-22 / Amp

- Decision: Introduce six narrow `workStory` grouping documents rather than extending every artifact schema with portfolio fields.
  Rationale: Public stories, not CMS artifact types, own the glance narrative and ordering. This avoids duplicating case-study fields across projects, posts, and reports while preserving their specialized renderers and supporting material.
  Date/Author: 2026-07-22 / Amp

- Decision: Return `410 Gone` for archived artifacts with no honest successor; retain unfinished Otto as unlisted and `noindex`; redirect only duplicate narratives to their actual story hub.
  Rationale: Redirecting weak work to unrelated strong work would confuse visitors and search engines. A deliberate removal signal is more accurate, while Otto's future potential justifies preserving its URL without public discovery.
  Date/Author: 2026-07-22 / Amp

## Plan of Work

### Milestone 1: Establish a boring, reliable shell

First make the site structurally trustworthy before changing its visual language. In `src/components/layout/Layout.astro`, remove Lenis initialization and CSS, `CustomCursor`, the navigation loading bar, `ClientRouter`, theme and accent persistence, and the article progress bar. Retain metadata, structured data, analytics, skip link, header, footer, and the layout slot. Simplify analytics now that full page navigation resets the document, and preserve only events that support the new Work and booking journey.

In `src/components/layout/Header.astro`, replace the scroll-measured hero logo behavior with a normal-flow logo and a stable header. Keep a robust mobile menu using the existing AbortController pattern. In `src/components/ui/Logo.astro`, reduce animation to one progressive entry and one hover or focus response with reduced-motion support and cleanup. Remove `src/components/ui/CustomCursor.astro` only after confirming it has no other consumers. In `src/components/features/ParallaxHero.astro`, remove scroll parallax and make content visible without JavaScript; detail-page replacement may happen in Milestone 4.

At the end of this milestone, every existing page should remain usable, native wheel and touch scrolling should feel immediate, the default pointer should work, and navigation should not accumulate animation loops. Run the existing tests and build before proceeding.

### Milestone 2: Build the visual foundation without rebuilding pages yet

Add the new semantic color, typography, spacing, layout, shape, focus, and motion variables in `src/design-system/tokens.css`, `src/design-system/themes/dark.css`, `src/design-system/base.css`, and `src/styles/globals.css`. Preserve temporary aliases used by retained routes. Retire the light-theme stylesheet from the active shell without deleting it until consumer checks and user approval permit cleanup. Remove duplicate semantic values from the inline critical style in `Layout.astro` or generate that minimal critical block from the same agreed values so it cannot drift.

Rename heading semantics from serif to display as consumers are touched. Create `ButtonLink.astro`, `MediaFrame.astro`, and the stable `Header.astro` and `Footer.astro` styling. Build a temporary component specimen inside an existing development route or directly in the first homepage section rather than creating a permanent style-guide application.

Verify dark-theme contrast, button states, focus states, type wrapping, gutters, and mobile collapse before composing page redesigns. Check every retained route with the compatibility aliases before removing any old token. No new animation library or component framework should be added.

### Milestone 3: Curate the content before designing around it

Use the approved shortlist. Add You Inc as a new story source. Record the sprint coaching website as future work but do not publish it. Keep NDA-covered Alphero work out of the content system. Apply the archived and unlisted statuses already recorded in the Decision Log without spending time improving those stories.

For every lead or support story, write and approve the editorial brief, initial-viewport Case Snapshot, and responsive graphic brief before building its card or detail composition. Inventory real screenshots, interface components, diagrams, outputs, and source files that can support each graphic. For every improve story, name the smallest missing work that could promote it: body copy, screenshots, contribution clarity, result, working demo, or technical evidence. For every archive story, record the reason and whether its current URL should redirect, return `410`, or remain as an unlisted historical page.

Export the production Sanity dataset before editing it and record the exact restore command. Decide whether the approved shortlist is best served by extending `project` or introducing `workStory`, then update both mirrored schema directories if needed. Revise selected source content in Sanity rather than papering over weak content with page-level copy. Merge duplicate narratives by making one primary artifact the hub and editing supporting artifacts so they complement rather than repeat it. GPUShare's primary story should summarize the complete project and use its posts only where they add distinct technical depth or development history. Apply the same treatment to Health Agent. Preview and approve replacements before unpublishing or deleting obsolete documents.

At the end of the milestone, the Decision Log names the exact lead, support, improve, and archive stories; every public story has approved long-form copy, Case Snapshot, and graphic brief; every retained artifact belongs to at most one story; the production dataset export is restorable; and no unresolved content is required to compose `/work`.

### Milestone 4: Build the shared body of work

Implement the approved Sanity schema and migration, keeping mirrored schema directories synchronized. Create the normalized work-story query and mapping in `src/lib` using the existing `fetchSanity` helper and image URL utilities. Define URL rules, status behavior, and story ordering approved in Milestone 3. Add focused tests for story completeness, one-primary-per-story, no cross-story duplicate assignments, Case Snapshot field limits, status behavior, ordering, and generated or redirected URLs.

Create `src/pages/work/index.astro` and `WorkCard.astro`, rendering one visually differentiated entry per lead or support story rather than one card per artifact. Build the lead-story graphics as reusable HTML/CSS/SVG compositions from the approved briefs and real project assets. Do not add filters until the reduced list demonstrates a real scanning problem. Refactor retained detail pages to use `ArticleShell.astro` and `CaseSnapshot.astro` while preserving specialized post and PDF behavior. Replace `ParallaxHero.astro` with the stable snapshot composition. Change public detail-page back links and breadcrumb destinations to `/work`; implement the approved redirect or `410` map while preserving PDF safety behavior and any retained interactive post components.

Add a Supporting material section to each multi-artifact primary page. Apply `noindex` to intentionally retained archive routes and omit them from internal navigation and crawl output. Keep only independently useful supporting artifacts indexable and link them from their story hub.

At the end of the milestone, `/work` shows only approved lead and support stories, exactly once each, with correct destinations and graphics. Every lead story communicates its title, problem, role, intervention, result or learning, and visual evidence in the initial desktop viewport; mobile preserves all content in the same priority order without clipping. Old routes follow the approved retained-page, redirect, or `410` policy.

### Milestone 5: Rebuild the homepage as the primary conversion journey

Before this milestone starts, record the approved hero and proof statements, three service descriptions, ordered lead stories, booking URL, and contact email in the Decision Log. Do not invent temporary marketing copy that could accidentally ship.

Replace the contents and page-local styles of `src/pages/index.astro`. Consume the shared work model rather than creating a second query. Include approved project graphics and implement the six sections described under Homepage Structure.

The hero's mark and type animation must be local, transform-and-opacity only, and static for reduced motion. All below-fold sections render visible HTML by default. If entrance reveals are added, centralize the progressive-enhancement behavior in one small helper or component with cleanup rather than duplicating scripts per section.

Use the approved project graphic compositions and `/public/images/headshot.jpg`. If a lead story lacks enough real evidence to make its graphic, return it to improve status rather than shipping a decorative placeholder or fabricated screenshot.

At the end of the milestone, a visitor at 360 by 800, 768 by 1024, 1440 by 900, and 1920 by 1080 should see the complete value proposition and both primary actions in the initial viewport, then reach work evidence and booking without entering a secondary route. At 200 percent zoom or on shorter viewports, content may grow vertically but must not clip, overlap, or require horizontal scrolling.

### Milestone 6: Rebuild trust and contact surfaces

Rewrite the composition of `src/pages/about.astro` around a concise professional story, real headshot, three service areas, working approach, booking action, email, CV, and a small personal section. Keep the current structured data accurate. Remove the long inline pricing accordion from the primary About flow unless the user explicitly confirms that public package pricing still supports the new positioning. The existing untracked pricing PDF is outside scope unless requested.

Simplify `Footer.astro` to the new visible routes, booking or email action, social links, CV, RSS, and copyright. Ensure the same action label is used in the header, homepage, About page, and final contact bands.

At the end of the milestone, the LinkedIn arrival journey can be completed in under five minutes: understand offer, inspect proof, learn about Hamish, and reach booking or email.

### Milestone 7: Migrate discoverability without losing existing value

Update `src/lib/site.ts`, `Layout.astro`, `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`, `src/pages/rss.xml.ts`, `src/pages/llms.txt.ts`, and any route-specific metadata so the consultancy positioning and `/work` are reflected consistently. Keep the PDF proxy protections unchanged.

Remove `/projects`, `/writing`, and `/tools` from primary and footer navigation. Redirect `/projects` and `/tools` to `/work` because their inventory/product-directory concepts have been explicitly replaced; retain `/writing` as a secondary 200 route for independently useful technical source material. Add `/work` and its six stories to the sitemap, omit redirecting and unlisted routes, and implement only the approved detail redirects. Update analytics from old Projects and Writing clicks to explicit `book-call` and `work-view` events.

At the end of the milestone, sitemap and canonical output advertise the intended architecture, old index links resolve safely, retained detail links remain stable, migrated detail links redirect correctly, and structured data contains no stale junior-blog positioning.

### Milestone 8: Verify the complete site, then add only justified polish

Run automated tests and build. Use Playwright against the local server at 360x800, 390x844, 768x1024, 1024x768, 1440x900, and 1920x1080. Check the homepage, Work index, About page, one post, one project, one report, CV, mobile menu, booking link, email link, fixed dark-theme rendering, and 404 page.

Test keyboard-only navigation, 200 percent browser zoom, reduced motion, coarse pointer emulation, forced slow network, and JavaScript disabled where practical. Include `/reading`, one tag route, CV, 404, and each legacy index under the first-release 200/self-canonical policy. Confirm no horizontal page overflow, no hidden content, no clipped controls, no duplicate event behavior after repeated navigation, and no console errors. Add a repository Playwright audit script before this milestone and name its exact command in `Concrete Steps`. Run Lighthouse or equivalent mobile performance checks and record actual LCP, CLS, and accessibility results in `Artifacts and Notes`.

Only after this baseline passes may small enhancements be considered, such as a native view transition or richer logo hover. Each enhancement must be removable without changing layout or access to information.

## Concrete Steps

Work from the repository root:

    /Users/hamish/Documents/Personal/astro-blog

Before each milestone, inspect the current worktree and do not alter unrelated user or agent changes:

    git status --short

Use the existing environment and commands:

    npm run test
    npm run build
    npm run dev

For focused browser verification, start the development server and run Playwright scripts against `http://localhost:4321`. The repository currently has Playwright as a dependency, but local browser installation may be absent. A system Chrome executable can be used for local audits without changing dependencies.

Milestone 8 must add `scripts/site-audit.mjs` and run it with the development server:

    npm run dev -- --host 127.0.0.1
    node scripts/site-audit.mjs

The audit script must fail with a nonzero status for horizontal overflow, hidden essential content, missing primary actions, console errors, wrong legacy-route status or canonical output, or incorrect normalized-work destinations at any required viewport. Keep screenshot output in a temporary or ignored directory rather than `dist`.

After each milestone, inspect the diff for accidental changes to Sanity schema mirrors, security-sensitive PDF code, generated `dist`, or the untracked pricing PDF:

    git diff --stat
    git diff -- src/pages/api/pdf.ts
    git status --short

When the approved content model requires a schema change, update both `src/sanity/schemaTypes` and `studio-production/schemaTypes` in Milestone 4 and run `npm run studio:build`. Do not mutate production content until the export and restore path have been verified.

## Validation and Acceptance

The redesign is accepted only when all of the following user-visible outcomes are true.

At unzoomed 360 by 800, 390 by 844, 768 by 1024, 1024 by 768, 1440 by 900, and 1920 by 1080 viewports, the homepage hero fits within the initial viewport, has no horizontal overflow or clipped text, and visibly contains a clear offer, **Book a call**, and **See my work**. Navigation fits on one desktop line and remains fully usable through the mobile menu. At 200 percent zoom and short viewports, natural vertical growth is acceptable, but content must not clip, overlap, disappear, or scroll horizontally.

Wheel, trackpad, touch, Page Up, Page Down, Home, End, spacebar, scrollbar dragging, anchor links, browser back, and browser find use native behavior. The site has no Lenis classes, custom cursor, wheel interception, scroll-linked logo transform, or permanent animation request loop.

With JavaScript disabled or an enhancement script forced to fail, all navigation, work summaries, article content, About content, booking links, and email links remain visible and usable. With reduced motion enabled, layout and content are unchanged while nonessential entrances and logo motion disappear.

`/work` contains every approved lead and support story exactly once and no improve or archive story. Each story routes to its approved canonical destination. Retained project, post, and report URLs render correctly; merged URLs redirect to the named successor; removed URLs follow the approved `410` policy.

In the redesigned release, `/work` and `/writing` return 200 while `/projects` and `/tools` permanently redirect to `/work` in one hop. `/work` appears in internal navigation and the sitemap; redirecting and unlisted routes do not. Approved detail redirects resolve in one hop. Retained detail-page back links and breadcrumbs lead to `/work`.

The homepage includes three clear service offers and at least three concrete trust signals drawn from real experience or work. Its initial viewport communicates the offer, intended audience, one proof cue, and the primary next action. Every lead work page's Case Snapshot communicates the explicit title, problem, Hamish's role, up to three interventions, honest result or learning, and visual evidence before long-form content begins. No fake client, testimonial, interface, person, image, or metric appears.

Run a five-second unscrolled comprehension test at 375px, 768px, and 1440px widths with at least five relevant reviewers in the first round. At least four of five should be able to state the offer, intended audience, one concrete proof point, and next action from the homepage; for each lead story, they should be able to state what was built, the problem, Hamish's role, and the result or learning. If the test fails, shorten copy or simplify hierarchy and graphics rather than adding explanatory motion or more sections.

All text and controls meet WCAG 2.2 AA contrast. Every control has a visible keyboard focus indicator. Touch targets are at least 44 by 44 CSS pixels. Heading order and landmarks are valid. Informative images have appropriate alt text and dimensions.

Run `npm run test` and expect the full test suite to pass. Run `npm run build` with the documented Sanity environment and expect `astro check` and the production build to succeed. Run browser verification with no uncaught page errors. Record Lighthouse evidence showing mobile LCP below 2.5 seconds, CLS below 0.1, INP below 200ms where measurable, and an accessibility score of at least 95.

## Idempotence and Recovery

The code migration was additive before destructive: `/work`, previews, and the shared presentation existed before old discovery paths changed. The CMS migration was export-first: verify a production export, create and preview replacement content, record redirects, then delete only explicitly approved archive documents. If a milestone fails, restore the named dataset export or revert only that milestone's files after confirming no concurrent user or agent changes are present; do not use broad worktree reset commands.

Removing client effects is safe to repeat because acceptance is based on the absence of their imports, styles, loops, and listeners. `/projects`, `/tools`, and approved detail redirects ship with their successors; `/writing` remains a secondary route. If a redirect causes an SEO or navigation regression, remove that one redirect while leaving `/work` functional.

Do not delete old components merely because the new pages stop importing them. First search for all consumers, run tests and build, then remove only confirmed dead files. File deletion and dependency removal require the approvals specified by repository guidance.

## Artifacts and Notes

The planning audit used local Playwright captures at four viewport widths. The most important baseline measurements were:

    375x812: hero 731px high; primary CTA bottom near 794px
    768x1024: hero 1260px high; primary CTA begins near 1291px
    1440x900: hero 1640px high; primary CTA begins near 1671px
    1920x1080: hero 1450px high; primary CTA begins near 1481px

The full-page desktop capture showed the hero and footer separated by large empty regions because unrevealed homepage content remained at zero opacity. Keep future before-and-after screenshots and Lighthouse output in this section or in a clearly named `docs` artifact if they become too large for the plan.

Milestone 1 verification completed on 2026-07-22. `npm run test` passed all eight tests. `npm run build` completed after final dead-code and dependency cleanup with no errors and one pre-existing unused-variable hint in `src/pages/posts/[slug].astro`. A temporary Playwright audit passed at 375x812 and 1440x900, including native scrolling, invariant logo geometry during scroll, mobile-menu state, no horizontal overflow, no hidden reveal content, no removed interaction UI, no console errors, a visible GPUShare detail page, and a JavaScript-disabled homepage. The temporary audit file was removed after use.

Milestone 2 verification completed on 2026-07-22. `npm run test` again passed all eight tests and `npm run build` completed with the same pre-existing unused-variable hint. Browser checks at 320x568, 375x812, and 1440x900 found no horizontal overflow or console errors, confirmed 44.9px button targets, a 2px signal-green focus outline with 4px offset, sticky header behavior, explicit 3264x4896 portrait dimensions, and a working native menu without JavaScript. Temporary scripts and screenshots were removed after review.

The production Sanity safety export is `.sanity-backups/production-2026-07-22.tar.gz`, intentionally ignored by Git. It contains 25 documents and 18 assets, is 3.7MB, and has SHA-256 `8927d024d2210551da94c20ab581c4bfaa414b63053765c2c7391f7f76aa35a9`. From `studio-production`, verify it with `shasum -a 256 ../.sanity-backups/production-2026-07-22.tar.gz` and restore document IDs and assets with `npx sanity dataset import ../.sanity-backups/production-2026-07-22.tar.gz production --replace`. The restore command is intentionally recorded but was not run against production because that would be a mutation rather than a backup verification.

The approved migration payload is `.sanity-backups/work-stories-approved-2026-07-22.ndjson`, also ignored by Git, with SHA-256 `73589e1dfacc1d1a2417275f13d55081bbde2e4378fff86d9b5d0c3fffafd40d`. The authenticated CLI upserted `workStory-brontehf`, `workStory-you-inc`, `workStory-gpu-share`, `workStory-health-agent`, `workStory-home-lab`, `workStory-wildfire`, and `project-you-inc`. After route behavior was verified, it deleted the approved archive IDs `e1779ff7-3ae6-487f-a49f-75c046ef4c93`, `d8d6f4c1-fc6c-435b-994c-239e49d42708`, `5d023ced-3323-46b3-ac0f-0764dc17030a`, `89daaa70-9d89-4386-952e-f285cfccb872`, and `4d13d18b-a7d9-4630-92fd-45884805bf23`. A production query confirmed the five documents are absent and all six stories still resolve their retained primary artifacts.

Milestones 3–5 verification completed on 2026-07-22. Thirteen tests pass; `astro check` reports no errors and only the pre-existing unused `postUpdatedLabel` hint; the Netlify server build completes. No-JavaScript Playwright checks at 320px and 1440px found no horizontal overflow or empty links on `/`, `/work`, or `/work/gpu-share`. The sitemap contains all six work stories and no legacy project or duplicate GPUShare overview URLs. Route checks confirmed permanent successors, intentional `410` responses, Otto's `noindex` response header, and retained technical-source pages.

Final automated release verification completed on 2026-07-22. All 13 tests pass; `astro check` reports no errors and the same pre-existing unused-variable hint; the Netlify server build completes; `git diff --check` passes; the mirrored `workStory` schemas match byte-for-byte; and the protected PDF proxy is unchanged. `scripts/site-audit.mjs` passes six viewport widths from 320px to 1920px and checks horizontal overflow, headings and accessible names, image failures, no-JavaScript core pages, hidden essential content, 200% zoom, reduced motion, coarse-pointer targets, all retained routes, permanent redirects, `410` responses, and Otto's `noindex`. The generated sitemap contains six canonical Work detail URLs and zero legacy Project URLs. Umami now records `book-call` and `work-view` events. Indicative local-development browser measurements at 390px were 624ms LCP and 0.03357 CLS; these are not production Lighthouse results. Lighthouse and axe were not installed, and dependencies were deliberately not added solely to manufacture those measurements. The outstanding manual acceptance activity is the five-person comprehension test described above.

## Interfaces and Dependencies

Continue using Astro 5, TypeScript, Tailwind CSS 4, Sanity, the existing `fetchSanity` helper, Sanity image URL utilities, and Netlify server output. Do not add a component system, animation framework, smooth-scroll library, or form service.

The normalized work story should have an interface equivalent to:

    type WorkKind = 'project' | 'post' | 'report';
    type WorkStatus = 'lead' | 'support' | 'improve' | 'archive';

    type ArtifactLink = {
      key: string;
      kind: WorkKind;
      title: string;
      href: string;
    };

    type CaseSnapshot = {
      problem: string;
      role: string;
      timeframe?: string;
      interventions: [string, ...string[]];
      result: string;
    };

    type WorkStory = {
      key: string;
      status: WorkStatus;
      title: string;
      summary: string;
      service: string;
      date: string;
      href: string;
      snapshot: CaseSnapshot;
      graphic: ProjectGraphic;
      primaryArtifact: ArtifactLink;
      supportingArtifacts: ArtifactLink[];
      order: number;
    };

`ProjectGraphic` should be a small discriminated union derived from the approved graphics, not an open-ended page-builder schema. It may reference real screenshots or Sanity images and select one of a few code-owned compositions. The exact image type should reuse the repository's existing image builder contracts. Runtime validation must enforce one to three interventions, required glance copy for lead and support stories, unique order and artifact assignments, and complete graphic alt text or adjacent explanations.

`WorkCard.astro` accepts one `WorkStory` and a variant of `featured` or `row`. It renders a real link, explicit title, summary, service, and project graphic without client JavaScript. `CaseSnapshot.astro` accepts one `WorkStory` and renders all decision-critical content in semantic document order. `ButtonLink.astro` accepts `href`, `variant`, and normal anchor attributes. `ContactBand.astro` accepts optional heading and body copy but always uses the canonical booking URL and contact email from `src/lib/site.ts` rather than duplicating them in pages.

Add a `BOOKING_URL` constant to `src/lib/site.ts` when implementation begins. Continue using `CONTACT_EMAIL`. Do not change `src/pages/api/pdf.ts` protections.

## Outcomes & Retrospective

Milestones 1–7 and automated Milestone 8 verification are complete. The released architecture is a native-scroll, no-JavaScript-required portfolio with a single dark editorial design system, a conversion-led homepage, unified Work index, six coherent evidence-led case studies, a current About page, simplified navigation, and one clear booking path. BrontëHF, You Inc, and GPUShare are the lead stories; Health Agent, Home Lab Architectural Study, and Wildfire Analysis are support. Weak demo-scale work is intentionally archived, useful technical sources remain secondary, and successor, `410`, and `noindex` behavior preserve an honest legacy contract. The production CMS has been backed up and migrated to the approved work-story model. Final tests, build, custom browser audit, route checks, sitemap checks, schema comparison, and diff checks pass. Only the external five-person comprehension test and production-host performance observation remain; they cannot be truthfully completed inside the local implementation pass.

Revision note, 2026-07-22: Replaced the previous incremental color and neumorphism plan with a self-contained ground-up rebuild plan after source and rendered-page audits showed structural layout, motion lifecycle, and information-architecture problems that token changes could not solve. Subsequent reviews fixed the release-route contract, moved curation ahead of composition, selected a single dark theme, introduced coherent work stories, adopted the 80/20 glance principle, added an evidence-led project graphic system, and changed the CMS policy from immutable to export-first consolidation with explicit redirects. Implementation notes now record completion and browser evidence for the stable shell and semantic visual foundation, including the decision to use native disclosure navigation.
