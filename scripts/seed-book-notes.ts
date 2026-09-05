/**
 * Writes the reading notes, status and order for every book on /reading, and
 * creates the ones the reading list mentions that Sanity does not have yet.
 * Notes come from the vault file `Reading List and thoughts.md` (2026-09-05),
 * spelling corrected and nothing else.
 *
 *   pnpm run seed:books
 *
 * Existing books are matched by title and patched (note, status, order only;
 * covers and links are left alone). Missing ones are created without a cover.
 * Re-running overwrites notes edited in Studio since, so reconcile first.
 *
 * Requires SANITY_API_TOKEN with write access.
 */

import { createClient } from '@sanity/client';

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const apiVersion = process.env.SANITY_API_VERSION || '2024-01-01';
const token = process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.error('Missing SANITY_PROJECT_ID. Add it to .env.');
  process.exit(1);
}

if (!token) {
  console.error(
    'Missing SANITY_API_TOKEN.\n' +
      'Create an Editor token at https://sanity.io/manage → API → Tokens, then add\n' +
      'SANITY_API_TOKEN=... to your .env file. Do not commit it.'
  );
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

type Status = 'reading' | 'to-read' | 'read';

type BookNote = {
  title: string;
  /** Only used when the book has to be created. */
  author: string;
  status: Status;
  /** Position within the status group; the route sorts by it. */
  order: number;
  note: string;
};

const books: BookNote[] = [
  {
    title: 'Twilight of the idols',
    author: 'Friedrich Nietzsche',
    status: 'to-read',
    order: 2,
    note:
      "I started this book, and immediately grinded to a halt while reading the preface. He kept mentioning specific concepts (like 'my Zarathustra'), which makes me feel like reading his previous work is a pre-condition to reading this piece (one of the last things he wrote, in that final year with Ecce Homo and The Antichrist). It was clear he was not going to spend time relitigating concepts he's talked about previously. As I actually want to get the most understanding as I can from this, I decided to put it down, until I have read his seemingly most vital pieces (being The Gay Science, Beyond Good and Evil, Thus Spoke Zarathustra)."
  },
  {
    title: 'Ecce Homo',
    author: 'Friedrich Nietzsche',
    status: 'reading',
    order: 1,
    note:
      "This has felt like Nietzsche's most accessible writing I've attempted to read so far. The core reason is he steps away from aphoristic prose into an auto-biographic style. I think the first person perspective helps it read as a more 'standard' book. The chapters could be seen as hilariously egotistic, with titles like 'Why I am so wise', 'Why I am so clever', and 'Why I write such good books'. These aren't click baity titles either, that's exactly what those chapters are about. When I read it, as I've experienced his perspective and philosophy before in his previous work, I could understand where he was coming from, and it seemed obvious he was writing it through a meta ironic lens. Though I'd be interested to hear what someone else's impressions of the chapters would be, without the epistemic bias I definitely have towards some of his ideas (for instance, in 'Why I write such good books', he doesn't need to convince me that his books are in fact good, as I already believe that)."
  },
  {
    title: 'Beyond Good and Evil',
    author: 'Friedrich Nietzsche',
    status: 'to-read',
    order: 1,
    note:
      "I flicked through several of the aphorisms, and feel like the latent concept of it is aligned enough in my mind, enough so that I'd consider the 'arguments' made valid. I suppose that's how one could describe Nietzsche's philosophy (and a fair bit of continental philosophy, though not all of it, Hegel and Husserl argue things through properly): you couldn't state a singular argument so compelling it grounds your belief, it's rather a collection of texts that provoke an emotional resonance that reverberates enough that the affected person can point to it as an entity. You can agree that if two people had this shared understanding/entity in their minds, they'd tend to agree on a lot, not because they've heard the same facts, rather they have a shared starting vibe they approach looking at the senses."
  },
  {
    title: 'Human, All Too Human',
    author: 'Friedrich Nietzsche',
    status: 'read',
    order: 1,
    note:
      "This is probably the book from Nietzsche I have spent the most time with, both reading and thinking about. It's his first aphoristic book (The Birth of Tragedy and the Untimely Meditations came before it), so feels good knowing I'm not going to get bogged down in concepts he's explained in other books. Interestingly, you can see how this book is different from his later works, and what people would consider 'Nietzsche's Philosophy'. He is still grappling with the same concepts he discusses in his future work, though from a more questioning place. This is where he wrote 'Is it the case that X?', so his later work can say 'Because X, it means Y and Z'. I'd recommend this book as an introduction to Nietzsche to anyone, particularly if you spend a bit of time getting to learn about the context Nietzsche was writing in (his friend/father figure Wagner was putting on a show in the name of romanticism, and this book was Nietzsche's breaking point, where he declared himself not a disciple of Wagner, and an opponent of the truth of romanticism)."
  },
  {
    title: 'The Fall',
    author: 'Albert Camus',
    status: 'read',
    order: 2,
    note:
      "This was the first book I read which was remotely related to existentialism in any way. I heard about Camus as 'the father of the Absurd', and that piquing my interest, turned out my friend had this book lying around the house. I was very fond of the storytelling through the perspective of a conversation (this is what led me to pick up The Reluctant Fundamentalist next, which uses that same technique). It seemed to allow me to use my imagination in the same way I would if I were getting told a story by someone, as opposed to reading a fictional book. Quite honestly this book would mean very little to me if it weren't for the secondary literature (youtube videos :p) I was using to understand the concepts as I went through it. The main protagonist calls himself the Judge Penitent, which I was confused by, first by what that meant (someone who confesses their own sins to gain the ability to judge others), and then once I knew, what caused that 'moral collapse' in him. To this day, the picture of the emotional experience of the absurd laughing plays in my head as almost a character."
  },
  {
    title: 'The Myth of Sisyphus',
    author: 'Albert Camus',
    status: 'read',
    order: 3,
    note:
      "Once I read The Fall, and more of the surrounding ideas of it, of course I thought I should read the myth of sisyphus. This felt like what I was after, stripped of the narrative interpretations, and just said plainly, in the form of an essay. The first 2 thirds and last quarter were incredible. I found the middle part too dense with examples to really engage with it, though some stuck, like the actor who wears multiple masks, or the story of the man who killed himself to prove he was free."
  },
  {
    title: 'The Reluctant Fundamentalist',
    author: 'Mohsin Hamid',
    status: 'read',
    order: 4,
    note:
      'Picked this up straight after The Fall, as it tells the whole story through one side of a conversation in the same way, which was the part of The Fall I was most fond of.'
  },
  {
    title: '1984',
    author: 'George Orwell',
    status: 'read',
    order: 5,
    note:
      'This was I think my first active book choice that felt like I wanted to read it because it had ideas that pertained to something interesting that can be applied to reality.'
  },
  {
    title: 'The Prince',
    author: 'Niccolò Machiavelli',
    status: 'read',
    order: 6,
    note:
      "Got into this as I've heard the word 'Machiavellian' thrown around occasionally, and wanted to actually read what his political philosophy actually consists of. Feels excessive to state I consider it distasteful, so interesting hearing from someone who had actually been a diplomat for the Florentine Republic (and written this after the Medici came back and he'd lost the job) how he perceived the principalities and city-states working around him."
  },
  {
    title: 'The House in the Cerulean Sea',
    author: 'T.J Klune',
    status: 'read',
    order: 7,
    note:
      "This and Somewhere Beyond the Sea were both a fun read, wholesome fiction was a great breath of fresh air, where I was able to get fully immersed in the narrative. The love between Arthur and Linus was really sweet and I loved hearing how they described each other so affectionately in each other's eyes."
  },
  {
    title: 'Somewhere Beyond the Sea',
    author: 'T.J Klune',
    status: 'read',
    order: 8,
    note:
      "This and The House in the Cerulean Sea were both a fun read, wholesome fiction was a great breath of fresh air, where I was able to get fully immersed in the narrative. The love between Arthur and Linus was really sweet and I loved hearing how they described each other so affectionately in each other's eyes."
  }
];

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function main() {
  const existing = await client.fetch<{ _id: string; title: string }[]>(
    '*[_type == "book"]{_id, title}'
  );
  const byTitle = new Map(existing.map((doc) => [doc.title.trim().toLowerCase(), doc._id]));

  const tx = client.transaction();
  const created: string[] = [];
  const patched: string[] = [];

  for (const book of books) {
    const id = byTitle.get(book.title.toLowerCase());
    const fields = { note: book.note, status: book.status, order: book.order };
    if (id) {
      tx.patch(id, (p) => p.set(fields));
      patched.push(book.title);
    } else {
      tx.create({ _id: `book-${slug(book.title)}`, _type: 'book', title: book.title, author: book.author, ...fields });
      created.push(book.title);
    }
  }

  await tx.commit();
  console.log(`Patched ${patched.length}: ${patched.join(', ')}`);
  if (created.length) console.log(`Created ${created.length} (no cover yet): ${created.join(', ')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
