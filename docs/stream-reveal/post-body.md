A chat box on a product I have been working in streams its answer one character at a time. I have watched maybe a dozen people use it now and they all do the same thing, which is try to read a sentence that is not there yet. I did it too, and it took me a while to notice.

The arrival is part of the answer. It is the first thing anyone meets and the only part of the text they experience before they can read any of it, and it has no author. The API hands you tokens one at a time and the client prints them as they land, which is a default rather than a decision.

## What moving text costs

Reading is not a word at a time. The eye lands on a word, sits about a quarter of a second, and jumps, and the jump is planned from what has already been read. Put people on text that moves and comprehension falls, worst on the questions that need an inference[^1]. The words stay readable. The sentences they make do not get built.

A ticker is not a growing paragraph, but the same thing breaks in both. A paper at CHI this year paced streamed output in units matched to reading rhythm for the same reason, because a pause mid-phrase interrupts the sentence you are in and leaves you unsure anything is still happening[^2].

## How the answer gets drawn

{{stream-reveal}}

Characters, words, chunks and sentences differ in how much text appears at once, and all at once and held are the same drawing with different waits. Only the character version reflows, nine times over this answer at phone width and zero for the rest, because every other mode puts its words into the paragraph first and animates opacity over text that already has its space. The seconds measure the animation's clock, not a model.

## The case against holding it

Two results go the other way. Buell and Norton gave people identical search results and varied only what the site showed while it worked. Showing the work was preferred to handing back an instant answer, and a running list of what was being searched beat a progress bar[^3]. Tan and colleagues varied the wait before the first token, and the two second answers were rated less thoughtful and less useful than the nine and twenty second ones[^4].

Both of those bite. A held answer keeps the delay and removes the text arriving inside it, which is the part the second study says people read as thinking, and a clock is the weaker of the two forms the first one tested. Neither says the layout may move under a reader. They say the wait has to look like work, which is something I can build and have not.

A third result asks whether any of it matters. A timer during a wait changed how long the wait felt and changed nothing about how well people did the task after it[^5]. None of these measured a paragraph growing under a reader, so what follows rests on a mechanism and a number that does not test it.

## What it still throws away

A stream commits to one shape, a paragraph growing downward, so a comparison arrives as prose whether or not a table was the right answer, and the elements appear in the order the model generated them. Layout first means a heading, then rows, or two columns, or a map with one sentence underneath. Inference is the reason I would defend that hardest: a table is an inference the reader no longer has to make.

Chunks are the compromise when the wait is too long to hide. Skimming a page I take in about a clause, near the commas, so the meaning lands while the rest is still arriving. Words feel like being read to. Characters feel like a printer.

The case I have not worked out is a four second answer with three sections in it, where holding feels long and streaming as prose throws away structure you know is coming. Probably the heading goes first, then each section as a block, and the movement is line to line. Which is still a stream, just not a stream of text.

## Notes

[^1]: Harvey and Walker, [Reading comprehension and its relationship with working memory capacity when reading horizontally scrolling text](https://pubmed.ncbi.nlm.nih.gov/28766371/), Quarterly Journal of Experimental Psychology, 2014. Comprehension fell for scrolling text, and inference questions were worse at both scrolling speeds tested.

[^2]: [Just-in-Time Tokens: Adaptive Token Pacing for Cognitive-Friendly LLM Streaming](https://doi.org/10.1145/3772363.3798936), CHI 2026 extended abstracts.

[^3]: Buell and Norton, [The Labor Illusion: How Operational Transparency Increases Perceived Value](https://doi.org/10.1287/mnsc.1110.1376), Management Science 57(9), 2011.

[^4]: Tan, Messerschmidt, Yin and Nov, [The Impact of Response Latency and Task Type on Human-LLM Interaction and Perception](https://arxiv.org/html/2604.06183), CHI 2026.

[^5]: [Counting the Wait: Effects of Temporal Feedback on Downstream Task Performance and Perceived Wait-Time Experience during System-Imposed Delays](https://arxiv.org/html/2602.04138), 2026.
