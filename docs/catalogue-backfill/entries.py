"""Editorial source for the forty approved work stories. Clean voice, technical prose."""
ENTRIES=[]
def entry(repo,title,slug,descriptor,summary,intro,role,body,result,tags,diagram,alt=None,kind='independent'):
 ENTRIES.append(dict(repo=repo,title=title,slug=slug,descriptor=descriptor,summary=summary,introduction=intro,role=role,paragraphs=body,result=result,tags=tags.split(','),diagram=diagram,coverAlt=alt,kind=kind))

entry('EchoStatsFinder','Echo Stats Finder','echo-stats-finder','Echo VR player statistics',
 'Built the networking behind a desktop tool for looking up Echo VR players and the league statistics of people in a public match.',
 'I worked on Echo Stats Finder with Silveridge, connecting a Python desktop app to Echo VR and VR Master League so players could look up the people they were playing with.',
 'Project setup, networking, testing and structure. Silveridge built the GUI and navigation.',
 ["Working on this meant joining two different views of the same player, as the headset knew who was in the current match while VR Master League held their team and league information. The app let you search either starting point.",
  "I handled the requests and player lookups, and Silveridge put those results into a PyQt interface with separate views for league searches and public matches, including more detailed team information.",
  "We packaged Windows releases in November 2021, with connection instructions for both PC and standalone headset users, so the tool could be used outside the development environment."],
 'The project reached downloadable Windows releases, with player and public-match searching implemented. Ignite integration and automatic searching remained separate follow-up work.',
 'Games,Python,Community tools',['Headset match','Player lookup','League statistics'])

entry('Watzon','Watzon','watzon','Echo VR Discord bot',
 'Built a Java Discord bot for the OCE Echo VR community, with league lookups, team rankings and server commands.',
 'Watzon brought Echo VR league information into Discord, where the OCE community could ask for team details and rankings without opening another site.',
 'Independent development. Java, JDA and the VR Master League API.',
 ["I made Watzon around the Echo VR community, and the interesting part was getting the league's teams, players and matches into a form that made sense inside a Discord conversation.",
  "The bot used JDA for Discord interactions and separate Java objects for league data, with commands that assembled team information and rankings into embeds, and server handling for things like captain roles.",
  "There were earlier packaged versions in WatzonOld, though I treat those as part of the same project, as they follow the same community and the same API integration."],
 'A domain-specific Discord bot with implemented league commands and team displays. The preserved source also includes the earlier packaged versions of the project.',
 'Games,Java,Community tools',['Discord command','VRML API','Team information'])

entry('ArticulateAI','ArticulateAI','articulate-ai','Recorded voice assistant',
 'Built a recording workflow that transcribed speech with Whisper, generated a GPT response and spoke short replies through ElevenLabs.',
 'ArticulateAI was one of my early voice experiments, recording a chosen amount of audio and passing it through transcription, a prompted response and optional speech output.',
 'Independent development. Python, OpenAI and ElevenLabs APIs.',
 ["I was working with voice interfaces in 2023, and this version started with a recording length and a choice of prompt, so the same audio path could be used for a question, lecture notes or a recipe.",
  "The program recorded from the microphone, sent the audio to Whisper and saved the transcript with a timestamp, then asked GPT for a response using the selected instructions.",
  "Short responses could go on to ElevenLabs for speech, though the implemented loop capped that at fewer than 100 characters, which kept this version close to a recording tool with spoken replies."],
 'An implemented audio-to-response workflow, including saved transcripts and short spoken replies. It used separate API calls, with the user choosing each recording window.',
 'AI,Voice,Python',['Record','Transcribe','Reply'],
 'Conceptual illustration of a microphone, transcript, waveform processor and speaker connected by one signal line.')

entry('LSystemGenerator','L-system Generator','l-system-generator','Procedural geometry tool',
 'Built a JavaFX tool for generating L-system structures, saving their rules and exporting the resulting geometry to Blender.',
 'I made a small L-system editor that turns rewriting rules into branching structures, with an OBJ export so the result can move from JavaFX into Blender.',
 'Independent development. JavaFX, turtle geometry and OBJ export.',
 ["Playing with L-systems meant starting with a short string and watching what repeated rewriting would produce, and I put that process into a JavaFX app with controls for the rules, iteration count and angle.",
  "The geometry came from a turtle interpreting the generated string, with edges recorded as it moved through the structure and an exporter turning that result into an OBJ file.",
  "I added save and load for the systems themselves, so a useful set of rules could be kept alongside the exported geometry and brought back for another iteration."],
 'A procedural editor with saved systems and Blender-compatible exports. The preserved examples show the generated structure and the geometry taken into Blender.',
 'Graphics,Java,Blender',['Rules','Turtle geometry','OBJ export'],
 'Original JavaFX screenshot showing the L-system controls beside a dense green branching structure.')

entry('3dSpanningTrees','3D Spanning Trees','3d-spanning-trees','Mesh graph transformation',
 'Built a minimum-spanning-tree tool for OBJ geometry, with a Blender add-on and a packaged Java application.',
 'This takes the vertices and edges of an OBJ file and finds their minimum spanning tree, turning a connected mesh graph into a much sparser structure.',
 'Independent development. Java graph algorithms and a Blender add-on.',
 ["I was looking at meshes as graphs, and removing the faces left a useful starting point for finding the smallest collection of edges that still connected all the vertices.",
  "The Java implementation used Kruskal's algorithm and a union-find structure to select those edges, then wrote the result back to OBJ so it could be opened in Blender.",
  "I also made a Blender add-on and packaged the Java tool with launch scripts, which gave the same transformation a place inside a modelling workflow as well as a standalone application."],
 'A released geometry utility with OBJ input and output. The example shows the original edge grid alongside two sparse structures produced from it.',
 'Graphics,Java,Blender',['OBJ graph','Kruskal','Tree geometry'],
 'Original project render showing a regular mesh edge grid beside two minimum spanning tree structures.')

entry('BlenderBookShelf','Parametric Bookshelf','parametric-bookshelf','Blender geometry nodes asset',
 'Made a parametric bookshelf asset in Blender, with geometry-node controls and a reusable blend file.',
 'A small Blender asset for generating a bookshelf through geometry nodes, keeping the construction in the node graph so the shape can be adjusted without rebuilding it by hand.',
 'Independent modelling and geometry-node work in Blender.',
 ["I made this as a reusable Blender asset, with the bookshelf's construction held in a geometry-node graph so changing the inputs could change the object that appeared in the scene.",
  "The project is the blend file itself, and the repository includes the node setup and instructions for adding it to an asset library, which made it easy to bring into another scene.",
  "It stayed a small modelling tool, though that is also the useful scale for it, as the work sits in how the object is constructed and how much of that construction remains adjustable."],
 'A reusable parametric blend asset, preserved with its geometry-node setup. The cover is the original node-graph image from the project README.',
 'Graphics,Blender,Procedural design',['Parameters','Geometry nodes','Bookshelf'],
 'Original Blender screenshot of the bookshelf geometry-node graph, with connected construction and transformation nodes.')

entry('PlatformerGame','Cookie Cat','cookie-cat','Procedural Godot platformer',
 'Made an endless Godot platformer with generated platforms, enemies, collectibles and shops for extra lives and jump upgrades.',
 'Cookie Cat was a university game project, with a player jumping through a generated level while collecting cookies and buying upgrades between encounters.',
 'University coursework. Game logic and integration in Godot, using third-party art assets.',
 ["This was an early Godot project for me, and the level kept generating as the player moved, so the main problem was making the next platform reachable while leaving enough variation for the game to keep moving.",
  "Cookies, frogs and their projectiles shared the generated space, and the player could spend collected currency on extra lives or jump upgrades when a shop appeared.",
  "Godot's scene and signal model took some getting used to, as objects needed to stay separate enough to reuse while still passing things like collisions, purchases and player state between them."],
 'A playable coursework platformer with a recorded walkthrough. The generated level, enemy encounters and upgrade shops are part of the preserved game implementation.',
 'Games,Godot,Procedural design',['Generated platforms','Cookies and frogs','Upgrade shop'])

entry('WeddingWebsite',"Finlay and Lani's wedding website",'finlay-lani-wedding','Wedding information and RSVP website',
 'Built a wedding website with a Vue interface, RSVP validation, Firebase content and an organiser view of responses.',
 'I built Finlay and Lani a wedding website that brought the event information and RSVP process together, with a separate view for managing the responses.',
 'Website development. Vue, Firebase and the RSVP workflow.',
 ["The website needed to carry the wedding information and give guests a straightforward way to respond, and I built the Vue version around those two jobs with a separate organiser view.",
  "Firebase held the content and response data, while the RSVP page handled form validation and the attending view brought the submissions back into the site for administration.",
  "The repository preserves the earlier setup and the later Vue implementation, though the entry covers the resulting website and response workflow as one piece of work."],
 'A wedding information site with implemented RSVP handling and organiser administration. The preserved project spans the initial 2023 setup and subsequent work in 2024.',
 'Web development,Vue,Firebase',['Wedding information','Guest RSVP','Organiser view'],kind='professional')

entry('DadsBirthday','Birthday Gallery','birthday-gallery','Interactive Three.js gallery',
 'Made an interactive birthday gallery with a custom 3D space, photographs, captions and camera movement between artworks.',
 'I made a birthday gallery for my dad, arranging photographs inside a small 3D space that you can move through in the browser.',
 'Independent design and development. Three.js, gallery models and photograph placement.',
 ["I made this around family photographs, and the gallery gave them a place in a small modelled space, with a card and captions that could be seen as the camera moved between the artworks.",
  "Three.js handled the scene and loaded the gallery models, while the application positioned the photographs and gave the viewer previous and next controls for moving through them.",
  "I kept the navigation tied to the works themselves, as the point was to move from one photograph to the next without needing to learn how to steer around the room."],
 'A browser-based 3D birthday gallery with custom models and guided camera movement. The public cover illustrates the gallery structure without exposing the family photographs.',
 'Graphics,Web development,Three.js',['Gallery model','Photographs','Guided camera'])

entry('BusRouter','TransitSync','transit-sync','Calendar-linked Wellington transit planner',
 'Built a prototype that connects calendar events with Wellington transit routing, with a separate open-source route-planning package.',
 'TransitSync connected Google Calendar locations with Metlink route planning, keeping the travel problem close to the events that made the journey necessary.',
 'Independent prototype development. Python, Flask, Google Calendar and Metlink routing.',
 ["I worked on a planner for Wellington journeys that started from calendar events, as an event already had the destination and the time I needed to be there, which gave the routing a useful place to begin.",
  "The app retrieved events and used a per-user routing service to connect their locations with transit plans, while the separate Python package handled geocoding, nearby stops and departure information.",
  "The preserved version includes calendar integration and routing work, though the proposed multi-user rollout, scheduled syncing and realtime recalculation should be treated as development plans beyond that prototype."],
 'A calendar-linked routing prototype and a public Wellington transit package. The implementation is preserved separately from the proposed hosted product and its rollout plans.',
 'Python,Transport,APIs',['Calendar event','Metlink route','Travel plan'],
 'Original TransitSync project mark, combining a calendar and a bus above the project name.')

entry('AndoSim','AndoSim','ando-sim','Blender cloth and shell simulation',
 'Built a Blender simulation add-on with a C++ core, based on the cubic-barrier method for cloth and shell contact.',
 'AndoSim brought a published contact-simulation method into Blender, with a C++ solver, Python bindings and controls for cloth and shell experiments.',
 'Independent implementation and Blender integration. Based on published research and the PPF contact solver.',
 ["I worked from the cubic-barrier paper towards a Blender add-on, and that meant joining the numerical solver with the scene data, controls and feedback needed to inspect a simulation as it ran.",
  "The core used C++ with Eigen and pybind11, while the Blender layer exposed things like pin constraints, contact settings and debug overlays, with scripted scenes for exploring the solver's behaviour.",
  "There are numerical derivative tests and packaged releases alongside the demonstrations, though the recorded testing separates those checks from the broader integration and end-to-end validation still needed."],
 'A released Blender add-on and simulation codebase, with a native solver, bindings and test scenes. The underlying method and optional PPF backend are credited to their authors.',
 'Graphics,Blender,C++,Simulation',['Blender scene','Contact solver','Viewport playback'],
 'Teaser collage included in the AndoSim repository, showing several cloth and shell simulation scenes.')

entry('BedroomLayoutDesigner','Bedroom Layout Designer','bedroom-layout-designer','Browser-based room planning',
 'Built a room planner with furniture editing, measurements, undo, local saving and printable PDF exports.',
 'Bedroom Layout Designer is a browser tool for trying room arrangements with actual dimensions, keeping furniture, openings and measurements in the same editable plan.',
 'Independent product design and development. React, TypeScript and local workspace storage.',
 ["I made a room planner around the parts that need to agree before a layout is useful, as the room dimensions, furniture and door openings all have to share the same scale.",
  "The workspace supports multiple rooms and measurement units, with placement, rotation and resizing for furniture and openings, and undo and redo across edits so an arrangement can be tried without losing the previous one.",
  "Plans save locally and can be exported as workspace files or PDFs, and I added tests around selection and state handling as those interactions determine whether the drawing stays predictable."],
 'A browser-based planning app with local persistence, offline support and PDF output. The preserved work runs from December 2025 through the interaction updates in February 2026.',
 'Web development,TypeScript,Product design',['Room dimensions','Layout editing','Printable plan'],
 'Screenshot of Bedroom Layout Designer showing the room-planning interface and editable plan.')

entry('PianoImprovisationHelper','Piano Improvisation Helper','piano-improvisation-helper','Browser audio key detection',
 'Built a piano practice tool that searches for songs and estimates their key from available audio previews in the browser.',
 'This small app looks up a song, analyses an available preview and shows the likely key with alternate guesses, giving a starting point for playing along.',
 'Independent development. React, TypeScript, Web Audio and pitch-class analysis.',
 ["I made this around the moment of wanting to play along with a song, and the first version starts with a title and artist search before looking for an audio preview it can analyse.",
  "The detector decodes the preview in the browser and builds a pitch-class histogram across audio frames, then compares that distribution with major and minor key profiles to rank the possible keys.",
  "The UI keeps alternate guesses visible and lets the analysis run for longer, though microphone-based song recognition is still a placeholder in this version and the implemented path starts with manual search."],
 'A working search and preview-analysis interface with in-browser key detection and service tests. Results are estimates from the available clip, with alternate candidates shown.',
 'Music,TypeScript,Audio',['Song preview','Pitch classes','Key candidates'],
 'Screenshot of Piano Improvisation Helper with its song search and preview-analysis interface.')

entry('Synod','Synod','synod','Obsidian journal analysis plugin',
 'Built an Obsidian plugin that reads journal entries through separate value agents and compiles their unresolved tensions into a bulletin.',
 'Synod reads a period of journal entries through separate agents for the values found in them, then brings their disagreements back into the vault as a bulletin.',
 'Independent plugin design and development. TypeScript, Obsidian and configurable language-model backends.',
 ["I built Synod around a journal being read from several positions at once, with each agent holding one value and the compiler looking at where their readings pulled in different directions.",
  "The plugin imports entries from folders or supported journal exports, extracts candidate values and lets those values guide the analysis, with the resulting bulletin written back into the vault.",
  "Ollama is the default backend, though the settings also support compatible remote endpoints, so where the journal text goes depends on the connection the user chooses for the plugin."],
 'A released Obsidian plugin with importers, value discovery and a bulletin pipeline. It offers competing readings of journal entries without presenting them as clinical advice.',
 'AI,Obsidian,TypeScript',['Journal entries','Value agents','Bulletin'],
 'Conceptual illustration of several connected stone forms around an open notebook, representing different value agents reading one journal.')

entry('Lumen','Lumen','lumen','Local Obsidian research plugin',
 'Built a local research system for Obsidian, with related-note surfacing, retrieval, report generation and checks against source blocks.',
 'Lumen connects an Obsidian vault to a local research backend, surfacing related notes and assembling reports whose citations are checked against the vault.',
 'Independent plugin and backend development. TypeScript, Python and local model inference.',
 ["I worked on Lumen as a way of finding material already sitting in a vault, and the same retrieval system could surface related notes during ordinary writing or feed a longer research request.",
  "The Obsidian plugin talked to a Python orchestrator, with separate packages for ingestion, retrieval, inference and memory, while a local model produced the research output and streamed progress back to the interface.",
  "Citation handling checked references against actual note blocks, and the project included evaluation and release tooling, though a valid source reference still needs to be read alongside the claim it is attached to."],
 'A released local research plugin and backend, with note surfacing, report generation and source-block checks. GitHub preserves the plugin packages and evaluation code.',
 'AI,Obsidian,Python',['Vault notes','Local retrieval','Research report'],
 'Conceptual illustration of connected note cards beside a notebook, with one card illuminated to represent retrieving a forgotten connection.')

entry('Otto','Otto','otto','Native Mac voice assistant',
 'Developed a native Swift version of a Mac voice assistant, with hotkeys, capability retrieval, session logs and local retrospective learning.',
 'Otto is a voice and text assistant for the Mac. I developed it from the voice-os project, moving the app into Swift and adding capability and session-learning work.',
 'Development of a fork of per-simmons/voice-os. Swift migration, interface and learning integration.',
 ["I started from voice-os and worked towards a native Mac app, with the voice connection, action handling and interface held in Swift instead of relying on the earlier Python process.",
  "The app kept a capability index and session logs, and retrospective processing could add useful phrasings or proposed capabilities from a completed session, with a local Ollama option for that learning step.",
  "Hotkeys, onboarding and settings made it usable as a menu-bar application, and the June releases packaged the Swift app alongside tests for the capability and session components."],
 'Packaged Mac releases with a native Swift implementation and session-based capability work. The entry credits the upstream project and distinguishes my changes from its starting point.',
 'AI,Voice,Swift,macOS',['Voice request','Capability retrieval','Mac action'],
 'Conceptual illustration of Otto, with a microphone, blue voice waveform, capability cards, desktop windows and a stack of session notes.')

entry('grid-diffusion-ad','Grid Diffusion AD','grid-diffusion-ad','Diffusion-based fault detection study',
 'Investigated diffusion models for fault detection in power-system signals, with normal-only training and explicit false-alarm evaluation.',
 'I studied whether diffusion models trained on normal magnetic-field signals could identify electrical faults, separating reconstruction quality from the detection behaviour needed in a monitoring system.',
 'Academic research. Model implementation, experiments, evaluation and report.',
 ["The data was repetitive and multi-channel, and I worked on learning its normal structure with diffusion models before using reconstruction and denoising scores to look for fault-related departures.",
  "The pipeline included quantisation, categorical denoising and several scoring variants, with experiments comparing model settings and threshold calibration using normal data, as fault labels should not silently become part of the calibration process.",
  "The report found that good reconstruction did not consistently produce useful detection, and the evaluated operating points still had high false-alarm rates, which made the deployment assumptions part of the result."],
 'A completed implementation and evaluation study with recorded experiments and a report. The findings limit the detector claims, particularly under normal-only threshold calibration.',
 'AI,Machine learning,Research,Time series',['Normal signals','Diffusion model','Fault scoring'],
 'Original experiment plot comparing four channels of signal data with their reconstructed waveforms.',kind='research')

entry('conversational-timing-lab','Conversational Timing Lab','conversational-timing-lab','Speech turn-taking experiments',
 'Built a speech-timing dataset and baseline evaluation to study turn completion and response onset in real conversations.',
 'I investigated when a speaker has actually finished, keeping turn completion separate from the timing of the next response and testing pause-based assumptions against recorded conversations.',
 'Independent research. Dataset adapters, causal labels, baseline evaluation and audio-model pipeline.',
 ["I started with the difference between somebody finishing a thought and somebody pausing inside it, as both can leave the same silence while asking very different things of a voice assistant.",
  "The dataset labels came from who spoke next, with observations limited to what was available at that moment, and the baseline evaluation used conversation-level splits to keep meetings from leaking across training and validation.",
  "The recorded baseline run covered 100,004 boundaries from 171 AMI meetings, though the small audio-model run was only an end-to-end pipeline check and did not establish a useful trained predictor."],
 'A reproducible baseline investigation and audio-training pipeline. Pause duration offered limited separation on the recorded meeting data, with the corpus and interruption-budget caveats retained.',
 'Voice,Machine learning,Research',['Observed pause','Turn completion','Response onset'],kind='research')

entry('commit-reviewer','Typed Diff Questions','typed-diff-questions','Code-review model experiments',
 'Built an experiment harness comparing models on narrow questions about code diffs, with calibration and class-balanced evaluation.',
 'I tested whether small, typed questions about a changed hunk gave a useful basis for code review, comparing model agreement while keeping the eventual reviewer separate from the experiment.',
 'Independent research. Corpus sampling, model scoring, calibration and evaluation.',
 ["I worked on the question bank before building the reviewer, as a model answering a narrow question about a diff gives something that can be compared across runs without treating the whole review as one judgement.",
  "The harness sampled code hunks and compared Jev and Haiku with an Opus reference, with repeated scores, class-balanced measures and an always-negative baseline to expose how much the label distribution could inflate apparent agreement.",
  "The findings changed between repositories, and the reference was still another model, so the experiment measured agreement under those conditions without establishing that a developer would accept the findings as real bugs."],
 'Three recorded scoring runs and a reusable experiment harness. Human bug labels and the proposed reviewer interface remain outside the conclusions established by this work.',
 'AI,Developer tools,Research',['Changed hunk','Typed questions','Calibrated scores'],kind='research')

entry('MalwareResearchPaper','Malware Classifier Backdoors','malware-classifier-backdoors','Academic classifier robustness study',
 'Investigated backdoor attacks on malware classifiers, preserving the manuscript, experiment comparisons and robustness plots.',
 'This academic study examined how poisoned training data affected malware classifiers, comparing attack success with the clean detection behaviour that still had to be preserved.',
 'Academic research and report. Using and extending an existing backdoor-study implementation.',
 ["I worked on malware classification under poisoned training data, where the important comparison involved both whether a trigger changed the prediction and what happened to ordinary detection at the same time.",
  "The manuscript brought together experiments across model choices and poisoning conditions, with plots separating clean performance from attack behaviour and supporting material for the feature and backdoor comparisons.",
  "The preserved work includes an external implementation fork alongside the report, though the numerical claims belong to those recorded experiments and should be read with the dataset and attack assumptions they used."],
 'An academic manuscript with experiment figures and classifier comparisons. The entry describes the study without claiming a first-of-its-kind result or general immunity to backdoors.',
 'Security,Machine learning,Research',['Poisoned training','Classifier models','Attack and clean metrics'],
 'Original study plot comparing attack success rates across models and poisoning ratios.',kind='research')

entry('CYBRAnalysis','Cowrie Honeypot Analysis','cowrie-honeypot-analysis','Security log investigation',
 'Analysed Cowrie honeypot events and produced charts, query tools and reports on authentication, commands and attacker activity.',
 'I used Cowrie honeypot logs to examine the activity behind repeated login attempts, bringing event summaries and campaign-level observations into a pair of reports.',
 'Academic security analysis. Python analysis, visualisation and report preparation.',
 ["The starting point was a large collection of honeypot events, and I worked from those records towards views of authentication, session activity and the commands people attempted after gaining access.",
  "The analysis code produced summaries and charts for timing, ports, credentials and command use, with separate query tools for looking more closely at the activity behind an aggregate count.",
  "The saved report describes 480,998 events, and the repository preserves both an executive overview and a campaign deep dive, though those figures belong to that captured dataset and not an ongoing monitoring service."],
 'A completed log-analysis workflow with charts and written reports. The public entry uses aggregate timing output rather than individual attacker addresses or credentials.',
 'Security,Python,Research',['Honeypot events','Session analysis','Campaign report'],
 'Original aggregate charts showing honeypot activity by hour of day and day of week.',kind='research')

entry('Musicical-Genre-Classifier','Music Genre Classification','music-genre-classification','Academic music-data study',
 'Built a music classification workflow with exploratory plots, preprocessing, model training and saved predictions.',
 'I worked with track-level music data to compare genres through their features, building the preprocessing and training workflow alongside plots of the dataset.',
 'University machine-learning coursework. Data preparation, training and exploratory analysis.',
 ["The dataset described ten genres with 5,000 training examples each, and I started by looking at how the available track features were distributed before turning them into inputs for classification.",
  "The code separates exploratory analysis, preprocessing and training, with plots for features such as energy and danceability and saved validation data and predictions alongside the model workflow.",
  "That separation made it possible to look back at the data transformations and the model output together, though a feature correlation plot describes the dataset and should not be read as a classification result."],
 'A preserved academic classification workflow with exploratory figures and prediction output. The cover shows feature relationships in the dataset rather than an accuracy claim.',
 'Music,Machine learning,Research',['Track features','Preprocessing','Genre classification'],
 'Original correlation heatmap of the music dataset features, including energy, loudness and danceability.',kind='research')

entry('WellingtonTrainNetwork','Wellington Transport Network','wellington-transport-network','JavaFX graph analysis coursework',
 'Implemented route search, connected-component analysis and critical-stop detection for a Wellington transport network.',
 'This university project treated Wellington public transport as a graph, using the same network to find routes and inspect the stops that held parts of it together.',
 'University coursework. Graph and algorithm implementation within a supplied JavaFX framework.',
 ["I worked from the stops and connections of the Wellington network, and the map gave the graph algorithms something recognisable to operate on, including walking connections within a chosen distance.",
  "A* searched for routes between stops, while connected-component and articulation-point work examined a different property of the same graph, identifying separated parts and stops whose removal would break connectivity.",
  "The project included tests and a JavaFX map interface, though the route and structural analyses answer different questions, which is why the results need their own views of the network."],
 'A coursework implementation of route and network-structure algorithms, with a map interface and tests. The supplied application framework is distinguished from my algorithm work.',
 'Java,Transport,Algorithms',['Transport graph','A* search','Critical stops'])

entry('CGRA251_Framework_A4','Path Tracing Study','path-tracing-study','C++ rendering coursework',
 'Implemented coursework path-tracing features and a grid-based sampling variant, preserving the source and example renders.',
 'I worked on a C++ path tracer as part of university graphics coursework, exploring how sampling and scene materials showed up in the rendered image.',
 'University coursework. Rendering implementation within a supplied C++ framework.',
 ["The renderer made light transport visible a sample at a time, and I worked through the assignment's scene and tracing code while using the rendered images to inspect what the implementation was doing.",
  "I completed the listed coursework stages and added a sampling approach that stepped through an image grid, which gave another way to organise the samples alongside the existing random method.",
  "The preserved render uses a small enclosed scene with coloured walls and curved objects, where indirect lighting and material differences can be seen without needing a complicated model to explain them."],
 'A completed rendering assignment with source and sample images. The additional grid sampling method is recorded separately from the supplied graphics framework.',
 'Graphics,C++,Rendering',['Scene geometry','Path samples','Rendered light'],
 'Original path-traced scene with coloured walls and several spheres, showing noisy indirect illumination.',kind='research')

entry('CGRA354_Framework_A3','Boids Simulation','boids-simulation','Interactive flocking coursework',
 'Implemented a boids simulation with force-based movement, obstacles and interactive graphics controls.',
 'This graphics assignment explored flocking through individual movement rules, with boids moving through a shared space and responding to neighbours and obstacles.',
 'University coursework. Boid behaviour and scene work within a supplied graphics framework.',
 ["I worked on the force calculation and update steps for the boids, and the movement came from those individual rules being applied across the group as the scene advanced.",
  "The project held boids, obstacles and scene handling in separate components, with controls for the simulation and several example models so the resulting motion could be inspected from the graphics interface.",
  "The saved images show a large flock inside a bounded volume with obstacles, which is also where the local behaviour becomes easier to see as patterns across the whole group."],
 'An interactive coursework simulation with preserved source and example screenshots. The cover shows the original scene and its controls.',
 'Graphics,C++,Simulation',['Local forces','Neighbour response','Flock movement'],
 'Original boids simulation screenshot showing a green flock in a bounded space, red obstacles and a control panel.',kind='research')

entry('CGRA350-Assignment-1','Geometry and Shader Study','geometry-shader-study','Real-time graphics coursework',
 'Worked on generated geometry, lighting and texture techniques in an OpenGL graphics assignment.',
 'I explored how generated geometry and shader inputs meet in a real-time renderer, building the coursework shapes and working through lighting and texture techniques.',
 'University coursework. Geometry and shader implementation within a supplied OpenGL framework.',
 ["I started with the shape construction, including latitude-longitude and cube-derived spheres and a torus, where the generated vertices had to line up with the normals and texture coordinates used by the renderer.",
  "The shader work covered reflection models, texture and normal mapping and shadow mapping, with the assignment notes and saved screenshots keeping the different techniques alongside the source that implemented them.",
  "It was a useful place to see an error in one layer appear in another, as the mesh and shader share enough assumptions that a lighting problem can begin in the geometry."],
 'A preserved real-time graphics study with geometry code, shader work and screenshots. The example cover is one of the original texture-mapping outputs.',
 'Graphics,C++,Rendering',['Generated mesh','Shader inputs','Lit geometry'],
 'Original renderer screenshot of a red and black checker-textured cube against a plain background.',kind='research')

entry('blender-addon','Floor-plan Importer','floor-plan-importer','Architectural Blender add-on',
 'Built a Blender importer that turns structured floor-plan data into scene geometry.',
 'This Blender add-on reads floor-plan data and creates the corresponding geometry, keeping the import step close to the modelling tools used to work on the result.',
 'Blender add-on development. Python import and geometry construction in the OpenArchSpecs context.',
 ["I worked on bringing structured floor-plan data into Blender, where the useful part of an import is having something that can be edited in the scene after the file has been read.",
  "The Python add-on separates the importer, interface and utility code, with a sample plan and documentation describing the file-import workflow and the generated architectural representation.",
  "The repository links into OpenArchSpecs for distribution, so the entry keeps that project context attached to the importer instead of presenting the file format or surrounding work as something invented here."],
 'An implemented floor-plan import add-on with sample data and usage documentation. The cover is an explanatory plan-to-geometry diagram, not a captured Blender viewport.',
 'Graphics,Blender,Python',['Floor-plan data','Geometry construction','Blender scene'])

entry('PianoVisualiser','Piano Waveform Visualiser','piano-waveform-visualiser','Interactive audio synthesis study',
 'Made an SDL2 piano keyboard that combines selected tones and displays their waveform and frequency information.',
 'I made a small C++ piano visualiser where selecting keys changes both the sound being synthesised and the waveform shown beside the keyboard.',
 'Independent development. C++17, SDL2 and audio synthesis.',
 ["I was playing with the relationship between piano frequencies and the shape of their combined signal, and the on-screen keyboard gave the same set of notes a sound and a visible waveform.",
  "SDL2 handled the interface and audio, with key selection and a scale control changing the display as the tones were combined, and hover information showing the individual key frequencies.",
  "The aggregate frequency values are part of this visualisation's calculations, though a combination of notes still contains its separate components and should not be reduced to one physical pitch."],
 'An interactive keyboard and synthesis experiment with a waveform display. The preserved program supports selected keys and display-scale controls, with MIDI and file input left as future work.',
 'Music,C++,Audio',['Selected keys','Summed tones','Waveform display'])

entry('GrooveBox','GrooveBox','groovebox','Keyboard-controlled beat sequencer',
 'Built a desktop groovebox with sample playback, editable patterns and a Python sequencer backed by audio-engine experiments.',
 'GrooveBox is a small beat-sketching tool, using the computer keyboard to play samples and record patterns that can be changed while the sequencer runs.',
 'Independent development. Python, Pygame and C++ audio-engine work.',
 ["I built the sequencer around playing a pad and keeping that action in a pattern, so the keyboard could serve as the input while a running loop kept the timing visible.",
  "The code includes quantised recording and pattern switching, with track-length changes, rotation and Euclidean-fill functions sitting alongside the playback state and audio backends.",
  "The repository also has scene and persistence functions beyond the older README checklist, though the proposed physical controller stayed a separate direction from the desktop instrument implemented here."],
 'A desktop sequencing prototype with sample audio, pattern editing and playback code. The cover diagrams the implemented loop without pretending to be a hardware product photograph.',
 'Music,Python,Audio',['Pad input','Pattern sequencer','Sample playback'])

entry('PinterestBoardEmbedding','Pinterest Aesthetic Analysis','pinterest-aesthetic-analysis','Image embedding and clustering tool',
 'Built a pipeline for clustering Pinterest images with CLIP embeddings and comparing visual themes between saved runs.',
 'I used image embeddings to look at the themes inside a Pinterest board, grouping similar images and keeping snapshots that could be compared over time.',
 'Independent development. Python, CLIP embeddings and clustering.',
 ["I worked with a board as a collection of images, and the embedding step let the clustering operate on visual similarity while keeping the original images and metadata available for checking the groups.",
  "The pipeline joined collection, embedding, clustering and comparison, with saved assignments and category refinements so a cluster could be inspected instead of accepting the generated label as an explanation by itself.",
  "The checked-in August 2025 summary describes 171 images across three clusters, though that was a snapshot of one collection and not evidence that the same themes would remain stable on a different board."],
 'An implemented image-analysis pipeline with saved cluster assignments and a dated comparison summary. The cover illustrates the grouping process without reproducing the collected photographs.',
 'AI,Python,Computer vision',['Board images','CLIP embeddings','Visual clusters'])

entry('Spotify-Demographics-Analyzer','Spotify Playlist Demographics','spotify-playlist-demographics','Playlist metadata exploration',
 'Built a playlist analysis tool that combines artist lookup, biographical text extraction and demographic visualisation.',
 'This experiment started with a Spotify playlist and followed its artists into biographical sources, using extracted metadata to build a view of the collection.',
 'Independent development. Python, Spotify, Wikipedia and language-model extraction.',
 ["I worked from the artists in a playlist, with Spotify providing the names and Wikipedia providing biographical text that could be turned into structured fields for the analysis.",
  "The pipeline cached extracted information and used GPT to format uncached biographies, then passed those records into plotting code so the playlist could be examined as a group of artists.",
  "The extraction stage makes this exploratory, as biographies can be incomplete and a model can misread them, so the charts need to stay attached to the sources and missing information behind each field."],
 'A preserved retrieval, extraction and plotting workflow. Its demographic fields are source-derived estimates, with no claim that every artist was described completely or correctly.',
 'Music,Python,APIs',['Playlist artists','Biography extraction','Aggregate view'])

entry('akahu-sheets-sync','Bank-to-Sheets Sync','bank-to-sheets-sync','Personal banking data pipeline',
 'Built an Akahu-to-Google-Sheets sync with transaction categorisation, deduplication and balance reconciliation.',
 'I made a small banking pipeline that keeps settled transactions in Google Sheets, leaving the budget calculations in the sheet and handling the recurring sync in Python.',
 'Independent development. Python, Akahu and Google Sheets.',
 ["I worked on getting the transaction data into a sheet reliably, as the formulas already had somewhere to live and the recurring job was to keep their underlying ledger up to date.",
  "The sync used stable transaction IDs and stored its progress between runs, with configurable category rules and transfer detection applied before batched writes to the sheet.",
  "Reconciliation compared the available balance information with the recorded data, while settled transactions avoided some of the mutability that makes pending entries awkward to keep in a repeatable ledger."],
 'An implemented personal banking sync with focused tests for state, categorisation and reconciliation. It is a precursor to the later finance projects, with sample data used for public illustration.',
 'Python,Finance,Automation',['Settled transactions','Categorise and reconcile','Google Sheets'])

entry('metlink-departures-display','Metlink Departures Display','metlink-departures-display','Glanceable home bus sign',
 'Made a web and command-line display for upcoming Wellington bus departures, with a small service setup for home use.',
 'A small departures sign for Wellington buses, built to put the next arrivals somewhere glanceable instead of repeating the same stop lookup.',
 'Independent development. Python, Metlink departures and a home service.',
 ["I made this around a bus stop and its next departures, keeping the display small enough to be useful at home while the same lookup could also be read from the command line.",
  "The Python code includes the departure retrieval and a web sign server, with an example systemd service for keeping that display available without starting it by hand each time.",
  "The configured stop and API connection determine the actual arrivals, so the illustration uses the display's structure without presenting made-up minutes as a live service reading."],
 'A compact web and CLI departure display with documented setup. The cover explains the sign format, with no live arrival data implied.',
 'Python,Transport,Automation',['Configured stop','Metlink departures','Home display'])

entry('PowerCalculator','Flat Power Calculator','flat-power-calculator','Household electricity split tool',
 'Built a small web tool for calculating and communicating the flat electricity-bill split, with a Home Assistant integration module.',
 'I made a small calculator for the flat power bill, keeping the calculation and the message about what each person owes close to the same inputs.',
 'Independent development. TypeScript calculation, formatting and Home Assistant integration.',
 ["The project started with the monthly power bill for the flat, and I kept the calculation separate from its formatting so the amount shown in the interface could also be used when communicating the split.",
  "The TypeScript modules separate the split calculation, display formatting and Home Assistant access, with a browser interface for entering the relevant figures and working through the result.",
  "It stayed a small household tool, though that scale made the rule easier to inspect, as there was one bill and a particular sharing arrangement behind the numbers."],
 'An implemented household calculation tool with a clear separation between inputs, split logic and output formatting. The cover shows the workflow using no personal bill amounts.',
 'TypeScript,Finance,Automation',['Power bill','Household split','Amounts to share'])

entry('YayMinecraftServer','Wake-on-Join Minecraft','wake-on-join-minecraft','On-demand AWS game server',
 'Built an AWS Minecraft setup that sleeps when idle and wakes when somebody tries to join, with infrastructure templates and a runbook.',
 'I put together a Minecraft server for friends that can sleep while nobody is playing, with the join attempt acting as the signal to bring it back.',
 'Independent infrastructure development. Paper, AWS templates and server operations tooling.',
 ["The server was for a small group, and keeping a machine running all the time was a different problem from making it available when somebody actually wanted to play.",
  "The project separated the wake path from the game instance, with infrastructure templates, a control script and operating notes describing how the server starts and how idle periods are handled.",
  "The join-triggered approach kept the familiar Minecraft connection as the entry point, though waking an instance still has a startup period before the game server becomes ready."],
 'An on-demand Paper server architecture with deployment templates and a runbook. The entry describes the wake and idle behaviour without claiming instant startup or a measured cost saving.',
 'Cloud infrastructure,Games,Automation',['Join attempt','Wake instance','Paper server'])

entry('Sentient','Sentient Environment Explorer','sentient-environment-explorer','Reinforcement-learning simulation',
 'Built a grid-world learning experiment with food, hazards, a neural agent and a live interface for observing its behaviour.',
 'Sentient was an experiment in an agent learning its way through a changing 2D environment, with food and hazards giving its movement a consequence.',
 'Independent experiment development. Python, deep Q-learning and simulation UI.',
 ["I built a small world where movement mattered to the agent's survival, with food, harmful objects and a hunger mechanism giving it more to do than simply cross an empty grid.",
  "The code separates the environment, neural learner and orchestrator, with a GUI for pausing the simulation, changing its speed and observing the behaviour while learning continues.",
  "The repository includes saved checkpoints from training runs, though those show that the learning workflow ran and do not by themselves establish a general improvement in exploration or decision making."],
 'A visual reinforcement-learning prototype with a running environment, controls and saved model checkpoints. The public cover is a schematic world, not a frame from a recorded run.',
 'Machine learning,Python,Simulation',['Environment','Agent action','Reward and replay'])

entry('dropeta','DropETA','drop-eta','Delivery-route planning prototype',
 'Built a delivery planner with address lookup, stop ordering, ETA calculations and previews of where a new stop fits.',
 'DropETA is a prototype for arranging a changing list of deliveries, using route durations to work through stop order and the arrival times that follow from it.',
 'Independent prototype development. TypeScript, routing services and browser UI.',
 ["I worked on the point where a new delivery changes an existing route, as adding an address is easy but the useful part is seeing what it does to the stops that were already planned.",
  "The implementation has duration-matrix and route services, with stop-order evaluation, recalculated arrivals and an insertion preview that tests where another stop can fit in the current plan.",
  "The interface ties those operations to a map and a stop list, though live position access and the configured routing services are still conditions for the corresponding ETA behaviour."],
 'An implemented route-planning prototype with browser UI and stop-insertion logic. The captured interface shows the initial state, without implying a completed commercial rollout.',
 'TypeScript,Transport,Product design',['Delivery stops','Order and insert','Arrival estimates'],
 'Screenshot of the DropETA delivery-planning interface with the map hidden and the initial stop-list state.')

entry('HamishStyler','HamishStyler','hamish-styler','Personal writing-style tooling',
 'Built writing-style scoring and preference tools, with a classifier, constrained suggestions, interaction logging and retraining scripts.',
 'I worked on a writing tool that could score style separately from the subject being written about, with preferences collected through an interactive workflow.',
 'Independent development. Python style modelling, CLI and preference collection.',
 ["I started with the problem of a piece sounding like its writer even when the topic changed, and the model work used contrasting examples to give the scoring something more specific than a general instruction to imitate a voice.",
  "The tools include style features, candidate reranking and constraints, with an interactive mode that logs preferences and scripts for using those labelled examples in another training pass.",
  "The repository contains the classifier and training workflow, though the existence of a retraining loop is separate from showing that later suggestions actually improve on the earlier model."],
 'An implemented personal style-scoring and feedback toolkit. The entry covers the available workflow without claiming a measured improvement from continued use.',
 'AI,Python,Writing tools',['Style examples','Classifier and reranker','Preference feedback'])

entry('alphero-voice','Alphero Voice Skill','alphero-voice-skill','Reusable editorial style workflow',
 'Made a reusable writing skill from an Alphero Intelligence article corpus and an extracted editorial style guide.',
 'I put together a writing skill for the Alphero Intelligence register, keeping the article references and the style guide beside the procedure that uses them.',
 'Independent tooling. Corpus preparation, style-guide extraction and skill instructions.',
 ["I worked from published Alphero Intelligence articles, and the useful part was keeping the style observations close to the references so the rewriting process had something more concrete than a few tone adjectives.",
  "The skill includes the procedure, a style guide and the reference corpus, with the same materials available when a draft is being written or revised for that editorial register.",
  "It is an instruction and reference workflow, though that is a different mechanism from training a model, and the result still needs an editor to judge whether the piece belongs in the publication."],
 'A reusable editorial skill with source references and an explicit writing procedure. The public cover explains that process without reproducing the article corpus.',
 'AI,Writing tools,Developer tools',['Published articles','Style guide','Draft revision'])

entry('personal-language-corpus','Personal Language Corpus','personal-language-corpus','Local language-analysis workflow',
 'Built a local workflow for importing language samples with provenance and comparing quantitative features with source-linked observations.',
 'This workflow brings transcripts and exports into one small corpus, keeping passage IDs and source information attached to the analysis so a pattern can be checked against the words behind it.',
 'Independent development. Python importers, provenance and analysis workflow.',
 ["I worked on the structure of the corpus before its interpretation, as a useful observation about language needs a way back to the passage and the source that produced it.",
  "The importers handle supported transcripts and exports, with stable passage IDs and role information carried into quantitative features, baseline comparisons and the qualitative workflow.",
  "The repository includes sample inputs and workflow tests, which make it possible to try the pipeline without bringing a private conversation history into the demonstration."],
 'A local, testable corpus workflow with provenance and sample data. It keeps the underlying passages inspectable while separating numerical features from qualitative interpretations.',
 'Python,Writing tools,Research',['Source passages','Features and baselines','Linked observations'])

# Accretive technical clauses retain the longer sentence shape of the clean
# voice guide without adding unsupported personal history or product claims.
CLAUSES={
 'EchoStatsFinder':'with the player name providing the connection between a live match and a separate set of league records',
 'Watzon':'with the command response carrying enough of the team context to be useful inside the server itself',
 'ArticulateAI':'with the selected prompt changing what happened to the transcript after the recording had finished',
 'LSystemGenerator':'with the generated string kept separate from the turtle that turned its instructions into geometry',
 '3dSpanningTrees':'with the edge weights determining which connections were kept as the graph became a tree',
 'BlenderBookShelf':'with the reusable file keeping the construction and its controls together when the asset moved between scenes',
 'PlatformerGame':'with enemies and collectibles placed in the same generated space that the player needed to cross',
 'WeddingWebsite':'with the guest form and the attending view working on the same response data in Firebase',
 'DadsBirthday':'with the photograph positions and camera destinations held together so each move arrived at the next work',
 'BusRouter':'with geocoding and nearby-stop lookup connecting the written address to the transit network behind the journey',
 'AndoSim':'with the Python layer passing scene information into the native core and bringing simulation state back out',
 'BedroomLayoutDesigner':'with the plan keeping those measurements in shared workspace state as each object was moved or resized',
 'PianoImprovisationHelper':'with the preview providing the audio material and the manual search keeping the initial interaction straightforward',
 'Synod':'with each reading kept separate until the compiler had the different reports available to compare against each other',
 'Lumen':'with the original note blocks kept available as sources when related material was assembled into a report',
 'Otto':'with the native engine holding the connection and action state that the interface needed to show',
 'grid-diffusion-ad':'with each score needing to be tested against the normal variation that the model had already seen',
 'conversational-timing-lab':'with the next speaker supplying the label while the observed silence remained an input available at the time',
 'commit-reviewer':'with each question producing a score that could be calibrated and compared with a simple baseline',
 'MalwareResearchPaper':'with the clean metric kept beside the attack metric so a change in one could not hide the other',
 'CYBRAnalysis':'with the session records providing a way to connect separate events before interpreting their wider pattern',
 'Musicical-Genre-Classifier':'with the exploratory figures kept alongside the preparation code so the transformations could be checked against the data',
 'WellingtonTrainNetwork':'with the walking edges changing the route graph while the critical-stop analysis used the relevant transport connections',
 'CGRA251_Framework_A4':'with the material and light code determining how each traced path contributed to the eventual pixel value',
 'CGRA354_Framework_A3':'with obstacles held in the same scene so their effect could be included in those movement updates',
 'CGRA350-Assignment-1':'with the same mesh data feeding the lighting and mapping techniques explored in the later parts of the assignment',
 'blender-addon':'with the structured input supplying the plan information and the add-on doing the scene construction from it',
 'PianoVisualiser':'with the waveform drawn from the combined signal while each selected key still had its own frequency',
 'GrooveBox':'with sample playback and pattern state kept separate enough for the same sequencer to use different audio backends',
 'PinterestBoardEmbedding':'with the stored assignments making it possible to return from an abstract cluster to the images inside it',
 'Spotify-Demographics-Analyzer':'with the cached artist records making the extraction step reusable when another playlist contained the same names',
 'akahu-sheets-sync':'with the saved sync state keeping track of the previous run before another batch of transactions arrived',
 'metlink-departures-display':'with the server and terminal versions sharing the departure information that gave the sign its useful content',
 'PowerCalculator':'with the browser interface taking the figures while the calculation module kept the sharing rule in one place',
 'YayMinecraftServer':'with the infrastructure keeping the wake mechanism available while the machine that ran the game could sleep',
 'Sentient':'with the environment changing as the agent moved and the reward values shaping which actions the learner would revisit',
 'dropeta':'with the duration matrix giving the ordering logic travel estimates to compare as the list of destinations changed',
 'HamishStyler':'with the training examples and preference records kept in forms that the next model pass could use',
 'alphero-voice':'with the reference articles giving the guide examples to return to when an instruction was too broad on its own',
 'personal-language-corpus':'with those identifiers kept through the import so later features and observations could still point to the same text',
}
for e in ENTRIES:
 p=e['paragraphs'][0]
 if e['repo']=='EchoStatsFinder':
  p=p.replace('. The app let you search either starting point.',', and the app let you search either starting point.')
 e['paragraphs'][0]=p[:-1]+', '+CLAUSES[e['repo']]+'.'

# User removed these catalogue entries on 10 October 2026. Preserve their original drafts above.
ENTRIES = [e for e in ENTRIES if e['repo'] not in {'HamishStyler', 'alphero-voice'}]

# Covers recovered from real project media, October 2026.
_REAL_COVER_ALTS = {'ArticulateAI': 'Original ArticulateAI command menu, with twelve options for processing a spoken transcript.', 'Otto': 'Otto’s native capability journal rendered with the original shipped app and music commands, in an offline demonstration.', 'Synod': 'Synod’s actual Obsidian status panel, showing the journal import, value discovery and bulletin controls in an empty demonstration vault.', 'Lumen': 'Lumen’s actual research form in Obsidian, showing question input, sub-questions, vault and web sources, and memory controls.'}
for _entry in ENTRIES:
    if _entry["repo"] in _REAL_COVER_ALTS:
        _entry["coverAlt"] = _REAL_COVER_ALTS[_entry["repo"]]
