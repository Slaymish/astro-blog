A chat box on a product I have been working in streams its answer one character at a time. I have watched maybe a dozen people use it now and they all do the same thing, which is try to read a sentence that is not there yet. The word they are on finishes itself while their eye has moved on, the line jumps when the wrap changes, and roughly a third of the answer gets read a second time once it stops moving.

I assumed for a while that this was a property of the model, something you put up with in exchange for the first words coming out fast. The generation is a token at a time and a token is three or four characters, so the text really does come out in bits. What it does not decide is how those bits get drawn. The same answer could go onto the page as a table, a map, three paragraphs or one sentence, and picking between those is a layout decision made in the browser, not something the model has an opinion about.

## What gives it away

The speed is the first thing people blame and it is not the problem. A machine printing a hundred tokens a second looks just as machine made as a slow one. What gives it away is smaller. Partial words. A cadence so even it is obviously a clock. And a paragraph that moves while somebody is reading it.

The first two are easy to live with. The third costs a reader their place in the sentence, and it stops the moment the paragraph is at full size before anything is drawn.

{{stream-reveal}}

## Nothing on screen for a second

If you wait for the answer to finish and then draw it, the paragraph is at its final size from the first frame and nothing moves underneath anyone. Every word is in the page and invisible, and the animation only brings the opacity up. The eye gets a target that does not move.

The cost is a second with nothing on it. A second of nothing does read longer than a second of watching text fill in, which is the honest case for streaming and the reason everything does it. It is a real case, and it only holds while the wait is longer than the thing being waited for.

## Where the line sits

Under about two seconds there is nothing to cover, so spend the time on the drawing instead. Past about eight seconds the wait is the problem and text filling in is the only honest signal that something is still happening.

In between, the answer is usually long enough to have structure, and structure is what a stream is worst at. A stream produces a single shape, a paragraph getting longer downward, so a comparison arrives as prose whether or not a table was the right answer. Once the text is data before it is painted, the layout gets decided first: a heading, then rows, or two columns, or a map with one sentence underneath it, and what the reader sees is an animation over a page that already exists.

If I had to ship one of these it would be the chunks, which is not what I expected. Reading does not happen a word at a time. Skimming a page I take in about a clause before I know what it said, somewhere near the commas, and the meaning lands whether or not the rest of the words have shown up. Chunks match that. Words feel like being read to. Characters feel like a printer.

The case I have not worked out is a four second answer with three sections in it, where holding the whole thing feels long and streaming it as prose throws away structure you know is coming. Probably the heading goes first, then each section as a block, and the movement is line to line instead of character to character. Which is still a stream, just not a stream of text.
