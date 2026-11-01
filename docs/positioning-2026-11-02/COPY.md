# Positioning copy, 2026-11-02

Draft only. Nothing here is written to Sanity yet. Every visitor-facing sentence lives in
Sanity, so the change is a set of document patches, not a repo edit.

Voice: `hamish-voice`, clean mode, reflective prose, short-form page copy.

## The diagnosis these edits answer

1. Every page says "web developer", which files him in the deepest pool on the market.
2. Nothing on the site says he is available or what he would move for.
3. The CV page opens with an apology and offers no forwardable document.
4. 47 work pages with no stated spine. The spine is real and is in the copy below: a system
   somebody else can reach, and what it does when a part of it fails.

## homePage

- `intro` (max 160)
  - was: `Web developer at Alphero, in Wellington. Most of what's here I built on my own
    time, to see how something worked.`
  - now: `Software engineer at Alphero, in Wellington. Most of what's here I built on my own
    time, then tried to break.`
- `seo.description`
  - now: `Hamish Burke is a software engineer in Wellington, New Zealand. He builds systems,
    then tests what happens when they fail.`

## aboutPage

- `heading` and `hero.heading` (max 80)
  - now: `Software engineer at Alphero, in Wellington.`
- `intro` (max 600)
  - now: `I'm Hamish. I build software, and most of what's on this site started with me
    wanting to find out how something worked, then building it on my own time. A lot of it
    comes back to the same two questions, who is allowed to reach a system, and what it does
    when part of it goes away.`
- `largeCopy` (single paragraph)
  - now: `I work at Alphero as a software engineer. The projects here are things I've built
    outside that job. They look scattered, though most of them come back to the same thing,
    a system somebody else can reach, and what it does when a part of it fails.`
- `seo.description`
  - now: `Hamish Burke is a software engineer at Alphero in Wellington, New Zealand, with a
    master's in computer science from Victoria University of Wellington.`
- `projects[0..1]`, `background`, `portraitAlt`: unchanged. The two project blurbs already
  carry the spine and the thesis line ("plenty of interesting results, though very few that
  were actually useful") is the best sentence on the site.

## cvPage

- `hero.intro` (max 400)
  - now: `I'm a software engineer at Alphero, and I take on a small number of independent
    projects alongside it.`
- `facts` role value
  - now: `Software Engineer · Alphero`
- `academic.body` (max 400) stops opening with the apology
  - now: `The thesis work is here as a PDF from before Alphero, so it still has the master's
    down as in progress. Ask and I'll send the current one.`
- `academic.downloadCta.label`: `Open the academic CV`
- `academic.requestCta.label`: `Email for the current CV`

Still needed for this page: a current one-page PDF. Blocked on Alphero scope facts.

## workIndexPage

- `hero.intro` (max 280)
  - now: `Mostly things I built to answer a question, plus a couple of client sites and one
    piece of research. If you want the thread, start with the home lab, GPUShare and the
    malware backdoor study, all asking who can reach a system and what happens when it fails.`

## contactPage

- `availabilityNote` (max 300). **Chosen 2026-11-02: C.** B and A kept here for the record.

  - A, current, closed:
    `I work full time at Alphero and take on a small number of independent projects alongside
    it. If you have something that fits, say what the problem is and I'll tell you whether
    I'm the right person for it.`
  - B, open door, low signal:
    `I'm at Alphero full time and not looking to move. I'll still read a note that names a
    specific problem and says who else is on it, and I'll tell you plainly if it isn't for
    me.`
  - C, open, recommended:
    `I'm at Alphero and happy there. I'd still make time for a team working on machine
    learning infrastructure or reliability, remote from Wellington, if the problem is
    specific enough to describe in a paragraph. If that's you, email me the paragraph.`

- `channels[0]` email: still `hamishapps@gmail.com`. The apex MX points at Mailgun and delivers
  nothing: a test message sent 2026-11-02 was accepted and never arrived, with no bounce. Until
  Cloudflare Email Routing is on (queued), `hamish@hamishburke.dev` stays off the site.
- `channels[1..3]`, hero and SEO: unchanged.

## Not doing in this pass

- A new spine page. The work index intro carries it for now; a dedicated page is a schema
  plus a route plus a template, which is an ExecPlan, not a copy edit.
- Project dates and outcomes. Worth adding one number to each story, one at a time.
