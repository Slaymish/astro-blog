# Post-launch todo

The redesign implementation is complete. These items need real production data, external reviewers, or updated source material.

- [ ] After the Netlify deploy completes, smoke-test `/`, `/work`, `/about`, `/cv`, booking links, redirects, intentional `410` routes, and Umami events on `https://hamishburke.dev`.
- [ ] Run production mobile Lighthouse checks for LCP, CLS, INP, and accessibility. Local browser checks passed, but local development measurements are not production evidence.
- [ ] Run the five-person, five-second comprehension test described in `REDESIGN-PLAN.md`; revise only if fewer than four people can identify the offer, proof, and next action.
- [ ] Replace the historical academic `public/cv.pdf` with a current CV once the final employment dates and wording are confirmed.
- [ ] Add the sprint coaching website as a lead case study only after it is live and the client has approved public use of the work and imagery.
- [ ] Review/revise ALL copy in how *I* actually write, and ensure process is aligned with what I do
- [x] Update the pinned GitHub Actions when their Node 24-compatible major versions are adopted; the current CI passes but GitHub now emits a Node 20 action-runtime deprecation notice.
- [x] fix font glitch on load (how it loads in as a diff font). I want 0 cummulative layout shift
- [x] make not look AI generated (looks generic)
- [x] get better graphics for projects (and make graphics a good size on work pages)
- [x] For GPUShare, only the second post is visble. 'I'm Building a GPU PC, So I Made It a Private AI Server for My Friends' doesn't go to post when clicked (just goes to https://hamishburke.dev/work/gpu-share)
- [x] Going from GPUShare to https://hamishburke.dev/posts/splitting-the-stack-and-making-setup-actually-work, the back button should take you make to the prev page (not the /works page)
- [x] for https://hamishburke.dev/posts/splitting-the-stack-and-making-setup-actually-work, the TOC is clipped, either remove it, or fix.
