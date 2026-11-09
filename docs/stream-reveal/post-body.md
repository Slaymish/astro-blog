A chat box in a product I have been working in streams its answer a character at a time. Twelve people have used it while I sat and watched, and every one of them tries to read a sentence that isn't there yet. So did I, for about a month, until the wrap kept shifting under my own eye and I got annoyed enough to ask why.

Nobody designed the arrival. The API hands you tokens and the client prints them as they land, so the screen gets whatever order the server happened to produce.

Reading isn't a word at a time, whatever the screen is doing. Your eye lands on a word, sits about a quarter of a second, and jumps, and the jump is planned from what you have already read. Harvey and Walker had people read scrolling text against static paragraphs and comprehension fell, most of all on the questions that needed an inference.[^1] Every word was still readable. The sentences they were meant to make did not get built.

A ticker is not a paragraph growing downward, and I wouldn't bet a design on one study. It does say that text moving during reading has a cost, and moving text is the only thing a stream is doing. Here it is happening to a paragraph of mine, measured as it arrives:

{{stream-reveal}}

Only the character version reflows, nine times over this answer at phone width, none for the rest. Everything else puts its words into the paragraph first and animates opacity over space that is already taken, so nothing moves under you and the clock is the only thing changing. The seconds are the animation's, not a model's.

Buell and Norton are what keep me unsure. Identical search results, and people preferred the sites that showed their work over the ones that answered instantly, and waited longer when they could watch it happen.[^2] A token at a time is the same trick, and holding the reply takes it away from me.

Tan and colleagues make it worse. Two second replies were rated less thoughtful and less useful than nine and twenty second ones, and people read the wait as the model thinking.[^3] Holding maximises that wait and then shows them nothing for it. Counting the Wait is the awkward one: a timer during a wait changed how long the wait felt and nothing about how anyone did afterwards.[^4]

What I want is the answer to exist before it gets drawn. A stream can only produce one shape, a paragraph getting longer downward, so a comparison arrives as prose whether a table was the right answer or not (I have shipped that, and it reads fine until you want to scan it). Layout first means the words are data before they are text and the reader gets a page instead of a performance of one.

The case I haven't worked out is a four second reply with three sections in it, where holding feels long and streaming as prose throws away structure you already know is coming. Probably the heading goes first, then a block per section, and the movement is line to line. Still a stream, just not a stream of text.

## Notes

[^1]: Harvey and Walker, [Reading comprehension and its relationship with working memory capacity when reading horizontally scrolling text](https://pubmed.ncbi.nlm.nih.gov/28766371/), Quarterly Journal of Experimental Psychology, 2014. Comprehension fell for scrolling text, and inference questions were worse at both scrolling speeds tested.

[^2]: Buell and Norton, [The Labor Illusion: How Operational Transparency Increases Perceived Value](https://doi.org/10.1287/mnsc.1110.1376), Management Science 57(9), 2011.

[^3]: Tan, Messerschmidt, Yin and Nov, [The Impact of Response Latency and Task Type on Human-LLM Interaction and Perception](https://arxiv.org/html/2604.06183), CHI 2026.

[^4]: [Counting the Wait: Effects of Temporal Feedback on Downstream Task Performance and Perceived Wait-Time Experience during System-Imposed Delays](https://arxiv.org/html/2602.04138), 2026.
