In a product I'm working on, the chat box streams its answer in a character at a time. I kept trying to read each sentence before it had finished, and the line kept rewrapping as new words came in, so I'd lose my place.

I hadn't thought about it much before that. The API sends tokens, the client prints them as they arrive, and that's the whole design. No one decided the answer should show up that way, it's just the default.

## Why moving text is hard to read

Your eye doesn't move along a line word by word. It stops on a word for about a quarter of a second, then jumps ahead, and where it jumps to depends on what you've already read. If the text moves under you, that goes wrong.

Harvey and Walker compared scrolling text with a normal paragraph. People understood less from the scrolling version, and it was worst on questions where they had to work something out rather than remember it.[^1] They could still read every word, they just weren't putting the sentences together as well.

A scrolling ticker isn't the same as a paragraph growing downwards, and it's one study, so I wouldn't lean on it too hard. But it matches what I saw: text moving while you read it costs you something.

## Six ways to show the same answer

Here's one paragraph drawn six ways. The counter tracks how many times the text reflows as it comes in, and two clocks time the first thing you see and the last:

{{stream-reveal}}

Characters moved ten times at phone width. Hybrid moved twice, both inside its first half second, then held still. The other four lay out all the words first and fade them in, so the space is already taken and nothing shifts. The timings come from the animation, not a real model.

Hybrid is the version I'd want. It types the first clause a character at a time, so there's something on screen immediately, then goes a word at a time for the rest of that sentence, and whole sentences after that. The first moment is as fast as streaming, and the rest arrives at a pace I can read rather than a pace the server set.

## Why I'm not sure holding the reply is better

The obvious fix is to wait for the whole answer and show it at once. A few studies make me less sure about that.

Buell and Norton found people preferred websites that showed the work happening over ones that gave the same results instantly, and were willing to wait longer for them.[^2] Streaming tokens is basically that, and if I hold the reply I lose it.

Tan and colleagues found two-second replies were rated less thoughtful and less useful than nine or twenty-second ones, because people took the wait as the model thinking harder.[^3] Holding the reply makes that wait as long as possible, but there's nothing to look at while it happens. A timer might help a bit. One study found showing elapsed time during a wait changed how long it felt, but not how well people did afterwards.[^4]

## What I'd build instead

I'd like the full answer to exist before anything gets drawn. Streaming only gives you one shape, a paragraph getting longer, so even when the answer should be a table it comes out as prose. That's fine to read but annoying when you want to scan it. If the layout comes first, the answer can be a table, a list or a few sections, whatever suits it.

The case I haven't worked out is a reply that takes about four seconds and has three sections. Holding it feels too long, but streaming it as prose throws away structure you already know is coming. I think the fix is to show the heading first, then each section as a block, so it still arrives in order, just a section at a time instead of a character at a time.

## Notes

[^1]: Harvey and Walker, [Reading comprehension and its relationship with working memory capacity when reading horizontally scrolling text](https://pubmed.ncbi.nlm.nih.gov/28766371/), Quarterly Journal of Experimental Psychology, 2014. Comprehension fell for scrolling text, and inference questions were worse at both scrolling speeds tested.

[^2]: Buell and Norton, [The Labor Illusion: How Operational Transparency Increases Perceived Value](https://doi.org/10.1287/mnsc.1110.1376), Management Science 57(9), 2011.

[^3]: Tan, Messerschmidt, Yin and Nov, [The Impact of Response Latency and Task Type on Human-LLM Interaction and Perception](https://arxiv.org/html/2604.06183), CHI 2026.

[^4]: [Counting the Wait: Effects of Temporal Feedback on Downstream Task Performance and Perceived Wait-Time Experience during System-Imposed Delays](https://arxiv.org/html/2602.04138), 2026.
