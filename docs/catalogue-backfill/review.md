# Thirty-eight prepared catalogue entries

All dates use the recorded first preserved commit or release, rather than an assumed launch. Current application screenshots were captured in October 2026. The thirty-eight-entry bundle is published in the live catalogue at https://hamishburke.dev/work.

## Personal Language Corpus

2026-10-02 · October 2026 · independent

Local language-analysis workflow

Built a local workflow for importing language samples with provenance and comparing quantitative features with source-linked observations.

This workflow brings transcripts and exports into one small corpus, keeping passage IDs and source information attached to the analysis so a pattern can be checked against the words behind it.

Independent development. Python importers, provenance and analysis workflow.

I worked on the structure of the corpus before its interpretation, as a useful observation about language needs a way back to the passage and the source that produced it, with those identifiers kept through the import so later features and observations could still point to the same text.

The importers handle supported transcripts and exports, with stable passage IDs and role information carried into quantitative features, baseline comparisons and the qualitative workflow.

The repository includes sample inputs and workflow tests, which make it possible to try the pipeline without bringing a private conversation history into the demonstration.

The catalogue date follows the first preserved commit on 2 October 2026.

Result: A local, testable corpus workflow with provenance and sample data. It keeps the underlying passages inspectable while separating numerical features from qualitative interpretations.

Date evidence: [first preserved commit](https://github.com/Slaymish/personal-language-corpus/commit/ebaaae1979e97b60b3ced9eb0695384ae147e0af) (private repository).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/personal-language-corpus)

## Typed Diff Questions

2026-09-21 · September 2026 · research

Code-review model experiments

Built an experiment harness comparing models on narrow questions about code diffs, with calibration and class-balanced evaluation.

I tested whether small, typed questions about a changed hunk gave a useful basis for code review, comparing model agreement while keeping the eventual reviewer separate from the experiment.

Independent research. Corpus sampling, model scoring, calibration and evaluation.

I worked on the question bank before building the reviewer, as a model answering a narrow question about a diff gives something that can be compared across runs without treating the whole review as one judgement, with each question producing a score that could be calibrated and compared with a simple baseline.

The harness sampled code hunks and compared Jev and Haiku with an Opus reference, with repeated scores, class-balanced measures and an always-negative baseline to expose how much the label distribution could inflate apparent agreement.

The findings changed between repositories, and the reference was still another model, so the experiment measured agreement under those conditions without establishing that a developer would accept the findings as real bugs.

The catalogue date follows the first preserved commit on 21 September 2026.

Result: Three recorded scoring runs and a reusable experiment harness. Human bug labels and the proposed reviewer interface remain outside the conclusions established by this work.

Date evidence: [first preserved commit](https://github.com/Slaymish/commit-reviewer/commit/4b4578e59497f15866ef802d7a0e5b3ea7347a81) (private repository).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/typed-diff-questions)

## Conversational Timing Lab

2026-09-04 · September 2026 · research

Speech turn-taking experiments

Built a speech-timing dataset and baseline evaluation to study turn completion and response onset in real conversations.

I investigated when a speaker has actually finished, keeping turn completion separate from the timing of the next response and testing pause-based assumptions against recorded conversations.

Independent research. Dataset adapters, causal labels, baseline evaluation and audio-model pipeline.

I started with the difference between somebody finishing a thought and somebody pausing inside it, as both can leave the same silence while asking very different things of a voice assistant, with the next speaker supplying the label while the observed silence remained an input available at the time.

The dataset labels came from who spoke next, with observations limited to what was available at that moment, and the baseline evaluation used conversation-level splits to keep meetings from leaking across training and validation.

The recorded baseline run covered 100,004 boundaries from 171 AMI meetings, though the small audio-model run was only an end-to-end pipeline check and did not establish a useful trained predictor.

The catalogue date follows the first preserved commit on 4 September 2026.

Result: A reproducible baseline investigation and audio-training pipeline. Pause duration offered limited separation on the recorded meeting data, with the corpus and interruption-budget caveats retained.

Date evidence: [first preserved commit](https://github.com/Slaymish/conversational-timing-lab/commit/56e367e5f17de2bd8d95978f665c9b30cdaf8e9f).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/conversational-timing-lab)

## Wake-on-Join Minecraft

2026-07-26 · July 2026 · independent

On-demand AWS game server

Built an AWS Minecraft setup that sleeps when idle and wakes when somebody tries to join, with infrastructure templates and a runbook.

I put together a Minecraft server for friends that can sleep while nobody is playing, with the join attempt acting as the signal to bring it back.

Independent infrastructure development. Paper, AWS templates and server operations tooling.

The server was for a small group, and keeping a machine running all the time was a different problem from making it available when somebody actually wanted to play, with the infrastructure keeping the wake mechanism available while the machine that ran the game could sleep.

The project separated the wake path from the game instance, with infrastructure templates, a control script and operating notes describing how the server starts and how idle periods are handled.

The join-triggered approach kept the familiar Minecraft connection as the entry point, though waking an instance still has a startup period before the game server becomes ready.

The catalogue date follows the first preserved commit on 26 July 2026.

Result: An on-demand Paper server architecture with deployment templates and a runbook. The entry describes the wake and idle behaviour without claiming instant startup or a measured cost saving.

Date evidence: [first preserved commit](https://github.com/Slaymish/YayMinecraftServer/commit/6307b6e61a02cda8baee7f512d316c06503f6df4).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/wake-on-join-minecraft)

## Otto

2026-06-20 · June 2026 · independent

Native Mac voice assistant

Developed a native Swift version of a Mac voice assistant, with hotkeys, capability retrieval, session logs and local retrospective learning.

Otto is a voice and text assistant for the Mac. I developed it from the voice-os project, moving the app into Swift and adding capability and session-learning work.

Development of a fork of per-simmons/voice-os. Swift migration, interface and learning integration.

I started from voice-os and worked towards a native Mac app, with the voice connection, action handling and interface held in Swift instead of relying on the earlier Python process, with the native engine holding the connection and action state that the interface needed to show.

The app kept a capability index and session logs, and retrospective processing could add useful phrasings or proposed capabilities from a completed session, with a local Ollama option for that learning step.

Hotkeys, onboarding and settings made it usable as a menu-bar application, and the June releases packaged the Swift app alongside tests for the capability and session components.

The catalogue date follows the first preserved release on 20 June 2026.

Result: Packaged Mac releases with a native Swift implementation and session-based capability work. The entry credits the upstream project and distinguishes my changes from its starting point.

Date evidence: [first preserved release](https://github.com/Slaymish/Otto/releases/tag/v0.0.2).

Cover: original native interface render. Unmodified JournalView in Otto/Otto/JournalWindow.swift, rendered offline using shipped memory/capabilities.json. No microphone, model, commands or learning run.

[Local preview](http://localhost:4371/work/otto)

## Lumen

2026-05-16 · May 2026 · independent

Local Obsidian research plugin

Built a local research system for Obsidian, with related-note surfacing, retrieval, report generation and checks against source blocks.

Lumen connects an Obsidian vault to a local research backend, surfacing related notes and assembling reports whose citations are checked against the vault.

Independent plugin and backend development. TypeScript, Python and local model inference.

I worked on Lumen as a way of finding material already sitting in a vault, and the same retrieval system could surface related notes during ordinary writing or feed a longer research request, with the original note blocks kept available as sources when related material was assembled into a report.

The Obsidian plugin talked to a Python orchestrator, with separate packages for ingestion, retrieval, inference and memory, while a local model produced the research output and streamed progress back to the interface.

Citation handling checked references against actual note blocks, and the project included evaluation and release tooling, though a valid source reference still needs to be read alongside the claim it is attached to.

The catalogue date follows the first preserved release on 16 May 2026.

Result: A released local research plugin and backend, with note surfacing, report generation and source-block checks. GitHub preserves the plugin packages and evaluation code.

Date evidence: [first preserved release](https://github.com/Slaymish/Lumen/releases/tag/0.4.0).

Cover: actual Obsidian plugin screenshot. Original obsidian-plugin/src/research/index.ts and styles.css, built from the repository and captured in Obsidian 1.13.7. Empty temporary vault, no personal notes or model runs.

[Local preview](http://localhost:4371/work/lumen)

## Synod

2026-05-14 · May 2026 · independent

Obsidian journal analysis plugin

Built an Obsidian plugin that reads journal entries through separate value agents and compiles their unresolved tensions into a bulletin.

Synod reads a period of journal entries through separate agents for the values found in them, then brings their disagreements back into the vault as a bulletin.

Independent plugin design and development. TypeScript, Obsidian and configurable language-model backends.

I built Synod around a journal being read from several positions at once, with each agent holding one value and the compiler looking at where their readings pulled in different directions, with each reading kept separate until the compiler had the different reports available to compare against each other.

The plugin imports entries from folders or supported journal exports, extracts candidate values and lets those values guide the analysis, with the resulting bulletin written back into the vault.

Ollama is the default backend, though the settings also support compatible remote endpoints, so where the journal text goes depends on the connection the user chooses for the plugin.

The catalogue date follows the first preserved release on 14 May 2026.

Result: A released Obsidian plugin with importers, value discovery and a bulletin pipeline. It offers competing readings of journal entries without presenting them as clinical advice.

Date evidence: [first preserved release](https://github.com/Slaymish/Synod/releases/tag/0.1.0).

Cover: actual Obsidian plugin screenshot. Original src/ui/status-view.ts and styles.css, built from the repository and captured in Obsidian 1.13.7. Empty temporary vault, no personal notes or model runs.

[Local preview](http://localhost:4371/work/synod)

## Flat Power Calculator

2026-04-21 · April 2026 · independent

Household electricity split tool

Built a small web tool for calculating and communicating the flat electricity-bill split, with a Home Assistant integration module.

I made a small calculator for the flat power bill, keeping the calculation and the message about what each person owes close to the same inputs.

Independent development. TypeScript calculation, formatting and Home Assistant integration.

The project started with the monthly power bill for the flat, and I kept the calculation separate from its formatting so the amount shown in the interface could also be used when communicating the split, with the browser interface taking the figures while the calculation module kept the sharing rule in one place.

The TypeScript modules separate the split calculation, display formatting and Home Assistant access, with a browser interface for entering the relevant figures and working through the result.

It stayed a small household tool, though that scale made the rule easier to inspect, as there was one bill and a particular sharing arrangement behind the numbers.

The catalogue date follows the first preserved commit on 21 April 2026.

Result: An implemented household calculation tool with a clear separation between inputs, split logic and output formatting. The cover shows the workflow using no personal bill amounts.

Date evidence: [first preserved commit](https://github.com/Slaymish/PowerCalculator/commit/22b7a57e6fce227e119f634bac360ae223ddd177).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/flat-power-calculator)

## DropETA

2026-03-20 · March 2026 · independent

Delivery-route planning prototype

Built a delivery planner with address lookup, stop ordering, ETA calculations and previews of where a new stop fits.

DropETA is a prototype for arranging a changing list of deliveries, using route durations to work through stop order and the arrival times that follow from it.

Independent prototype development. TypeScript, routing services and browser UI.

I worked on the point where a new delivery changes an existing route, as adding an address is easy but the useful part is seeing what it does to the stops that were already planned, with the duration matrix giving the ordering logic travel estimates to compare as the list of destinations changed.

The implementation has duration-matrix and route services, with stop-order evaluation, recalculated arrivals and an insertion preview that tests where another stop can fit in the current plan.

The interface ties those operations to a map and a stop list, though live position access and the configured routing services are still conditions for the corresponding ETA behaviour.

The catalogue date follows the first preserved commit on 20 March 2026.

Result: An implemented route-planning prototype with browser UI and stop-insertion logic. The captured interface shows the initial state, without implying a completed commercial rollout.

Date evidence: [first preserved commit](https://github.com/Slaymish/dropeta/commit/bbec413877a31ff92766041c82b928d98c611814) (private repository).

Cover: live application screenshot. https://dropeta.vercel.app

[Local preview](http://localhost:4371/work/drop-eta)

## Metlink Departures Display

2026-01-16 · January 2026 · independent

Glanceable home bus sign

Made a web and command-line display for upcoming Wellington bus departures, with a small service setup for home use.

A small departures sign for Wellington buses, built to put the next arrivals somewhere glanceable instead of repeating the same stop lookup.

Independent development. Python, Metlink departures and a home service.

I made this around a bus stop and its next departures, keeping the display small enough to be useful at home while the same lookup could also be read from the command line, with the server and terminal versions sharing the departure information that gave the sign its useful content.

The Python code includes the departure retrieval and a web sign server, with an example systemd service for keeping that display available without starting it by hand each time.

The configured stop and API connection determine the actual arrivals, so the illustration uses the display's structure without presenting made-up minutes as a live service reading.

The catalogue date follows the first preserved commit on 16 January 2026.

Result: A compact web and CLI departure display with documented setup. The cover explains the sign format, with no live arrival data implied.

Date evidence: [first preserved commit](https://github.com/Slaymish/metlink-departures-display/commit/2b07ac0a1e0f597585ffec6e43db01b3045db91e).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/metlink-departures-display)

## Piano Improvisation Helper

2025-12-12 · December 2025 · independent

Browser audio key detection

Built a piano practice tool that searches for songs and estimates their key from available audio previews in the browser.

This small app looks up a song, analyses an available preview and shows the likely key with alternate guesses, giving a starting point for playing along.

Independent development. React, TypeScript, Web Audio and pitch-class analysis.

I made this around the moment of wanting to play along with a song, and the first version starts with a title and artist search before looking for an audio preview it can analyse, with the preview providing the audio material and the manual search keeping the initial interaction straightforward.

The detector decodes the preview in the browser and builds a pitch-class histogram across audio frames, then compares that distribution with major and minor key profiles to rank the possible keys.

The UI keeps alternate guesses visible and lets the analysis run for longer, though microphone-based song recognition is still a placeholder in this version and the implemented path starts with manual search.

The catalogue date follows the first preserved commit on 12 December 2025.

Result: A working search and preview-analysis interface with in-browser key detection and service tests. Results are estimates from the available clip, with alternate candidates shown.

Date evidence: [first preserved commit](https://github.com/Slaymish/PianoImprovisationHelper/commit/74939527fbee2fed6735975394bf29b39f3256e5).

Cover: live application screenshot. https://pianoimprovisationhelper.netlify.app/

[Local preview](http://localhost:4371/work/piano-improvisation-helper)

## Bedroom Layout Designer

2025-12-02 · December 2025 · independent

Browser-based room planning

Built a room planner with furniture editing, measurements, undo, local saving and printable PDF exports.

Bedroom Layout Designer is a browser tool for trying room arrangements with actual dimensions, keeping furniture, openings and measurements in the same editable plan.

Independent product design and development. React, TypeScript and local workspace storage.

I made a room planner around the parts that need to agree before a layout is useful, as the room dimensions, furniture and door openings all have to share the same scale, with the plan keeping those measurements in shared workspace state as each object was moved or resized.

The workspace supports multiple rooms and measurement units, with placement, rotation and resizing for furniture and openings, and undo and redo across edits so an arrangement can be tried without losing the previous one.

Plans save locally and can be exported as workspace files or PDFs, and I added tests around selection and state handling as those interactions determine whether the drawing stays predictable.

The catalogue date follows the first preserved commit on 2 December 2025.

Result: A browser-based planning app with local persistence, offline support and PDF output. The preserved work runs from December 2025 through the interaction updates in February 2026.

Date evidence: [first preserved commit](https://github.com/Slaymish/BedroomLayoutDesigner/commit/c1cee17feb53f23c01db92bdc8ce9288d72c8849).

Cover: live application screenshot. https://bedroomlayout.app

[Local preview](http://localhost:4371/work/bedroom-layout-designer)

## GrooveBox

2025-11-23 · November 2025 · independent

Keyboard-controlled beat sequencer

Built a desktop groovebox with sample playback, editable patterns and a Python sequencer backed by audio-engine experiments.

GrooveBox is a small beat-sketching tool, using the computer keyboard to play samples and record patterns that can be changed while the sequencer runs.

Independent development. Python, Pygame and C++ audio-engine work.

I built the sequencer around playing a pad and keeping that action in a pattern, so the keyboard could serve as the input while a running loop kept the timing visible, with sample playback and pattern state kept separate enough for the same sequencer to use different audio backends.

The code includes quantised recording and pattern switching, with track-length changes, rotation and Euclidean-fill functions sitting alongside the playback state and audio backends.

The repository also has scene and persistence functions beyond the older README checklist, though the proposed physical controller stayed a separate direction from the desktop instrument implemented here.

The catalogue date follows the first preserved commit on 23 November 2025.

Result: A desktop sequencing prototype with sample audio, pattern editing and playback code. The cover diagrams the implemented loop without pretending to be a hardware product photograph.

Date evidence: [first preserved commit](https://github.com/Slaymish/GrooveBox/commit/d1abed5009b43eb84cc501d9c924e61bf396d7c3).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/groovebox)

## Bank-to-Sheets Sync

2025-11-15 · November 2025 · independent

Personal banking data pipeline

Built an Akahu-to-Google-Sheets sync with transaction categorisation, deduplication and balance reconciliation.

I made a small banking pipeline that keeps settled transactions in Google Sheets, leaving the budget calculations in the sheet and handling the recurring sync in Python.

Independent development. Python, Akahu and Google Sheets.

I worked on getting the transaction data into a sheet reliably, as the formulas already had somewhere to live and the recurring job was to keep their underlying ledger up to date, with the saved sync state keeping track of the previous run before another batch of transactions arrived.

The sync used stable transaction IDs and stored its progress between runs, with configurable category rules and transfer detection applied before batched writes to the sheet.

Reconciliation compared the available balance information with the recorded data, while settled transactions avoided some of the mutability that makes pending entries awkward to keep in a repeatable ledger.

The catalogue date follows the first preserved commit on 15 November 2025.

Result: An implemented personal banking sync with focused tests for state, categorisation and reconciliation. It is a precursor to the later finance projects, with sample data used for public illustration.

Date evidence: [first preserved commit](https://github.com/Slaymish/akahu-sheets-sync/commit/91d2561d74d45738549b6fdba40df49c2e05f55e).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/bank-to-sheets-sync)

## Grid Diffusion AD

2025-11-12 · November 2025 to February 2026 · research

Diffusion-based fault detection study

Investigated diffusion models for fault detection in power-system signals, with normal-only training and explicit false-alarm evaluation.

I studied whether diffusion models trained on normal magnetic-field signals could identify electrical faults, separating reconstruction quality from the detection behaviour needed in a monitoring system.

Academic research. Model implementation, experiments, evaluation and report.

The data was repetitive and multi-channel, and I worked on learning its normal structure with diffusion models before using reconstruction and denoising scores to look for fault-related departures, with each score needing to be tested against the normal variation that the model had already seen.

The pipeline included quantisation, categorical denoising and several scoring variants, with experiments comparing model settings and threshold calibration using normal data, as fault labels should not silently become part of the calibration process.

The report found that good reconstruction did not consistently produce useful detection, and the evaluated operating points still had high false-alarm rates, which made the deployment assumptions part of the result.

The catalogue date follows the first preserved commit on 12 November 2025.

Result: A completed implementation and evaluation study with recorded experiments and a report. The findings limit the detector claims, particularly under normal-only threshold calibration.

Date evidence: [first preserved commit](https://github.com/Slaymish/grid-diffusion-ad/commit/e82614c6a4d7ca9b90f767b90edda08f21b863a8) (private repository).

Cover: original project asset. https://github.com/Slaymish/grid-diffusion-ad/blob/main/server_runs/ablation_embed_dim_512bins_20260112_170614/ablation_embed_dim_512bins_1_token_embed_dim-32_20260112_170619/reconstruction_fidelity_examples.png

[Local preview](http://localhost:4371/work/grid-diffusion-ad)

## AndoSim

2025-10-19 · October 2025 · independent

Blender cloth and shell simulation

Built a Blender simulation add-on with a C++ core, based on the cubic-barrier method for cloth and shell contact.

AndoSim brought a published contact-simulation method into Blender, with a C++ solver, Python bindings and controls for cloth and shell experiments.

Independent implementation and Blender integration. Based on published research and the PPF contact solver.

I worked from the cubic-barrier paper towards a Blender add-on, and that meant joining the numerical solver with the scene data, controls and feedback needed to inspect a simulation as it ran, with the Python layer passing scene information into the native core and bringing simulation state back out.

The core used C++ with Eigen and pybind11, while the Blender layer exposed things like pin constraints, contact settings and debug overlays, with scripted scenes for exploring the solver's behaviour.

There are numerical derivative tests and packaged releases alongside the demonstrations, though the recorded testing separates those checks from the broader integration and end-to-end validation still needed.

The catalogue date follows the first preserved release on 19 October 2025.

The cover is the teaser collage included with the repository, illustrating the published simulation method rather than a separately verified run of my add-on.

Result: A released Blender add-on and simulation codebase, with a native solver, bindings and test scenes. The underlying method and optional PPF backend are credited to their authors.

Date evidence: [first preserved release](https://github.com/Slaymish/AndoSim/releases/tag/v1.0.0).

Cover: original project asset. https://github.com/Slaymish/AndoSim/blob/main/docs/example_images/teaser-image.jpg

[Local preview](http://localhost:4371/work/ando-sim)

## Cowrie Honeypot Analysis

2025-10-04 · October 2025 · research

Security log investigation

Analysed Cowrie honeypot events and produced charts, query tools and reports on authentication, commands and attacker activity.

I used Cowrie honeypot logs to examine the activity behind repeated login attempts, bringing event summaries and campaign-level observations into a pair of reports.

Academic security analysis. Python analysis, visualisation and report preparation.

The starting point was a large collection of honeypot events, and I worked from those records towards views of authentication, session activity and the commands people attempted after gaining access, with the session records providing a way to connect separate events before interpreting their wider pattern.

The analysis code produced summaries and charts for timing, ports, credentials and command use, with separate query tools for looking more closely at the activity behind an aggregate count.

The saved report describes 480,998 events, and the repository preserves both an executive overview and a campaign deep dive, though those figures belong to that captured dataset and not an ongoing monitoring service.

The catalogue date follows the first preserved commit on 4 October 2025.

Result: A completed log-analysis workflow with charts and written reports. The public entry uses aggregate timing output rather than individual attacker addresses or credentials.

Date evidence: [first preserved commit](https://github.com/Slaymish/CYBRAnalysis/commit/81f8d63a31d210aa0251b11398ca5e8bf52bf704) (private repository).

Cover: original project asset. https://github.com/Slaymish/CYBRAnalysis/blob/main/cowrie-log-analysis/notebooks/visualizations/temporal_patterns.png

[Local preview](http://localhost:4371/work/cowrie-honeypot-analysis)

## Pinterest Aesthetic Analysis

2025-08-06 · August 2025 · independent

Image embedding and clustering tool

Built a pipeline for clustering Pinterest images with CLIP embeddings and comparing visual themes between saved runs.

I used image embeddings to look at the themes inside a Pinterest board, grouping similar images and keeping snapshots that could be compared over time.

Independent development. Python, CLIP embeddings and clustering.

I worked with a board as a collection of images, and the embedding step let the clustering operate on visual similarity while keeping the original images and metadata available for checking the groups, with the stored assignments making it possible to return from an abstract cluster to the images inside it.

The pipeline joined collection, embedding, clustering and comparison, with saved assignments and category refinements so a cluster could be inspected instead of accepting the generated label as an explanation by itself.

The checked-in August 2025 summary describes 171 images across three clusters, though that was a snapshot of one collection and not evidence that the same themes would remain stable on a different board.

The catalogue date follows the first preserved commit on 6 August 2025.

Result: An implemented image-analysis pipeline with saved cluster assignments and a dated comparison summary. The cover illustrates the grouping process without reproducing the collected photographs.

Date evidence: [first preserved commit](https://github.com/Slaymish/PinterestBoardEmbedding/commit/f0bd83e2a84ca99da3d31a7536467d8458f40403).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/pinterest-aesthetic-analysis)

## Piano Waveform Visualiser

2025-07-10 · July 2025 · independent

Interactive audio synthesis study

Made an SDL2 piano keyboard that combines selected tones and displays their waveform and frequency information.

I made a small C++ piano visualiser where selecting keys changes both the sound being synthesised and the waveform shown beside the keyboard.

Independent development. C++17, SDL2 and audio synthesis.

I was playing with the relationship between piano frequencies and the shape of their combined signal, and the on-screen keyboard gave the same set of notes a sound and a visible waveform, with the waveform drawn from the combined signal while each selected key still had its own frequency.

SDL2 handled the interface and audio, with key selection and a scale control changing the display as the tones were combined, and hover information showing the individual key frequencies.

The aggregate frequency values are part of this visualisation's calculations, though a combination of notes still contains its separate components and should not be reduced to one physical pitch.

The catalogue date follows the first preserved commit on 10 July 2025.

Result: An interactive keyboard and synthesis experiment with a waveform display. The preserved program supports selected keys and display-scale controls, with MIDI and file input left as future work.

Date evidence: [first preserved commit](https://github.com/Slaymish/PianoVisualiser/commit/ea5282468f451f013bbae7cbb24dfef074165294).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/piano-waveform-visualiser)

## TransitSync

2025-04-05 · April 2025 · independent

Calendar-linked Wellington transit planner

Built a prototype that connects calendar events with Wellington transit routing, with a separate open-source route-planning package.

TransitSync connected Google Calendar locations with Metlink route planning, keeping the travel problem close to the events that made the journey necessary.

Independent prototype development. Python, Flask, Google Calendar and Metlink routing.

I worked on a planner for Wellington journeys that started from calendar events, as an event already had the destination and the time I needed to be there, which gave the routing a useful place to begin, with geocoding and nearby-stop lookup connecting the written address to the transit network behind the journey.

The app retrieved events and used a per-user routing service to connect their locations with transit plans, while the separate Python package handled geocoding, nearby stops and departure information.

The preserved version includes calendar integration and routing work, though the proposed multi-user rollout, scheduled syncing and realtime recalculation should be treated as development plans beyond that prototype.

The catalogue date follows the first preserved commit on 5 April 2025.

Result: A calendar-linked routing prototype and a public Wellington transit package. The implementation is preserved separately from the proposed hosted product and its rollout plans.

Date evidence: [first preserved commit](https://github.com/Slaymish/BusRouter/commit/1979dbc555d05bed3693cd28c9b459ef6e296494) (private repository).

Cover: original project asset. https://github.com/Slaymish/BusRouter/blob/master/logo_name.PNG

[Local preview](http://localhost:4371/work/transit-sync)

## Sentient Environment Explorer

2025-03-10 · March 2025 · independent

Reinforcement-learning simulation

Built a grid-world learning experiment with food, hazards, a neural agent and a live interface for observing its behaviour.

Sentient was an experiment in an agent learning its way through a changing 2D environment, with food and hazards giving its movement a consequence.

Independent experiment development. Python, deep Q-learning and simulation UI.

I built a small world where movement mattered to the agent's survival, with food, harmful objects and a hunger mechanism giving it more to do than simply cross an empty grid, with the environment changing as the agent moved and the reward values shaping which actions the learner would revisit.

The code separates the environment, neural learner and orchestrator, with a GUI for pausing the simulation, changing its speed and observing the behaviour while learning continues.

The repository includes saved checkpoints from training runs, though those show that the learning workflow ran and do not by themselves establish a general improvement in exploration or decision making.

The catalogue date follows the first preserved commit on 10 March 2025.

Result: A visual reinforcement-learning prototype with a running environment, controls and saved model checkpoints. The public cover is a schematic world, not a frame from a recorded run.

Date evidence: [first preserved commit](https://github.com/Slaymish/Sentient/commit/e81d4cdb05d3f92dda3fa3d67e372322b45cc4b0) (private repository).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/sentient-environment-explorer)

## Malware Classifier Backdoors

2025-02-17 · February 2025 · research

Academic classifier robustness study

Investigated backdoor attacks on malware classifiers, preserving the manuscript, experiment comparisons and robustness plots.

This academic study examined how poisoned training data affected malware classifiers, comparing attack success with the clean detection behaviour that still had to be preserved.

Academic research and report. Using and extending an existing backdoor-study implementation.

I worked on malware classification under poisoned training data, where the important comparison involved both whether a trigger changed the prediction and what happened to ordinary detection at the same time, with the clean metric kept beside the attack metric so a change in one could not hide the other.

The manuscript brought together experiments across model choices and poisoning conditions, with plots separating clean performance from attack behaviour and supporting material for the feature and backdoor comparisons.

The preserved work includes an external implementation fork alongside the report, though the numerical claims belong to those recorded experiments and should be read with the dataset and attack assumptions they used.

The catalogue date follows the first preserved commit on 17 February 2025.

Result: An academic manuscript with experiment figures and classifier comparisons. The entry describes the study without claiming a first-of-its-kind result or general immunity to backdoors.

Date evidence: [first preserved commit](https://github.com/Slaymish/MalwareResearchPaper/commit/d527b499bbf8220d9974fb74869a86d4cbcf6a91) (private repository).

Cover: original project asset. https://github.com/Slaymish/MalwareResearchPaper/blob/main/clean_tuned_ASR_comparison.png

[Local preview](http://localhost:4371/work/malware-classifier-backdoors)

## Music Genre Classification

2024-09-16 · September 2024 · research

Academic music-data study

Built a music classification workflow with exploratory plots, preprocessing, model training and saved predictions.

I worked with track-level music data to compare genres through their features, building the preprocessing and training workflow alongside plots of the dataset.

University machine-learning coursework. Data preparation, training and exploratory analysis.

The dataset described ten genres with 5,000 training examples each, and I started by looking at how the available track features were distributed before turning them into inputs for classification, with the exploratory figures kept alongside the preparation code so the transformations could be checked against the data.

The code separates exploratory analysis, preprocessing and training, with plots for features such as energy and danceability and saved validation data and predictions alongside the model workflow.

That separation made it possible to look back at the data transformations and the model output together, though a feature correlation plot describes the dataset and should not be read as a classification result.

The catalogue date follows the first preserved commit on 16 September 2024.

Result: A preserved academic classification workflow with exploratory figures and prediction output. The cover shows feature relationships in the dataset rather than an accuracy claim.

Date evidence: [first preserved commit](https://github.com/Slaymish/Musicical-Genre-Classifier/commit/b0e0d670d42273b8d8c773a437cdca16888a4501).

Cover: original project asset. https://github.com/Slaymish/Musicical-Genre-Classifier/blob/main/images/heatmap.png

[Local preview](http://localhost:4371/work/music-genre-classification)

## Geometry and Shader Study

2024-07-09 · July 2024 · research

Real-time graphics coursework

Worked on generated geometry, lighting and texture techniques in an OpenGL graphics assignment.

I explored how generated geometry and shader inputs meet in a real-time renderer, building the coursework shapes and working through lighting and texture techniques.

University coursework. Geometry and shader implementation within a supplied OpenGL framework.

I started with the shape construction, including latitude-longitude and cube-derived spheres and a torus, where the generated vertices had to line up with the normals and texture coordinates used by the renderer, with the same mesh data feeding the lighting and mapping techniques explored in the later parts of the assignment.

The shader work covered reflection models, texture and normal mapping and shadow mapping, with the assignment notes and saved screenshots keeping the different techniques alongside the source that implemented them.

It was a useful place to see an error in one layer appear in another, as the mesh and shader share enough assumptions that a lighting problem can begin in the geometry.

The catalogue date follows the first preserved commit on 9 July 2024.

Result: A preserved real-time graphics study with geometry code, shader work and screenshots. The example cover is one of the original texture-mapping outputs.

Date evidence: [first preserved commit](https://github.com/Slaymish/CGRA350-Assignment-1/commit/534d456b104492ac8dc1e1b8308756516d12f088).

Cover: original project asset. https://github.com/Slaymish/CGRA350-Assignment-1/blob/main/work/res/results/screenshot_1722679703546.png

[Local preview](http://localhost:4371/work/geometry-shader-study)

## Floor-plan Importer

2024-05-29 · May 2024 · independent

Architectural Blender add-on

Built a Blender importer that turns structured floor-plan data into scene geometry.

This Blender add-on reads floor-plan data and creates the corresponding geometry, keeping the import step close to the modelling tools used to work on the result.

Blender add-on development. Python import and geometry construction in the OpenArchSpecs context.

I worked on bringing structured floor-plan data into Blender, where the useful part of an import is having something that can be edited in the scene after the file has been read, with the structured input supplying the plan information and the add-on doing the scene construction from it.

The Python add-on separates the importer, interface and utility code, with a sample plan and documentation describing the file-import workflow and the generated architectural representation.

The repository links into OpenArchSpecs for distribution, so the entry keeps that project context attached to the importer instead of presenting the file format or surrounding work as something invented here.

The catalogue date follows the first preserved commit on 29 May 2024.

Result: An implemented floor-plan import add-on with sample data and usage documentation. The cover is an explanatory plan-to-geometry diagram, not a captured Blender viewport.

Date evidence: [first preserved commit](https://github.com/Slaymish/blender-addon/commit/81a81ed5adfe46e3530bd850a3c9e03aded2c463).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/floor-plan-importer)

## Path Tracing Study

2024-05-19 · May 2024 · research

C++ rendering coursework

Implemented coursework path-tracing features and a grid-based sampling variant, preserving the source and example renders.

I worked on a C++ path tracer as part of university graphics coursework, exploring how sampling and scene materials showed up in the rendered image.

University coursework. Rendering implementation within a supplied C++ framework.

The renderer made light transport visible a sample at a time, and I worked through the assignment's scene and tracing code while using the rendered images to inspect what the implementation was doing, with the material and light code determining how each traced path contributed to the eventual pixel value.

I completed the listed coursework stages and added a sampling approach that stepped through an image grid, which gave another way to organise the samples alongside the existing random method.

The preserved render uses a small enclosed scene with coloured walls and curved objects, where indirect lighting and material differences can be seen without needing a complicated model to explain them.

The catalogue date follows the first preserved commit on 19 May 2024.

Result: A completed rendering assignment with source and sample images. The additional grid sampling method is recorded separately from the supplied graphics framework.

Date evidence: [first preserved commit](https://github.com/Slaymish/CGRA251_Framework_A4/commit/f55725ef798f1d084fc38cbc3ebf0040bd4e91c2) (private repository).

Cover: original project asset. https://github.com/Slaymish/CGRA251_Framework_A4/blob/main/work/res/samples/challenge_1.png

[Local preview](http://localhost:4371/work/path-tracing-study)

## Boids Simulation

2024-05-12 · May 2024 · research

Interactive flocking coursework

Implemented a boids simulation with force-based movement, obstacles and interactive graphics controls.

This graphics assignment explored flocking through individual movement rules, with boids moving through a shared space and responding to neighbours and obstacles.

University coursework. Boid behaviour and scene work within a supplied graphics framework.

I worked on the force calculation and update steps for the boids, and the movement came from those individual rules being applied across the group as the scene advanced, with obstacles held in the same scene so their effect could be included in those movement updates.

The project held boids, obstacles and scene handling in separate components, with controls for the simulation and several example models so the resulting motion could be inspected from the graphics interface.

The saved images show a large flock inside a bounded volume with obstacles, which is also where the local behaviour becomes easier to see as patterns across the whole group.

The catalogue date follows the first preserved commit on 12 May 2024.

Result: An interactive coursework simulation with preserved source and example screenshots. The cover shows the original scene and its controls.

Date evidence: [first preserved commit](https://github.com/Slaymish/CGRA354_Framework_A3/commit/ffe18e46308396d5abe1a90f7672d56f19348ee8).

Cover: original project asset. https://github.com/Slaymish/CGRA354_Framework_A3/blob/main/images/challenge.png

[Local preview](http://localhost:4371/work/boids-simulation)

## Birthday Gallery

2024-05-04 · May 2024 · independent

Interactive Three.js gallery

Made an interactive birthday gallery with a custom 3D space, photographs, captions and camera movement between artworks.

I made a birthday gallery for my dad, arranging photographs inside a small 3D space that you can move through in the browser.

Independent design and development. Three.js, gallery models and photograph placement.

I made this around family photographs, and the gallery gave them a place in a small modelled space, with a card and captions that could be seen as the camera moved between the artworks, with the photograph positions and camera destinations held together so each move arrived at the next work.

Three.js handled the scene and loaded the gallery models, while the application positioned the photographs and gave the viewer previous and next controls for moving through them.

I kept the navigation tied to the works themselves, as the point was to move from one photograph to the next without needing to learn how to steer around the room.

The catalogue date follows the first preserved commit on 4 May 2024.

Result: A browser-based 3D birthday gallery with custom models and guided camera movement. The public cover illustrates the gallery structure without exposing the family photographs.

Date evidence: [first preserved commit](https://github.com/Slaymish/DadsBirthday/commit/ebf1270c02ce6645fee04b13922f713489f61fb7) (private repository).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/birthday-gallery)

## Spotify Playlist Demographics

2024-03-23 · March 2024 · independent

Playlist metadata exploration

Built a playlist analysis tool that combines artist lookup, biographical text extraction and demographic visualisation.

This experiment started with a Spotify playlist and followed its artists into biographical sources, using extracted metadata to build a view of the collection.

Independent development. Python, Spotify, Wikipedia and language-model extraction.

I worked from the artists in a playlist, with Spotify providing the names and Wikipedia providing biographical text that could be turned into structured fields for the analysis, with the cached artist records making the extraction step reusable when another playlist contained the same names.

The pipeline cached extracted information and used GPT to format uncached biographies, then passed those records into plotting code so the playlist could be examined as a group of artists.

The extraction stage makes this exploratory, as biographies can be incomplete and a model can misread them, so the charts need to stay attached to the sources and missing information behind each field.

The catalogue date follows the first preserved commit on 23 March 2024.

Result: A preserved retrieval, extraction and plotting workflow. Its demographic fields are source-derived estimates, with no claim that every artist was described completely or correctly.

Date evidence: [first preserved commit](https://github.com/Slaymish/Spotify-Demographics-Analyzer/commit/46966803e2b77257e3eee6f11f1eec48daaf2297).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/spotify-playlist-demographics)

## Finlay and Lani's wedding website

2023-10-09 · October 2023 to October 2024 · professional

Wedding information and RSVP website

Built a wedding website with a Vue interface, RSVP validation, Firebase content and an organiser view of responses.

I built Finlay and Lani a wedding website that brought the event information and RSVP process together, with a separate view for managing the responses.

Website development. Vue, Firebase and the RSVP workflow.

The website needed to carry the wedding information and give guests a straightforward way to respond, and I built the Vue version around those two jobs with a separate organiser view, with the guest form and the attending view working on the same response data in Firebase.

Firebase held the content and response data, while the RSVP page handled form validation and the attending view brought the submissions back into the site for administration.

The repository preserves the earlier setup and the later Vue implementation, though the entry covers the resulting website and response workflow as one piece of work.

The catalogue date follows the first preserved commit on 9 October 2023.

Result: A wedding information site with implemented RSVP handling and organiser administration. The preserved project spans the initial 2023 setup and subsequent work in 2024.

Date evidence: [first preserved commit](https://github.com/Slaymish/WeddingWebsite/commit/a37f4acf170970c76a21236c42048a726c2c3264).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/finlay-lani-wedding)

## Parametric Bookshelf

2023-08-30 · August 2023 · independent

Blender geometry nodes asset

Made a parametric bookshelf asset in Blender, with geometry-node controls and a reusable blend file.

A small Blender asset for generating a bookshelf through geometry nodes, keeping the construction in the node graph so the shape can be adjusted without rebuilding it by hand.

Independent modelling and geometry-node work in Blender.

I made this as a reusable Blender asset, with the bookshelf's construction held in a geometry-node graph so changing the inputs could change the object that appeared in the scene, with the reusable file keeping the construction and its controls together when the asset moved between scenes.

The project is the blend file itself, and the repository includes the node setup and instructions for adding it to an asset library, which made it easy to bring into another scene.

It stayed a small modelling tool, though that is also the useful scale for it, as the work sits in how the object is constructed and how much of that construction remains adjustable.

The catalogue date follows the first preserved commit on 30 August 2023.

Result: A reusable parametric blend asset, preserved with its geometry-node setup. The cover is the original node-graph image from the project README.

Date evidence: [first preserved commit](https://github.com/Slaymish/BlenderBookShelf/commit/b901565241e8a8d7f0626f1afe7b346c30b97a82).

Cover: original README example. https://github.com/Slaymish/BlenderBookShelf/assets/21288505/6ca4b8c4-1f14-4815-9217-c554413ac80d

[Local preview](http://localhost:4371/work/parametric-bookshelf)

## Cookie Cat

2023-07-14 · July to August 2023 · independent

Procedural Godot platformer

Made an endless Godot platformer with generated platforms, enemies, collectibles and shops for extra lives and jump upgrades.

Cookie Cat was a university game project, with a player jumping through a generated level while collecting cookies and buying upgrades between encounters.

University coursework. Game logic and integration in Godot, using third-party art assets.

This was an early Godot project for me, and the level kept generating as the player moved, so the main problem was making the next platform reachable while leaving enough variation for the game to keep moving, with enemies and collectibles placed in the same generated space that the player needed to cross.

Cookies, frogs and their projectiles shared the generated space, and the player could spend collected currency on extra lives or jump upgrades when a shop appeared.

Godot's scene and signal model took some getting used to, as objects needed to stay separate enough to reuse while still passing things like collisions, purchases and player state between them.

The catalogue date follows the first preserved commit on 14 July 2023.

Result: A playable coursework platformer with a recorded walkthrough. The generated level, enemy encounters and upgrade shops are part of the preserved game implementation.

Date evidence: [first preserved commit](https://github.com/Slaymish/PlatformerGame/commit/18484592629337adaeb10675aa24641cd6ca0b2b) (private repository).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/cookie-cat)

## 3D Spanning Trees

2023-06-10 · June 2023 · independent

Mesh graph transformation

Built a minimum-spanning-tree tool for OBJ geometry, with a Blender add-on and a packaged Java application.

This takes the vertices and edges of an OBJ file and finds their minimum spanning tree, turning a connected mesh graph into a much sparser structure.

Independent development. Java graph algorithms and a Blender add-on.

I was looking at meshes as graphs, and removing the faces left a useful starting point for finding the smallest collection of edges that still connected all the vertices, with the edge weights determining which connections were kept as the graph became a tree.

The Java implementation used Kruskal's algorithm and a union-find structure to select those edges, then wrote the result back to OBJ so it could be opened in Blender.

I also made a Blender add-on and packaged the Java tool with launch scripts, which gave the same transformation a place inside a modelling workflow as well as a standalone application.

The catalogue date follows the first preserved release on 10 June 2023.

Result: A released geometry utility with OBJ input and output. The example shows the original edge grid alongside two sparse structures produced from it.

Date evidence: [first preserved release](https://github.com/Slaymish/3dSpanningTrees/releases/tag/v0.1.0).

Cover: original README example. https://github.com/Slaymish/3dSpanningTrees/assets/21288505/3c9e87c3-d31d-4b37-8b8e-fd2ac10693fb

[Local preview](http://localhost:4371/work/3d-spanning-trees)

## L-system Generator

2023-05-20 · May 2023 · independent

Procedural geometry tool

Built a JavaFX tool for generating L-system structures, saving their rules and exporting the resulting geometry to Blender.

I made a small L-system editor that turns rewriting rules into branching structures, with an OBJ export so the result can move from JavaFX into Blender.

Independent development. JavaFX, turtle geometry and OBJ export.

Playing with L-systems meant starting with a short string and watching what repeated rewriting would produce, and I put that process into a JavaFX app with controls for the rules, iteration count and angle, with the generated string kept separate from the turtle that turned its instructions into geometry.

The geometry came from a turtle interpreting the generated string, with edges recorded as it moved through the structure and an exporter turning that result into an OBJ file.

I added save and load for the systems themselves, so a useful set of rules could be kept alongside the exported geometry and brought back for another iteration.

The catalogue date follows the first preserved commit on 20 May 2023.

Result: A procedural editor with saved systems and Blender-compatible exports. The preserved examples show the generated structure and the geometry taken into Blender.

Date evidence: [first preserved commit](https://github.com/Slaymish/LSystemGenerator/commit/5e9a598cafb06b891b7112cebfd179b739272cad).

Cover: original README example. https://github.com/Slaymish/LSystemGenerator/assets/21288505/b64e5cae-96dc-4f1d-8349-a6f91cb40059

[Local preview](http://localhost:4371/work/l-system-generator)

## ArticulateAI

2023-05-17 · May 2023 · independent

Recorded voice assistant

Built a recording workflow that transcribed speech with Whisper, generated a GPT response and spoke short replies through ElevenLabs.

ArticulateAI was one of my early voice experiments, recording a chosen amount of audio and passing it through transcription, a prompted response and optional speech output.

Independent development. Python, OpenAI and ElevenLabs APIs.

I was working with voice interfaces in 2023, and this version started with a recording length and a choice of prompt, so the same audio path could be used for a question, lecture notes or a recipe, with the selected prompt changing what happened to the transcript after the recording had finished.

The program recorded from the microphone, sent the audio to Whisper and saved the transcript with a timestamp, then asked GPT for a response using the selected instructions.

Short responses could go on to ElevenLabs for speech, though the implemented loop capped that at fewer than 100 characters, which kept this version close to a recording tool with spoken replies.

The catalogue date follows the first preserved commit on 17 May 2023.

Result: An implemented audio-to-response workflow, including saved transcripts and short spoken replies. It used separate API calls, with the user choosing each recording window.

Date evidence: [first preserved commit](https://github.com/Slaymish/ArticulateAI/commit/8eab06303cdb9c11cee1658dc7c78d3e7b512eea).

Cover: original command menu capture. Slaymish/ArticulateAI run.py, executed to its first prompt with audio/API imports disabled.

[Local preview](http://localhost:4371/work/articulate-ai)

## Wellington Transport Network

2023-04-16 · April 2023 · independent

JavaFX graph analysis coursework

Implemented route search, connected-component analysis and critical-stop detection for a Wellington transport network.

This university project treated Wellington public transport as a graph, using the same network to find routes and inspect the stops that held parts of it together.

University coursework. Graph and algorithm implementation within a supplied JavaFX framework.

I worked from the stops and connections of the Wellington network, and the map gave the graph algorithms something recognisable to operate on, including walking connections within a chosen distance, with the walking edges changing the route graph while the critical-stop analysis used the relevant transport connections.

A* searched for routes between stops, while connected-component and articulation-point work examined a different property of the same graph, identifying separated parts and stops whose removal would break connectivity.

The project included tests and a JavaFX map interface, though the route and structural analyses answer different questions, which is why the results need their own views of the network.

The catalogue date follows the first preserved commit on 16 April 2023.

Result: A coursework implementation of route and network-structure algorithms, with a map interface and tests. The supplied application framework is distinguished from my algorithm work.

Date evidence: [first preserved commit](https://github.com/Slaymish/WellingtonTrainNetwork/commit/9db6fc13bcb22bb1730f8a124d5eb825f5ea9c12) (private repository).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/wellington-transport-network)

## Watzon

2022-06-29 · June to July 2022 · independent

Echo VR Discord bot

Built a Java Discord bot for the OCE Echo VR community, with league lookups, team rankings and server commands.

Watzon brought Echo VR league information into Discord, where the OCE community could ask for team details and rankings without opening another site.

Independent development. Java, JDA and the VR Master League API.

I made Watzon around the Echo VR community, and the interesting part was getting the league's teams, players and matches into a form that made sense inside a Discord conversation, with the command response carrying enough of the team context to be useful inside the server itself.

The bot used JDA for Discord interactions and separate Java objects for league data, with commands that assembled team information and rankings into embeds, and server handling for things like captain roles.

There were earlier packaged versions in WatzonOld, though I treat those as part of the same project, as they follow the same community and the same API integration.

The catalogue date follows the first preserved commit on 29 June 2022.

Result: A domain-specific Discord bot with implemented league commands and team displays. The preserved source also includes the earlier packaged versions of the project.

Date evidence: [first preserved commit](https://github.com/Slaymish/WatzonOld/commit/96a63a37c0472b3d7ab060ccab1c675592c31b4e) (private repository).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/watzon)

## Echo Stats Finder

2021-11-10 · November 2021 · independent

Echo VR player statistics

Built the networking behind a desktop tool for looking up Echo VR players and the league statistics of people in a public match.

I worked on Echo Stats Finder with Silveridge, connecting a Python desktop app to Echo VR and VR Master League so players could look up the people they were playing with.

Project setup, networking, testing and structure. Silveridge built the GUI and navigation.

Working on this meant joining two different views of the same player, as the headset knew who was in the current match while VR Master League held their team and league information, and the app let you search either starting point, with the player name providing the connection between a live match and a separate set of league records.

I handled the requests and player lookups, and Silveridge put those results into a PyQt interface with separate views for league searches and public matches, including more detailed team information.

We packaged Windows releases in November 2021, with connection instructions for both PC and standalone headset users, so the tool could be used outside the development environment.

The catalogue date follows the first preserved release on 10 November 2021.

Result: The project reached downloadable Windows releases, with player and public-match searching implemented. Ignite integration and automatic searching remained separate follow-up work.

Date evidence: [first preserved release](https://github.com/Slaymish/EchoStatsFinder/releases/tag/v1.0.0).

Cover: source-based explanatory diagram. Authored from the project implementation; labels in editorial.json

[Local preview](http://localhost:4371/work/echo-stats-finder)

