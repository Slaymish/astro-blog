A chat box on a product I have been working in streams its answer one character at a time, and everyone watching it does the same thing, which is try to read a sentence that is not there yet. Words finish themselves while their eye is already on the next one, the wrap changes underneath the sentence they are in the middle of, and roughly a third of the answer gets read twice. I spent a while assuming that was a property of the model. It is a property of the wire.

What comes over the connection is a sequence of small chunks, usually one token at a time and a token is about three or four characters, often ending in the middle of a word. Server-sent events deliver them in order and stop when the generation stops. Nothing in that stream says the reader has to watch it, and nothing says the paragraph has to grow while they read.

## What actually gives it away

The speed is not the tell, since a fast machine streaming a hundred tokens a second still looks machine made. Three things do the work. Partial words are visible. The cadence is so even that it is obviously a clock. And the layout moves while someone is reading it.

The first two are cosmetic and easy to let go of. The third is the one that costs a reader their place, because a paragraph that reflows is a paragraph being edited by someone else mid sentence.

{{stream-reveal}}

## Holding it back is the whole trick

If you wait for the answer to finish before drawing any of it, the shape of the paragraph is known at the first frame and nothing moves after that. Every word is placed and invisible, and the animation only turns opacity and blur up. The reader's eye gets a fixed target, and the answer appears to be written rather than emitted.

That costs the first second. A second of empty space reads longer than a second of watching text fill in, which is the honest argument for streaming and the reason almost every product does it. It is a real argument, and it only applies while the wait is longer than the thing being waited for.

## Where the line sits

Under about two seconds there is nothing to cover, so the time is better spent on the drawing. Over about eight seconds the wait itself becomes the problem and text filling in is the only honest signal that something is still happening.

Between those two numbers the answer is usually long enough to have structure, which is the case streaming handles worst. A stream can only produce one shape, a paragraph growing downward, so a comparison arrives as prose whether or not a table was the right answer. Once the text is data before it is painted, the layout can be decided first: a heading, then rows, or two columns, or a chart with one sentence underneath it, and the arrival is an animation over a page that already exists.

That matters more than the animation. If you are going to hold the answer anyway, the thing you draw does not have to be the thing that came off the wire.

The case I have not worked out is the four second answer with three sections in it, where holding the whole thing feels long and streaming it as prose throws away structure you know is coming. Probably that one gets the heading first, then the sections, and the movement goes line to line instead of character to character. Which is still a stream, just not a stream of text.
