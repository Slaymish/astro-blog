"use strict";
(() => {
  // docs/catalogue-backfill/real-media-2026-10-10/obsidian-render-host.ts
  function create(parent, tag, opts = {}) {
    if (typeof opts === "string") opts = { cls: opts };
    const el = document.createElement(tag);
    if (opts.cls) el.className = opts.cls;
    if (opts.text) el.textContent = opts.text;
    if (opts.type) el.setAttribute("type", opts.type);
    for (const [k, v] of Object.entries(opts.attr || {})) el.setAttribute(k, String(v));
    parent.append(el);
    return el;
  }
  Object.assign(HTMLElement.prototype, { empty() {
    this.replaceChildren();
  }, addClass(...c) {
    this.classList.add(...c);
  }, setText(t) {
    this.textContent = t;
  }, setAttr(k, v) {
    this.setAttribute(k, v);
  }, createEl(tag, o) {
    return create(this, tag, o);
  }, createDiv(o) {
    return create(this, "div", o);
  }, createSpan(o) {
    return create(this, "span", o);
  } });
  var TFile = class {
  };
  var TFolder = class {
  };
  var Notice = class {
    constructor(..._args) {
    }
  };
  var AbstractInputSuggest = class {
  };
  var FuzzySuggestModal = class {
  };
  var normalizePath = (s) => s;
  function requestUrl() {
    throw Error("Network forbidden in offline capture");
  }
  var ItemView = class {
    containerEl;
    contentEl;
    app;
    constructor(_leaf) {
      this.containerEl = document.createElement("div");
      this.containerEl.append(document.createElement("div"));
      this.contentEl = document.createElement("div");
      this.containerEl.append(this.contentEl);
      this.app = { vault: { getFiles: () => [] }, workspace: {} };
      document.querySelector("#capture").append(this.containerEl);
    }
  };
  var Modal = class {
    contentEl;
    app;
    constructor(app) {
      this.app = app;
      this.contentEl = document.createElement("div");
      document.querySelector("#capture").append(this.contentEl);
    }
    open() {
    }
    close() {
    }
  };
  var ButtonComponent = class {
    buttonEl;
    constructor(parent) {
      this.buttonEl = create(parent, "button");
    }
    setButtonText(s) {
      this.buttonEl.textContent = s;
      return this;
    }
    setCta() {
      this.buttonEl.classList.add("mod-cta");
      return this;
    }
    onClick(fn) {
      this.buttonEl.onclick = fn;
      return this;
    }
    setDisabled(v) {
      this.buttonEl.disabled = v;
      return this;
    }
  };
  var TextAreaComponent = class {
    inputEl;
    constructor(parent) {
      this.inputEl = create(parent, "textarea");
    }
    setPlaceholder(s) {
      this.inputEl.placeholder = s;
      return this;
    }
    setValue(s) {
      this.inputEl.value = s;
      return this;
    }
    onChange(_fn) {
      return this;
    }
  };
  var Toggle = class {
    el;
    constructor(parent) {
      this.el = create(parent, "input", { type: "checkbox" });
      this.el.className = "checkbox-container";
    }
    setValue(v) {
      this.el.checked = v;
      return this;
    }
    onChange(_fn) {
      return this;
    }
  };
  var Slider = class {
    el;
    constructor(parent) {
      this.el = create(parent, "input", { type: "range" });
    }
    setLimits(a, b, c) {
      this.el.min = String(a);
      this.el.max = String(b);
      this.el.step = String(c);
      return this;
    }
    setValue(v) {
      this.el.value = String(v);
      return this;
    }
    setDynamicTooltip() {
      return this;
    }
    onChange(_fn) {
      return this;
    }
  };
  var Setting = class {
    settingEl;
    nameEl;
    descEl;
    controlEl;
    constructor(parent) {
      this.settingEl = create(parent, "div", { cls: "setting-item" });
      const info = create(this.settingEl, "div", { cls: "setting-item-info" });
      this.nameEl = create(info, "div", { cls: "setting-item-name" });
      this.descEl = create(info, "div", { cls: "setting-item-description" });
      this.controlEl = create(this.settingEl, "div", { cls: "setting-item-control" });
    }
    setName(s) {
      this.nameEl.textContent = s;
      return this;
    }
    setDesc(s) {
      this.descEl.textContent = s;
      return this;
    }
    setHeading() {
      this.settingEl.classList.add("setting-item-heading");
      return this;
    }
    addTextArea(fn) {
      fn(new TextAreaComponent(this.controlEl));
      return this;
    }
    addButton(fn) {
      fn(new ButtonComponent(this.controlEl));
      return this;
    }
    addToggle(fn) {
      fn(new Toggle(this.controlEl));
      return this;
    }
    addSlider(fn) {
      fn(new Slider(this.controlEl));
      return this;
    }
  };

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/util/log.ts
  var listeners = /* @__PURE__ */ new Set();
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function emit(level, msg) {
    const entry = { ts: (/* @__PURE__ */ new Date()).toISOString(), level, msg };
    for (const l of listeners) {
      try {
        l(entry);
      } catch {
      }
    }
  }
  var log = {
    debug: (m) => emit("debug", m),
    info: (m) => emit("info", m),
    warn: (m) => emit("warn", m),
    error: (m) => emit("error", m)
  };
  function uuid() {
    return crypto.randomUUID();
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/prompts.ts
  function fill(template, vars) {
    return template.replace(
      /\{(\w+)\}/g,
      (m, k) => Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m
    );
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/util/text-packing.ts
  var MIN_REASONABLE_BUDGET = 1e3;
  function formatEntry(date, body) {
    return `[${date}]
${body}`;
  }
  function splitByLines(text, max) {
    const out = [];
    let buf = "";
    for (const line of text.split("\n")) {
      const cand = buf ? `${buf}
${line}` : line;
      if (cand.length <= max) {
        buf = cand;
      } else {
        if (buf) out.push(buf);
        buf = line;
      }
    }
    if (buf) out.push(buf);
    return out;
  }
  function splitLong(text, max) {
    if (text.length <= max) return [text];
    const pieces = [];
    let buf = "";
    for (const para of text.split("\n\n")) {
      const cand = buf ? `${buf}

${para}` : para;
      if (cand.length <= max) {
        buf = cand;
        continue;
      }
      if (buf) {
        pieces.push(buf);
        buf = "";
      }
      if (para.length <= max) {
        buf = para;
      } else {
        for (const chunk of splitByLines(para, max)) {
          if (chunk.length <= max) {
            pieces.push(chunk);
          } else {
            for (let i = 0; i < chunk.length; i += max) {
              pieces.push(chunk.slice(i, i + max));
            }
          }
        }
      }
    }
    if (buf) pieces.push(buf);
    return pieces;
  }
  function chunkOversized(date, body, max) {
    if (max < MIN_REASONABLE_BUDGET) {
      throw new Error(
        `maxChars=${max} is below the safe floor of ${MIN_REASONABLE_BUDGET}; refusing to chop entries that small.`
      );
    }
    const headerOverhead = `[${date} \u2014 part 99/99]
`.length;
    const bodyBudget = Math.max(max - headerOverhead, MIN_REASONABLE_BUDGET / 2);
    const pieces = splitLong(body, bodyBudget);
    if (pieces.length === 1) return [formatEntry(date, pieces[0])];
    return pieces.map((p, i) => `[${date} \u2014 part ${i + 1}/${pieces.length}]
${p}`);
  }
  function packBlocks(blocks, max) {
    const sepOverhead = "\n\n---\n\n".length;
    const batches = [];
    let cur = [];
    let curLen = 0;
    for (const block of blocks) {
      const cost = block.length + (cur.length ? sepOverhead : 0);
      if (cur.length && curLen + cost > max) {
        batches.push(cur);
        cur = [block];
        curLen = block.length;
      } else {
        cur.push(block);
        curLen += cost;
      }
    }
    if (cur.length) batches.push(cur);
    return batches;
  }
  function packEntries(entries, max) {
    const blocks = [];
    for (const e of entries) {
      blocks.push(...chunkOversized(e.date, e.body, max));
    }
    return packBlocks(blocks, max);
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/values/schwartz.ts
  var SCHWARTZ_VALUES = [
    "self-direction",
    "stimulation",
    "hedonism",
    "achievement",
    "power",
    "security",
    "conformity",
    "tradition",
    "benevolence",
    "universalism"
  ];
  var SCHWARTZ_DEFINITIONS = {
    "self-direction": "Independent thought and action; choosing, creating, exploring.",
    "stimulation": "Excitement, novelty, and challenge in life.",
    "hedonism": "Pleasure and sensuous gratification for oneself.",
    "achievement": "Personal success through demonstrating competence according to social standards.",
    "power": "Social status and prestige, control or dominance over people and resources.",
    "security": "Safety, harmony, and stability of society, relationships, and self.",
    "conformity": "Restraint of actions, inclinations, and impulses likely to upset or harm others.",
    "tradition": "Respect, commitment, and acceptance of the customs and ideas that traditional culture or religion provides.",
    "benevolence": "Preserving and enhancing the welfare of those with whom one is in frequent personal contact.",
    "universalism": "Understanding, appreciation, tolerance, and protection for the welfare of all people and nature."
  };
  function schwartzDefinitionsBlock() {
    return SCHWARTZ_VALUES.map((v) => `- ${v}: ${SCHWARTZ_DEFINITIONS[v]}`).join("\n");
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/agents/json.ts
  function parseLooseJson(raw) {
    let s = raw.trim();
    if (s.includes("```")) {
      const parts = s.split("```");
      for (let i = 1; i < parts.length; i++) {
        let p = parts[i];
        if (p.startsWith("json")) p = p.slice(4);
        p = p.trim();
        if (p) {
          s = p;
          break;
        }
      }
    }
    const start = s.search(/[{[]/);
    if (start < 0) return JSON.parse(s);
    const opener = s[start];
    const closer = opener === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escape = false;
    let end = -1;
    for (let i = start; i < s.length; i++) {
      const c = s[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (c === opener) depth++;
      else if (c === closer) {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    const slice = end > 0 ? s.slice(start, end + 1) : s.slice(start);
    return JSON.parse(slice);
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/util/time.ts
  function nowIso() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  function shortDate(iso) {
    return iso.slice(0, 10);
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/values/extractor.ts
  var PROMPT_OVERHEAD_CHARS = 2500;
  async function extractBatch(llm, prompts, blocks) {
    const tpl = await prompts.load("schwartz_extractor");
    const filled = fill(tpl, {
      definitions: schwartzDefinitionsBlock(),
      entries: blocks.join("\n\n---\n\n")
    });
    try {
      const raw = await llm("", filled, { expectJson: true });
      return parseLooseJson(raw);
    } catch (e) {
      log.warn(`Extraction batch failed (${blocks.length} blocks): ${e.message}`);
      return null;
    }
  }
  function aggregate(parts) {
    const scores = {};
    const evidence = {};
    const customMap = /* @__PURE__ */ new Map();
    for (const sv of SCHWARTZ_VALUES) {
      scores[sv] = [];
      evidence[sv] = [];
    }
    for (const part of parts) {
      for (const sv of SCHWARTZ_VALUES) {
        const s = part.schwartz_scores?.[sv];
        scores[sv].push(typeof s === "number" ? s : 0);
        const ev = part.schwartz_evidence?.[sv] ?? [];
        for (const q of ev) {
          if (!evidence[sv].includes(q)) evidence[sv].push(q);
        }
      }
      for (const cv of part.custom_values ?? []) {
        const name = (cv.name ?? "").trim();
        if (!name) continue;
        const key = name.toLowerCase();
        const existing = customMap.get(key);
        if (!existing) {
          customMap.set(key, {
            name,
            definition: cv.definition ?? "",
            scores: [cv.score ?? 0],
            evidence: cv.evidence ?? []
          });
        } else {
          existing.scores.push(cv.score ?? 0);
          for (const q of cv.evidence ?? []) {
            if (!existing.evidence.includes(q)) existing.evidence.push(q);
          }
        }
      }
    }
    const avgScores = {};
    for (const sv of SCHWARTZ_VALUES) {
      const arr = scores[sv];
      avgScores[sv] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    }
    return {
      schwartz_scores: avgScores,
      schwartz_evidence: evidence,
      custom_values: Array.from(customMap.values()).map((c) => ({
        name: c.name,
        definition: c.definition,
        score: c.scores.reduce((a, b) => a + b, 0) / c.scores.length,
        evidence: c.evidence
      }))
    };
  }
  async function extractCandidateValues(entries, llm, prompts, opts) {
    const recent = entries.slice().sort((a, b) => b.written_at.localeCompare(a.written_at)).slice(0, opts.window);
    if (!recent.length) return [];
    const budget = Math.max(opts.maxCharsPerCall - PROMPT_OVERHEAD_CHARS, 4e3);
    const batches = packEntries(
      recent.map((e) => ({ date: shortDate(e.written_at), body: e.user_text })),
      budget
    );
    log.info(
      `Extracting values from ${recent.length} entries \u2192 ${batches.length} LLM call(s) (budget=${budget})`
    );
    const parts = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const total = batch.reduce((a, b) => a + b.length, 0);
      log.info(`Processing extractor batch ${i + 1}/${batches.length} (${batch.length} blocks, ${total} chars)`);
      const result = await extractBatch(llm, prompts, batch);
      if (result) parts.push(result);
    }
    if (!parts.length) {
      log.error("All extraction batches failed");
      return [];
    }
    const data = aggregate(parts);
    const out = [];
    for (const sv of SCHWARTZ_VALUES) {
      const score = data.schwartz_scores[sv] ?? 0;
      const ev = data.schwartz_evidence[sv] ?? [];
      if (score >= 0.55 && ev.length) {
        out.push({
          id: uuid(),
          name: sv.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          definition: SCHWARTZ_DEFINITIONS[sv],
          schwartz_anchor: sv,
          score,
          evidence: ev
        });
      }
    }
    for (const cv of data.custom_values) {
      if (cv.score >= 0.55 && cv.evidence.length) {
        out.push({
          id: uuid(),
          name: cv.name,
          definition: cv.definition,
          schwartz_anchor: null,
          score: cv.score,
          evidence: cv.evidence
        });
      }
    }
    return out.sort((a, b) => b.score - a.score);
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/settings.ts
  function agentModelFor(s) {
    return s.provider === "openrouter" ? s.openrouter.agentModel : s.provider === "llama_swap" ? s.llamaSwap.agentModel : s.ollama.agentModel;
  }
  function compilerModelFor(s) {
    return s.provider === "openrouter" ? s.openrouter.compilerModel : s.provider === "llama_swap" ? s.llamaSwap.compilerModel : s.ollama.compilerModel;
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/util/cancel.ts
  var CancelError = class extends Error {
    constructor(message = "Run cancelled by user.") {
      super(message);
      this.name = "CancelError";
    }
  };
  function throwIfAborted(signal, where = "") {
    if (signal?.aborted) throw new CancelError(where ? `Cancelled before ${where}.` : void 0);
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/llm/errors.ts
  var LlmHttpError = class extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
      this.name = "LlmHttpError";
    }
  };
  var LlmNetworkError = class extends Error {
    constructor(message) {
      super(message);
      this.name = "LlmNetworkError";
    }
  };
  function isTransientLlmError(e) {
    if (e instanceof LlmNetworkError) return true;
    if (e instanceof LlmHttpError) return e.status >= 500 && e.status < 600;
    return false;
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/llm/ollama.ts
  async function callOllama(opts) {
    const body = {
      model: opts.model,
      stream: false,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user }
      ],
      options: {
        temperature: opts.temperature ?? 0.4
      }
    };
    if (opts.format) body.format = opts.format;
    let resp;
    try {
      resp = await requestUrl({
        url: `${opts.baseUrl.replace(/\/$/, "")}/api/chat`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify(body),
        throw: false
      });
    } catch (e) {
      throw new LlmNetworkError(`Ollama unreachable: ${e.message}`);
    }
    if (resp.status >= 400) {
      throw new LlmHttpError(`Ollama HTTP ${resp.status}: ${resp.text.slice(0, 300)}`, resp.status);
    }
    const json = resp.json;
    if (json.error) throw new Error(`Ollama error: ${json.error}`);
    return json.message?.content ?? "";
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/llm/openai-compat.ts
  async function callOpenAICompat(opts) {
    const body = {
      model: opts.model,
      temperature: opts.temperature ?? 0.4,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user }
      ]
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey || "no-key"}`,
      ...opts.extraHeaders
    };
    let resp;
    try {
      resp = await requestUrl({
        url: `${opts.baseUrl.replace(/\/$/, "")}/chat/completions`,
        method: "POST",
        headers,
        body: JSON.stringify(body),
        throw: false
      });
    } catch (e) {
      throw new LlmNetworkError(`LLM endpoint unreachable: ${e.message}`);
    }
    if (resp.status >= 400) {
      throw new LlmHttpError(`LLM HTTP ${resp.status}: ${resp.text.slice(0, 300)}`, resp.status);
    }
    const json = resp.json;
    if (json.error) throw new Error(`LLM error: ${json.error.message ?? "unknown"}`);
    return json.choices?.[0]?.message?.content ?? "";
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/llm/index.ts
  var _inflight = Promise.resolve();
  var RETRY_BACKOFF_MS = [500, 1500];
  function getLlm(settings, role) {
    const model = role === "agent" ? agentModelFor(settings) : compilerModelFor(settings);
    return async (system, user, opts = {}) => {
      throwIfAborted(opts.signal, "LLM enqueue");
      const prev = _inflight;
      let release;
      _inflight = new Promise((res) => release = res);
      try {
        await prev;
        throwIfAborted(opts.signal, "LLM dispatch");
        return await callWithRetry(settings, model, system, user, opts, role);
      } finally {
        release();
      }
    };
  }
  async function callWithRetry(settings, model, system, user, opts, role) {
    let lastErr;
    for (let attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt++) {
      throwIfAborted(opts.signal, `LLM attempt ${attempt + 1}`);
      try {
        return await dispatch(settings, model, system, user, opts);
      } catch (e) {
        if (e instanceof CancelError) throw e;
        lastErr = e;
        if (!isTransientLlmError(e) || attempt === RETRY_BACKOFF_MS.length) {
          log.warn(`[llm:${role}] ${e.message}`);
          throw e;
        }
        const delay = RETRY_BACKOFF_MS[attempt];
        log.warn(
          `[llm:${role}] transient failure (attempt ${attempt + 1}); retrying in ${delay}ms \u2014 ${e.message}`
        );
        await sleep(delay, opts.signal);
      }
    }
    throw lastErr ?? new Error("LLM retry loop exhausted without an error");
  }
  function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new CancelError("Cancelled during backoff."));
        return;
      }
      const id = window.setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        window.clearTimeout(id);
        reject(new CancelError("Cancelled during backoff."));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
  async function dispatch(settings, model, system, user, opts) {
    switch (settings.provider) {
      case "ollama":
        return callOllama({
          baseUrl: settings.ollama.baseUrl,
          model,
          system,
          user,
          format: opts.expectJson ? "json" : void 0,
          temperature: opts.temperature,
          signal: opts.signal
        });
      case "openrouter":
        return callOpenAICompat({
          baseUrl: "https://openrouter.ai/api/v1",
          apiKey: settings.openrouter.apiKey,
          model,
          system,
          user,
          temperature: opts.temperature,
          extraHeaders: {
            "HTTP-Referer": "https://github.com/Slaymish/Synod",
            "X-Title": "Synod"
          },
          signal: opts.signal
        });
      case "llama_swap":
        return callOpenAICompat({
          baseUrl: `${settings.llamaSwap.baseUrl}/v1`,
          apiKey: "no-key",
          model,
          system,
          user,
          temperature: opts.temperature,
          signal: opts.signal
        });
    }
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/pipeline.ts
  function phasesFor(store) {
    return {
      onPhase: (phase, detail) => void store.setStatus({
        phase,
        detail,
        progress: null,
        error: null,
        finishedAt: null
      }),
      onProgress: (current, total, detail) => void store.setStatus({ progress: { current, total }, detail })
    };
  }
  async function discoverValues(store, prompts) {
    const s = store.settings;
    const llm = getLlm(s, "agent");
    const ph = phasesFor(store);
    await store.setStatus({ phase: "extracting", detail: "Extracting candidate values\u2026", startedAt: nowIso() });
    try {
      const out = await extractCandidateValues(store.entries, llm, prompts, {
        window: 75,
        maxCharsPerCall: s.budgets.extractorMaxCharsPerCall
      });
      ph.onPhase("done", `Extracted ${out.length} candidate value${out.length === 1 ? "" : "s"}.`);
      await store.setStatus({ finishedAt: nowIso() });
      return out;
    } catch (e) {
      log.error(`discoverValues failed: ${e.message}`);
      await store.setStatus({ phase: "error", detail: e.message, error: e.message, finishedAt: nowIso() });
      throw e;
    }
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/ui/candidate-modal.ts
  var CandidateValueModal = class extends Modal {
    constructor(app, store, candidates) {
      super(app);
      this.selected = /* @__PURE__ */ new Set();
      this.edits = /* @__PURE__ */ new Map();
      this.store = store;
      this.candidates = candidates;
      for (const c of candidates) {
        this.edits.set(c.id, { name: c.name, definition: c.definition });
      }
    }
    onOpen() {
      const { contentEl } = this;
      contentEl.empty();
      this.setTitle("Confirm your values");
      contentEl.createEl("p", {
        cls: "synod-modal-intro",
        text: "These showed up in what you've been writing. Tick the ones that ring true \u2014 Synod will give each its own agent. Rewriting the definition in your own words makes that agent reason much more like you. You can re-run discovery any time."
      });
      for (const c of this.candidates) {
        const card = contentEl.createDiv({ cls: "synod-candidate" });
        const header = card.createDiv({ cls: "synod-candidate-header" });
        const cb = header.createEl("input", { type: "checkbox" });
        cb.onchange = () => {
          if (cb.checked) this.selected.add(c.id);
          else this.selected.delete(c.id);
        };
        header.createSpan({
          text: ` ${c.name}  (score ${c.score.toFixed(2)}${c.schwartz_anchor ? `, ${c.schwartz_anchor}` : ", custom"})`,
          cls: "synod-candidate-title"
        });
        new Setting(card).setName("Name").addText((t) => {
          t.setValue(c.name).onChange((v) => {
            const e = this.edits.get(c.id);
            e.name = v;
          });
        });
        new Setting(card).setName("Definition").addTextArea((t) => {
          t.setValue(c.definition).onChange((v) => {
            const e = this.edits.get(c.id);
            e.definition = v;
          });
          t.inputEl.rows = 3;
          t.inputEl.addClass("synod-definition-input");
        });
        if (c.evidence.length) {
          const ev = card.createDiv({ cls: "synod-evidence" });
          ev.createEl("strong", { text: "Evidence:" });
          const list = ev.createEl("ul");
          for (const q of c.evidence.slice(0, 3)) list.createEl("li", { text: q });
        }
      }
      new Setting(contentEl).addButton(
        (b) => b.setButtonText("Confirm selected").setCta().onClick(() => this.commit())
      );
    }
    async commit() {
      let count = 0;
      for (const c of this.candidates) {
        if (!this.selected.has(c.id)) continue;
        const edit = this.edits.get(c.id);
        const personalised = edit.definition.trim() !== c.definition.trim() || edit.name.trim() !== c.name.trim();
        await this.store.upsertValue({
          id: c.id,
          name: edit.name.trim(),
          definition: edit.definition.trim(),
          schwartz_anchor: c.schwartz_anchor,
          confirmed_at: nowIso(),
          active: true,
          definition_personalised: personalised,
          version: 1
        });
        count++;
      }
      new Notice(`Confirmed ${count} value${count === 1 ? "" : "s"}.`);
      this.close();
    }
    onClose() {
      this.contentEl.empty();
    }
  };

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/ingestion/dedup.ts
  function normaliseText(text) {
    return text.normalize("NFC").split(/\s+/).filter(Boolean).join(" ");
  }
  async function contentHash(userText) {
    const data = new TextEncoder().encode(normaliseText(userText));
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/ingestion/ingest.ts
  async function rawToEntry(r) {
    const id = await contentHash(r.user_text);
    const wordCount = r.user_text.trim().split(/\s+/).filter(Boolean).length;
    return {
      id,
      written_at: r.written_at,
      ingested_at: nowIso(),
      source: r.source,
      user_text: r.user_text,
      rosebud_ai_text: r.rosebud_ai_text,
      word_count: wordCount,
      tags: r.tags
    };
  }
  async function ingest(store, raws) {
    const entries = [];
    for (const r of raws) entries.push(await rawToEntry(r));
    return store.addEntries(entries);
  }

  // docs/catalogue-backfill/real-media-2026-10-10/no-zip.ts
  function inflateRawSync() {
    throw Error("Archive imports are disabled during interface rendering");
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/importers/rosebud.ts
  var NEW_HEADER_RE = /^#\s+.*Rosebud/im;
  var H2_TITLE_RE = /^##\s+(.+)$/m;
  var H3_DATE_RE = /^###\s+(.+)$/m;
  var SECTION_RE = /^####\s+(.+?)\s*\n([\s\S]*?)(?=^####\s|(?![\s\S]))/gm;
  var ORDINAL_RE = /(\d+)(st|nd|rd|th)\b/gi;
  var DAY_OF_WEEK_RE = /^[A-Za-z]+,\s*/;
  var EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF\u{10000}-\u{10FFFF}]+\s*/gu;
  var FRONTMATTER_RE = /^---\s*\ndate:\s*(.+?)\s*\n---/m;
  var ROSEBUD_TURN_RE = /\*\*Rosebud\*\*:\s*([\s\S]*?)(?=\n\*\*|\n---|(?![\s\S]))/g;
  var USER_TURN_RE = /\*\*Me\*\*:\s*([\s\S]*?)(?=\n\*\*|\n---|(?![\s\S]))/g;
  var SUMMARY_RE = /^\*Summary:([\s\S]*?)\*\s*$/m;
  var H1_DATE_RE = /^#\s+(.+)$/m;
  var SKIP_SECTIONS = /* @__PURE__ */ new Set(["tags", "emotions", "topics"]);
  function parseDate(raw) {
    let s = raw.trim().replace(DAY_OF_WEEK_RE, "");
    s = s.replace(ORDINAL_RE, "$1");
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? (/* @__PURE__ */ new Date()).toISOString() : d.toISOString();
  }
  function parseNewEntry(block) {
    const h2 = H2_TITLE_RE.exec(block);
    const h3 = H3_DATE_RE.exec(block);
    if (!h3) return null;
    const writtenAt = parseDate(h3[1]);
    const sections = {};
    const sectionRe = new RegExp(SECTION_RE.source, SECTION_RE.flags);
    for (let m; m = sectionRe.exec(block); ) {
      sections[m[1].trim().toLowerCase()] = m[2].trim();
    }
    const textParts = [];
    for (const [name, content] of Object.entries(sections)) {
      if (SKIP_SECTIONS.has(name) || !content) continue;
      textParts.push(content);
    }
    if (!textParts.length) {
      let after = block.slice(h3.index + h3[0].length).trim();
      after = after.replace(/^####\s+Tags\b[\s\S]*?(?=^####\s|(?![\s\S]))/m, "").trim();
      if (after) textParts.push(after);
    }
    const userText = textParts.join("\n\n").trim();
    if (!userText) return null;
    const tagsRaw = sections["tags"] ?? "";
    const tagList = [];
    for (const m of tagsRaw.matchAll(/\*\*Emotions?\*\*:\s*(.+)/g)) {
      tagList.push(...m[1].split(",").map((t) => t.trim()).filter(Boolean));
    }
    for (const m of tagsRaw.matchAll(/\*\*Topics?\*\*:\s*(.+)/g)) {
      tagList.push(...m[1].split(",").map((t) => t.trim()).filter(Boolean));
    }
    const title = h2 ? h2[1].replace(EMOJI_RE, "").trim() : "";
    return {
      written_at: writtenAt,
      user_text: title ? `**${title}**

${userText}` : userText,
      rosebud_ai_text: tagsRaw || void 0,
      tags: tagList,
      raw_md: block,
      source: "rosebud"
    };
  }
  function parseNewFormat(content) {
    const blocks = content.split(/\n---+\n/);
    const out = [];
    for (const raw of blocks) {
      const block = raw.trim();
      if (!H2_TITLE_RE.test(block)) continue;
      const entry = parseNewEntry(block);
      if (entry) out.push(entry);
    }
    return out;
  }
  function extractOldTurns(block) {
    const userParts = [];
    for (const m of block.matchAll(USER_TURN_RE)) userParts.push(m[1].trim());
    const aiParts = [];
    for (const m of block.matchAll(ROSEBUD_TURN_RE)) aiParts.push(m[1].trim());
    const summary = SUMMARY_RE.exec(block);
    if (summary) aiParts.push(`[Summary] ${summary[1].trim()}`);
    return { user: userParts.join("\n\n"), ai: aiParts.join("\n\n") };
  }
  function parseOldEntry(content) {
    const dateMatch = FRONTMATTER_RE.exec(content);
    let writtenAt;
    if (dateMatch) writtenAt = parseDate(dateMatch[1]);
    else {
      const h1 = H1_DATE_RE.exec(content);
      writtenAt = h1 ? parseDate(h1[1]) : (/* @__PURE__ */ new Date()).toISOString();
    }
    const { user, ai } = extractOldTurns(content);
    if (!user.trim()) return [];
    return [
      {
        written_at: writtenAt,
        user_text: user,
        rosebud_ai_text: ai || void 0,
        raw_md: content,
        source: "rosebud"
      }
    ];
  }
  function parseOldBulk(content) {
    const blocks = content.split(/\n(?=---\s*\ndate:)/);
    const out = [];
    for (const block of blocks) out.push(...parseOldEntry(block.trim()));
    return out;
  }
  function parseMarkdown(content) {
    if (NEW_HEADER_RE.test(content) || H2_TITLE_RE.test(content)) {
      return parseNewFormat(content);
    }
    if ((content.match(/date:/g) ?? []).length > 1) return parseOldBulk(content);
    return parseOldEntry(content);
  }
  function readZip(bytes) {
    const view = new DataView(bytes);
    const u8 = new Uint8Array(bytes);
    let eocd = -1;
    const end = Math.max(0, u8.length - 65557);
    for (let i = u8.length - 22; i >= end; i--) {
      if (view.getUint32(i, true) === 101010256) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) throw new Error("ZIP: end-of-central-directory not found");
    const cdCount = view.getUint16(eocd + 10, true);
    let cdOffset = view.getUint32(eocd + 16, true);
    const entries = [];
    const td = new TextDecoder();
    for (let n = 0; n < cdCount; n++) {
      if (view.getUint32(cdOffset, true) !== 33639248) {
        throw new Error("ZIP: bad central-directory signature");
      }
      const method = view.getUint16(cdOffset + 10, true);
      const compSize = view.getUint32(cdOffset + 20, true);
      const uncompSize = view.getUint32(cdOffset + 24, true);
      const nameLen = view.getUint16(cdOffset + 28, true);
      const extraLen = view.getUint16(cdOffset + 30, true);
      const commentLen = view.getUint16(cdOffset + 32, true);
      const localHeaderOffset = view.getUint32(cdOffset + 42, true);
      const name = td.decode(u8.subarray(cdOffset + 46, cdOffset + 46 + nameLen));
      cdOffset += 46 + nameLen + extraLen + commentLen;
      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compressed = u8.subarray(dataStart, dataStart + compSize);
      let data;
      if (method === 0) {
        data = compressed;
      } else if (method === 8) {
        data = new Uint8Array(inflateRawSync(Buffer.from(compressed)));
        if (uncompSize && data.length !== uncompSize) {
        }
      } else {
        throw new Error(`ZIP: unsupported compression method ${method} for ${name}`);
      }
      entries.push({ name, data });
    }
    return entries;
  }
  function parseZip(bytes) {
    const td = new TextDecoder("utf-8", { fatal: false });
    const entries = readZip(bytes).filter((e) => e.name.endsWith(".md")).sort((a, b) => a.name.localeCompare(b.name));
    const out = [];
    for (const e of entries) {
      out.push(...parseOldEntry(td.decode(e.data)));
    }
    return out;
  }
  function parseRosebud(filename, bytes) {
    if (filename.toLowerCase().endsWith(".zip")) return parseZip(bytes);
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return parseMarkdown(text);
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/importers/obsidian-folder.ts
  var FRONTMATTER_RE2 = /^---\n([\s\S]*?)\n---\n?/;
  var FILENAME_DATE_RE = /(\d{4}-\d{2}-\d{2})/;
  function parseFrontmatter(text) {
    const m = FRONTMATTER_RE2.exec(text);
    if (!m) return { fm: {}, body: text };
    const body = text.slice(m[0].length);
    const fm = {};
    for (const line of m[1].split("\n")) {
      const kv = /^(\w[\w-]*):\s*(.*)$/.exec(line);
      if (!kv) continue;
      const [, key, raw] = kv;
      if (key === "date" || key === "created") {
        fm.date = raw.trim().replace(/^['"]|['"]$/g, "");
      } else if (key === "tags") {
        const v = raw.trim();
        if (v.startsWith("[") && v.endsWith("]")) {
          fm.tags = v.slice(1, -1).split(",").map((t) => t.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
        } else if (v) {
          fm.tags = [v.replace(/^['"]|['"]$/g, "")];
        }
      }
    }
    return { fm, body };
  }
  function dateFromFilename(name) {
    const m = FILENAME_DATE_RE.exec(name);
    return m ? m[1] : null;
  }
  function toIso(input, fallbackEpoch) {
    if (input) {
      const d = new Date(input);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    return new Date(fallbackEpoch).toISOString();
  }
  function listMarkdownIn(app, folderPath) {
    const folder = app.vault.getAbstractFileByPath(normalizePath(folderPath));
    if (!(folder instanceof TFolder)) {
      throw new Error(`Vault folder not found: ${folderPath}`);
    }
    const out = [];
    const stack = [folder];
    while (stack.length) {
      const f = stack.pop();
      for (const child of f.children) {
        if (child instanceof TFolder) stack.push(child);
        else if (child instanceof TFile && child.extension === "md") out.push(child);
      }
    }
    return out;
  }
  async function importObsidianFolder(app, folderPath) {
    const files = listMarkdownIn(app, folderPath);
    const out = [];
    for (const f of files) {
      const text = await app.vault.read(f);
      const { fm, body } = parseFrontmatter(text);
      const cleanBody = body.trim();
      if (!cleanBody) continue;
      const writtenAt = toIso(
        fm.date ?? dateFromFilename(f.name) ?? void 0,
        f.stat.mtime
      );
      out.push({
        written_at: writtenAt,
        user_text: cleanBody,
        tags: fm.tags,
        raw_md: text,
        source: "obsidian-folder"
      });
    }
    return out;
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/importers/obsidian-journal.ts
  var FRONTMATTER_RE3 = /^---\n([\s\S]*?)\n---\n?/;
  function stripFrontmatter(text) {
    const m = FRONTMATTER_RE3.exec(text);
    return m ? text.slice(m[0].length) : text;
  }
  function dateFormatToRegex(fmt) {
    let pattern = fmt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    pattern = pattern.replace(/YYYY/g, "(?<y>\\d{4})").replace(/MM/g, "(?<m>\\d{2})").replace(/DD/g, "(?<d>\\d{2})");
    return new RegExp(`^${pattern}$`);
  }
  function dateFromName(basename, re) {
    const m = re.exec(basename);
    if (!m || !m.groups) return null;
    const { y, m: mo, d } = m.groups;
    if (!y || !mo || !d) return null;
    const iso = `${y}-${mo}-${d}T00:00:00`;
    const dt = new Date(iso);
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  function listJournalNotes(app, folderPath) {
    const folder = app.vault.getAbstractFileByPath(normalizePath(folderPath));
    if (!(folder instanceof TFolder)) {
      throw new Error(`Vault folder not found: ${folderPath}`);
    }
    const out = [];
    const stack = [folder];
    while (stack.length) {
      const f = stack.pop();
      for (const child of f.children) {
        if (child instanceof TFolder) stack.push(child);
        else if (child instanceof TFile && child.extension === "md") out.push(child);
      }
    }
    return out;
  }
  function splitSections(body) {
    const trimmed = body.trim();
    if (!/^##\s+/m.test(trimmed)) return [{ heading: null, text: trimmed }];
    const parts = [];
    const lines = trimmed.split("\n");
    let currentHeading = null;
    let buf = [];
    const flush = () => {
      const t = buf.join("\n").trim();
      if (t) parts.push({ heading: currentHeading, text: t });
      buf = [];
    };
    for (const line of lines) {
      const h = /^##\s+(.+)$/.exec(line);
      if (h) {
        flush();
        currentHeading = h[1].trim();
      } else {
        buf.push(line);
      }
    }
    flush();
    return parts;
  }
  async function importObsidianJournal(app, folderPath, dateFormat) {
    const re = dateFormatToRegex(dateFormat);
    const files = listJournalNotes(app, folderPath);
    const out = [];
    for (const f of files) {
      const basename = f.basename;
      const written = dateFromName(basename, re);
      if (!written) continue;
      const text = await app.vault.read(f);
      const body = stripFrontmatter(text).trim();
      if (!body) continue;
      for (const section of splitSections(body)) {
        const userText = section.heading ? `**${section.heading}**

${section.text}` : section.text;
        out.push({
          written_at: written,
          user_text: userText,
          raw_md: text,
          source: "obsidian-journal"
        });
      }
    }
    return out;
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/importers/index.ts
  async function runImport(app, importer, source) {
    if (importer === "rosebud") {
      if (source.kind !== "file") {
        throw new Error("Rosebud importer expects a .md or .zip file.");
      }
      return parseRosebud(source.filename, source.bytes);
    }
    if (importer === "obsidian-folder") {
      if (source.kind !== "folder") {
        throw new Error("Obsidian-folder importer expects a vault folder.");
      }
      return importObsidianFolder(app, source.folder);
    }
    if (importer === "obsidian-journal") {
      if (source.kind !== "folder") {
        throw new Error("Obsidian-journal importer expects a vault folder.");
      }
      return importObsidianJournal(app, source.folder, source.dateFormat ?? "YYYY-MM-DD");
    }
    throw new Error(`Unknown importer: ${importer}`);
  }

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/ui/folder-suggest.ts
  var FolderSuggest = class extends AbstractInputSuggest {
    constructor(app, inputEl) {
      super(app, inputEl);
      this.inputEl = inputEl;
    }
    getSuggestions(query) {
      const q = query.toLowerCase();
      return this.app.vault.getAllFolders(true).filter((f) => f.path.toLowerCase().includes(q)).sort((a, b) => a.path.localeCompare(b.path));
    }
    renderSuggestion(folder, el) {
      el.setText(folder.path === "" ? "/" : folder.path);
    }
    selectSuggestion(folder) {
      const path = folder.path;
      this.inputEl.value = path;
      this.inputEl.dispatchEvent(new Event("input"));
      this.close();
    }
  };

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/ui/import-modal.ts
  var ImportModal = class extends Modal {
    constructor(app, store) {
      super(app);
      /** File chosen via the file input or drag-and-drop (rosebud only). */
      this.fileInputEl = null;
      this.droppedFile = null;
      /** Element re-rendered when the kind changes. The modal title and dropdown
       *  live above this and are not re-created. */
      this.bodyEl = null;
      this.store = store;
      this.kind = store.settings.importers.defaultKind;
      const cfg = store.settings.importers.configs;
      this.folderState = { ...cfg["obsidian-folder"] };
      this.journalState = { ...cfg["obsidian-journal"] };
    }
    onOpen() {
      const { contentEl } = this;
      contentEl.empty();
      this.setTitle("Import journal entries");
      contentEl.createEl("p", {
        cls: "synod-modal-intro",
        text: "Synod reads only the entries you import here. Re-running the same import is safe \u2014 duplicates are detected by content hash."
      });
      new Setting(contentEl).setName("Source").setDesc("Where your journal lives.").addDropdown((dd) => {
        dd.addOption("rosebud", "Rosebud export (.md or .zip)");
        dd.addOption("obsidian-folder", "Folder of markdown notes in this vault");
        dd.addOption("obsidian-journal", "Obsidian daily / journal notes (date-named files)");
        dd.setValue(this.kind);
        dd.onChange((v) => {
          this.kind = v;
          this.renderBody();
        });
      });
      this.bodyEl = contentEl.createDiv();
      this.renderBody();
      new Setting(contentEl).addButton(
        (b) => b.setButtonText("Import").setCta().onClick(() => this.runImport())
      );
    }
    onClose() {
      this.contentEl.empty();
      this.bodyEl = null;
      this.fileInputEl = null;
      this.droppedFile = null;
    }
    renderBody() {
      if (!this.bodyEl) return;
      this.bodyEl.empty();
      this.fileInputEl = null;
      if (this.kind === "rosebud") {
        this.renderRosebud(this.bodyEl);
      } else if (this.kind === "obsidian-folder") {
        this.renderObsidianFolder(this.bodyEl);
      } else {
        this.renderObsidianJournal(this.bodyEl);
      }
    }
    // ── Per-kind body renderers ────────────────────────────────────────────
    renderRosebud(host) {
      this.droppedFile = null;
      host.createEl("p", {
        cls: "synod-modal-intro",
        text: "Export your Rosebud journal as a .md or .zip file, then choose it below. Both single-file and full-archive exports work."
      });
      this.fileInputEl = host.createEl("input", {
        type: "file",
        attr: { accept: ".md,.zip" }
      });
      const dropZone = host.createDiv({ cls: "synod-import-dropzone" });
      dropZone.setText("\u2026or drag and drop the .md or .zip file here");
      const dropStatus = host.createDiv({ cls: "synod-import-dropstatus" });
      const refreshStatus = () => {
        const f = this.droppedFile ?? this.fileInputEl?.files?.[0] ?? null;
        dropStatus.setText(f ? `Selected: ${f.name}` : "");
      };
      this.fileInputEl.addEventListener("change", () => {
        this.droppedFile = null;
        refreshStatus();
      });
      const setHover = (on) => dropZone.toggleClass("is-active", on);
      dropZone.addEventListener("dragenter", (e) => {
        e.preventDefault();
        setHover(true);
      });
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
        setHover(true);
      });
      dropZone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        setHover(false);
      });
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        setHover(false);
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        const lower = file.name.toLowerCase();
        if (!lower.endsWith(".md") && !lower.endsWith(".zip")) {
          new Notice("Only .md or .zip files are accepted.");
          return;
        }
        this.droppedFile = file;
        refreshStatus();
      });
      dropZone.addEventListener("click", () => this.fileInputEl?.click());
    }
    renderObsidianFolder(host) {
      host.createEl("p", {
        cls: "synod-modal-intro",
        text: "Every markdown note inside the folder (including subfolders) is treated as one journal entry. Use this if your journal is just free-form notes."
      });
      new Setting(host).setName("Vault folder").setDesc("e.g. Journal").addText((t) => {
        t.setPlaceholder("Journal");
        t.setValue(this.folderState.folder).onChange((v) => this.folderState.folder = v);
        new FolderSuggest(this.app, t.inputEl);
      });
    }
    renderObsidianJournal(host) {
      host.createEl("p", {
        cls: "synod-modal-intro",
        text: "For daily notes / Journals plugin layouts where the filename encodes the date (e.g. 2025-04-13.md). Notes whose filenames don't match are skipped."
      });
      new Setting(host).setName("Vault folder").setDesc("e.g. Journal/Daily").addText((t) => {
        t.setPlaceholder("Journal");
        t.setValue(this.journalState.folder).onChange((v) => this.journalState.folder = v);
        new FolderSuggest(this.app, t.inputEl);
      });
      new Setting(host).setName("Date format in filename").setDesc("Use YYYY, MM, DD. Default: YYYY-MM-DD").addText((t) => {
        t.setPlaceholder("YYYY-MM-DD");
        t.setValue(this.journalState.dateFormat).onChange((v) => this.journalState.dateFormat = v);
      });
    }
    // ── Validation + run ───────────────────────────────────────────────────
    folderExists(path) {
      const f = this.app.vault.getAbstractFileByPath(normalizePath(path));
      return f instanceof TFolder;
    }
    async runImport() {
      try {
        let raws;
        if (this.kind === "rosebud") {
          const file = this.droppedFile ?? this.fileInputEl?.files?.[0];
          if (!file) {
            new Notice("Choose or drop a file first.");
            return;
          }
          const bytes = await file.arrayBuffer();
          raws = await runImport(this.app, "rosebud", { kind: "file", filename: file.name, bytes });
        } else if (this.kind === "obsidian-folder") {
          const folder = this.folderState.folder.trim();
          if (!folder) {
            new Notice("Enter a vault folder.");
            return;
          }
          if (!this.folderExists(folder)) {
            new Notice(`Folder not found in this vault: ${folder}`);
            return;
          }
          raws = await runImport(this.app, "obsidian-folder", { kind: "folder", folder });
        } else {
          const folder = this.journalState.folder.trim();
          const dateFormat = this.journalState.dateFormat.trim();
          if (!folder) {
            new Notice("Enter a vault folder.");
            return;
          }
          if (!this.folderExists(folder)) {
            new Notice(`Folder not found in this vault: ${folder}`);
            return;
          }
          if (!dateFormat) {
            new Notice("Enter a date format.");
            return;
          }
          raws = await runImport(this.app, "obsidian-journal", { kind: "folder", folder, dateFormat });
        }
        const prevImporters = this.store.settings.importers;
        const nextConfigs = { ...prevImporters.configs };
        if (this.kind === "obsidian-folder") {
          nextConfigs["obsidian-folder"] = { folder: this.folderState.folder.trim() };
        } else if (this.kind === "obsidian-journal") {
          nextConfigs["obsidian-journal"] = {
            folder: this.journalState.folder.trim(),
            dateFormat: this.journalState.dateFormat.trim()
          };
        }
        await this.store.updateSettings({
          importers: {
            ...prevImporters,
            defaultKind: this.kind,
            configs: nextConfigs
          }
        });
        const { added, duplicates } = await ingest(this.store, raws);
        new Notice(`Imported ${added} new entr${added === 1 ? "y" : "ies"} (${duplicates} duplicate${duplicates === 1 ? "" : "s"} skipped).`);
        this.close();
      } catch (e) {
        new Notice(`Import failed: ${e.message}`);
      }
    }
  };

  // ../../Documents/Codex/project-media-2026-10-10/Synod/src/ui/status-view.ts
  var SYNOD_VIEW_TYPE = "synod-status-view";
  var RECENT_BULLETINS_MAX = 5;
  var SynodStatusView = class extends ItemView {
    constructor(leaf, plugin) {
      super(leaf);
      this.unsubStatus = null;
      this.unsubData = null;
      this.unsubLog = null;
      this.unsubRun = null;
      this.logBuffer = [];
      this.plugin = plugin;
      this.store = plugin.store;
      this.prompts = plugin.prompts;
    }
    getViewType() {
      return SYNOD_VIEW_TYPE;
    }
    getDisplayText() {
      return "Synod";
    }
    getIcon() {
      return "users";
    }
    async onOpen() {
      this.render();
      this.unsubStatus = this.store.onStatus(() => this.render());
      this.unsubData = this.store.onDataChange(() => this.render());
      this.unsubRun = this.plugin.onRunStateChange(() => this.render());
      this.unsubLog = subscribe((entry) => {
        this.logBuffer.push(entry);
        if (this.logBuffer.length > 50) this.logBuffer.shift();
        this.renderLog();
      });
    }
    async onClose() {
      this.unsubStatus?.();
      this.unsubData?.();
      this.unsubLog?.();
      this.unsubRun?.();
    }
    render() {
      const root = this.containerEl.children[1];
      root.empty();
      root.addClass("synod-view");
      root.createDiv({ cls: "synod-title", text: "Synod" });
      const entryCount = this.store.entries.length;
      const valueCount = this.store.activeValues().length;
      const lastBulletin = this.store.lastRunFor("bulletin");
      if (!lastBulletin) {
        const guide = root.createDiv({ cls: "synod-guide" });
        guide.createDiv({
          cls: "synod-guide-title",
          text: "Get started in three steps"
        });
        const steps = guide.createEl("ol", { cls: "synod-guide-steps" });
        const step1 = steps.createEl("li");
        step1.setText(
          entryCount > 0 ? `Imported ${entryCount} journal ${entryCount === 1 ? "entry" : "entries"}.` : "Import your journal \u2014 Rosebud export, an Obsidian folder, or daily notes."
        );
        if (entryCount > 0) step1.addClass("is-done");
        const step2 = steps.createEl("li");
        step2.setText(
          valueCount > 0 ? `Confirmed ${valueCount} active value${valueCount === 1 ? "" : "s"}.` : "Discover the values that already show up in what you write, then keep the ones that ring true."
        );
        if (valueCount > 0) step2.addClass("is-done");
        const step3 = steps.createEl("li");
        step3.setText(
          "Run a bulletin. Each value gets its own agent, a compiler surfaces the tensions between them, and the result lands in your vault."
        );
        guide.createEl("small", {
          cls: "synod-guide-hint",
          text: "Synod talks to LLMs through Ollama, OpenRouter, or any OpenAI-compatible endpoint \u2014 pick yours under Settings \u2192 Community plugins \u2192 Synod."
        });
      }
      const status = this.store.status;
      const statusBox = root.createDiv({ cls: "synod-status-box" });
      statusBox.createDiv({
        text: `Phase: ${status.phase}`,
        cls: `synod-phase synod-phase-${status.phase}`
      });
      statusBox.createDiv({ text: status.detail, cls: "synod-detail" });
      if (status.progress) {
        const { current, total } = status.progress;
        const pct = total > 0 ? Math.round(current / total * 100) : 0;
        const bar = statusBox.createDiv({ cls: "synod-progress" });
        const fill2 = bar.createDiv({ cls: "synod-progress-fill" });
        fill2.style.setProperty("--synod-progress", `${pct}%`);
        statusBox.createDiv({ text: `${current} / ${total}`, cls: "synod-progress-text" });
      }
      if (status.startedAt) {
        statusBox.createEl("small", { text: `Started: ${new Date(status.startedAt).toLocaleString()}` });
      }
      if (status.finishedAt) {
        statusBox.createEl("small", {
          text: `Finished: ${new Date(status.finishedAt).toLocaleString()}`
        });
      }
      if (status.error) {
        statusBox.createEl("div", { text: `Error: ${status.error}`, cls: "synod-error" });
      }
      if (this.plugin.isRunning()) {
        const cancelBtn = statusBox.createEl("button", {
          text: "Cancel run",
          cls: "synod-cancel-button"
        });
        cancelBtn.setAttr(
          "title",
          "Stop the run at the next checkpoint. The current model call cannot be aborted mid-flight."
        );
        cancelBtn.onclick = () => this.plugin.cancelBulletinRun();
      }
      const counts = root.createDiv({ cls: "synod-counts" });
      counts.createEl("div", { text: `Entries: ${entryCount}` });
      counts.createEl("div", { text: `Active values: ${valueCount}` });
      counts.createEl("div", {
        text: `Last bulletin: ${lastBulletin ? new Date(lastBulletin).toLocaleString() : "never"}`
      });
      const actions = root.createDiv({ cls: "synod-actions" });
      const importBtn = actions.createEl("button", { text: "1. Import journal entries" });
      importBtn.setAttr("title", "Bring your journal into Synod from Rosebud, an Obsidian folder, or daily notes.");
      importBtn.onclick = () => new ImportModal(this.app, this.store).open();
      const discoverBtn = actions.createEl("button", { text: "2. Discover values" });
      discoverBtn.setAttr(
        "title",
        "Read your entries, propose the values that already show up in your writing, and let you keep the ones that ring true."
      );
      discoverBtn.onclick = async () => {
        if (!this.store.entries.length) {
          new Notice("Import some journal entries first.");
          return;
        }
        try {
          const candidates = await discoverValues(this.store, this.prompts);
          if (!candidates.length) {
            new Notice("No candidate values discovered. Import more entries and try again.");
            return;
          }
          new CandidateValueModal(this.app, this.store, candidates).open();
        } catch (e) {
          new Notice(`Value discovery failed: ${e.message}`);
        }
      };
      const runBtn = actions.createEl("button", { text: "3. Run bulletin cycle" });
      runBtn.setAttr(
        "title",
        "Each active value gets its own agent. The compiler surfaces tensions between them and writes a bulletin to your vault."
      );
      if (this.plugin.isRunning()) {
        runBtn.setAttr("disabled", "true");
        runBtn.setText("3. Run bulletin cycle (running\u2026)");
      }
      runBtn.onclick = () => {
        void this.plugin.startBulletinRun();
      };
      const openBtn = actions.createEl("button", { text: "Open latest bulletin" });
      openBtn.onclick = async () => {
        const latest = this.store.latestPacket();
        if (!latest) {
          new Notice("No bulletins yet. Run a cycle first.");
          return;
        }
        const path = normalizePath(
          `${this.store.settings.output.rootFolder}/Bulletins/${latest.period_end.slice(0, 10)}.md`
        );
        const f = this.app.vault.getAbstractFileByPath(path);
        if (f instanceof TFile) await this.app.workspace.getLeaf(true).openFile(f);
        else new Notice(`File not found: ${path}`);
      };
      this.renderRecentBulletins(root);
      root.createDiv({ cls: "synod-section-label", text: "Recent log" });
      root.createDiv({ cls: "synod-log", attr: { id: "synod-log" } });
      this.renderLog();
    }
    renderRecentBulletins(root) {
      const folderPath = normalizePath(
        `${this.store.settings.output.rootFolder}/Bulletins`
      );
      const files = this.app.vault.getFiles().filter((f) => f.path.startsWith(`${folderPath}/`) && f.extension === "md").sort((a, b) => b.basename.localeCompare(a.basename)).slice(0, RECENT_BULLETINS_MAX);
      if (!files.length) return;
      root.createDiv({ cls: "synod-section-label", text: "Recent bulletins" });
      const list = root.createDiv({ cls: "synod-bulletin-list" });
      for (const f of files) {
        const row = list.createDiv({ cls: "synod-bulletin-row" });
        const link = row.createEl("a", {
          cls: "synod-bulletin-link",
          text: f.basename
        });
        link.setAttr("href", "#");
        link.onclick = (e) => {
          e.preventDefault();
          void this.app.workspace.getLeaf(false).openFile(f);
        };
      }
    }
    renderLog() {
      const box = this.containerEl.querySelector("#synod-log");
      if (!box) return;
      box.empty();
      for (const entry of this.logBuffer.slice(-20)) {
        const line = box.createDiv({ cls: `synod-log-line synod-log-${entry.level}` });
        line.createSpan({ text: entry.ts.slice(11, 19) + " ", cls: "synod-log-ts" });
        line.createSpan({ text: entry.msg });
      }
    }
  };

  // ../../Documents/Codex/project-media-2026-10-10/Lumen/obsidian-plugin/src/research/index.ts
  var ResearchQueryModal = class extends Modal {
    constructor(app, plugin, options = "") {
      super(app);
      this.plugin = plugin;
      this.query = "";
      this.maxSubQueries = 5;
      this.useVault = true;
      this.useWeb = true;
      this.memoryWrite = true;
      this.specSourceEl = null;
      this.textArea = null;
      this.busy = false;
      this.submitBtn = null;
      this.statusEl = null;
      this.statusDetailEl = null;
      const opts = typeof options === "string" ? { initialQuery: options } : options;
      this.query = opts.initialQuery ?? "";
      this.specNotePath = opts.specNotePath ?? null;
    }
    onOpen() {
      const { contentEl } = this;
      contentEl.empty();
      contentEl.addClass("ai-os-research-modal");
      contentEl.createEl("h2", { text: "Research" });
      new Setting(contentEl).setName("Question").setDesc("What would you like to research across your vault?").addTextArea((text) => {
        this.textArea = text;
        text.setPlaceholder(
          "e.g. What have I noted about deterministic citation pipelines?"
        );
        text.setValue(this.query);
        text.inputEl.rows = 10;
        text.inputEl.style.width = "100%";
        text.onChange((value) => {
          this.query = value;
          if (this.specNotePath !== null) {
            this.specNotePath = null;
            this.renderSpecSource();
          }
        });
        text.inputEl.focus();
      });
      const specRow = new Setting(contentEl).setName("Use a note as spec").setDesc(
        "Load the content of an existing note into the question above. Frontmatter and ingestion block-ids are stripped."
      );
      specRow.addButton(
        (btn) => btn.setButtonText("Pick note\u2026").onClick(() => {
          new NoteSuggestModal(this.app, (file) => {
            void this.loadFromNote(file);
          }).open();
        })
      );
      specRow.addButton(
        (btn) => btn.setButtonText("Use active note").onClick(() => {
          const file = this.app.workspace.getActiveFile();
          if (!file || file.extension !== "md") {
            new Notice("Open a Markdown note first.");
            return;
          }
          void this.loadFromNote(file);
        })
      );
      this.specSourceEl = contentEl.createDiv({
        cls: "ai-os-research-modal__spec-source"
      });
      this.renderSpecSource();
      new Setting(contentEl).setName("Sub-questions").setDesc(
        "Maximum number of focused sub-questions to research. Lower values are faster."
      ).addSlider((slider) => {
        slider.setLimits(1, 5, 1).setValue(this.maxSubQueries).setDynamicTooltip().onChange((value) => {
          this.maxSubQueries = value;
        });
      });
      new Setting(contentEl).setName("Sources").setHeading();
      new Setting(contentEl).setName("Vault notes").setDesc("Search your personal knowledge base.").addToggle((toggle) => {
        toggle.setValue(this.useVault).onChange((value) => {
          this.useVault = value;
          this.updateSubmitState();
        });
      });
      new Setting(contentEl).setName("Web search").setDesc("Fetch articles and research from the internet.").addToggle((toggle) => {
        toggle.setValue(this.useWeb).onChange((value) => {
          this.useWeb = value;
          this.updateSubmitState();
        });
      });
      new Setting(contentEl).setName("Save to memory").setDesc("Store a summary of this run in long-term memory to inform future research.").addToggle((toggle) => {
        toggle.setValue(this.memoryWrite).onChange((value) => {
          this.memoryWrite = value;
        });
      });
      const buttonRow = new Setting(contentEl);
      buttonRow.addButton((btn) => {
        this.submitBtn = btn.setButtonText("Start research").setCta().onClick(() => {
          void this.submit();
        });
      });
      buttonRow.addButton(
        (btn) => btn.setButtonText("Close").onClick(() => this.close())
      );
      const statusWrap = contentEl.createDiv({
        cls: "ai-os-research-modal__status"
      });
      this.statusEl = statusWrap.createDiv({
        cls: "ai-os-research-modal__status-title"
      });
      this.statusDetailEl = statusWrap.createDiv({
        cls: "ai-os-research-modal__status-detail"
      });
      this.setStatus("", "Enter a question to begin.");
    }
    async loadFromNote(file) {
      try {
        const raw = await this.app.vault.cachedRead(file);
        const cleaned = stripSpecNote(raw);
        if (!cleaned.trim()) {
          new Notice(
            `${file.basename} has no body content after stripping metadata.`
          );
          return;
        }
        this.query = cleaned;
        this.specNotePath = file.path;
        if (this.textArea) {
          this.textArea.setValue(cleaned);
          this.textArea.inputEl.focus();
        }
        this.renderSpecSource();
      } catch (e) {
        new Notice(`Could not read ${file.path}: ${e.message}`);
      }
    }
    renderSpecSource() {
      if (!this.specSourceEl) return;
      this.specSourceEl.empty();
      if (!this.specNotePath) return;
      this.specSourceEl.createSpan({
        cls: "ai-os-research-modal__spec-source-label",
        text: "Spec note: "
      });
      this.specSourceEl.createSpan({
        cls: "ai-os-research-modal__spec-source-path",
        text: this.specNotePath
      });
    }
    onClose() {
      this.contentEl.empty();
    }
    async submit() {
      if (this.busy) return;
      const query = this.query.trim();
      if (!query) {
        new Notice("Enter a research question first.");
        return;
      }
      this.busy = true;
      this.submitBtn?.setDisabled(true);
      this.setStatus(
        "Starting\u2026",
        "Connecting to your local backend."
      );
      try {
        const file = await this.plugin.runDeepResearch(query, {
          specNotePath: this.specNotePath ?? void 0,
          maxSubQueries: this.maxSubQueries,
          memoryWrite: this.memoryWrite,
          sourceFilter: this.sourceFilter(),
          onProgress: (message) => {
            this.setStatus("Researching\u2026", message);
          }
        });
        this.setStatus("Done", "Opening your report\u2026");
        this.close();
        if (file) {
          await this.app.workspace.getLeaf(true).openFile(file);
        }
      } catch (e) {
        this.setStatus("Research failed", e.message);
        this.busy = false;
        this.submitBtn?.setDisabled(false);
      }
    }
    updateSubmitState() {
      const neitherSelected = !this.useVault && !this.useWeb;
      this.submitBtn?.setDisabled(neitherSelected || this.busy);
      this.setStatus(
        neitherSelected ? "No sources selected" : "",
        neitherSelected ? "Enable at least one source to start research." : ""
      );
    }
    sourceFilter() {
      if (this.useVault && this.useWeb) return "auto";
      if (this.useVault) return "vault";
      if (this.useWeb) return "web";
      return "vault";
    }
    setStatus(title, detail = "") {
      if (this.statusEl) this.statusEl.setText(title);
      if (this.statusDetailEl) this.statusDetailEl.setText(detail);
    }
  };
  function stripSpecNote(raw) {
    let body = raw;
    const fmMatch = body.match(/^\s*---\n[\s\S]*?\n---\n?/);
    if (fmMatch) body = body.slice(fmMatch[0].length);
    body = body.replace(/\s*\^ai-[0-9a-f]+/gi, "");
    return body.trim();
  }
  var NoteSuggestModal = class extends FuzzySuggestModal {
    constructor(app, onPick) {
      super(app);
      this.onPick = onPick;
      this.setPlaceholder("Pick a note to use as the research spec\u2026");
    }
    getItems() {
      return this.app.vault.getMarkdownFiles();
    }
    getItemText(file) {
      return file.path;
    }
    onChooseItem(file) {
      this.onPick(file);
    }
  };

  // docs/catalogue-backfill/real-media-2026-10-10/plugin-views.ts
  window.renderProject = async (name) => {
    if (name === "Synod") {
      const store = { entries: [], activeValues: () => [], lastRunFor: () => null, status: { phase: "idle", detail: "Ready" }, settings: { output: { rootFolder: "Synod" } }, onStatus: () => () => {
      }, onDataChange: () => () => {
      } };
      const plugin = { store, prompts: {}, isRunning: () => false, onRunStateChange: () => () => {
      } };
      await new SynodStatusView({}, plugin).onOpen();
    } else new ResearchQueryModal({}, {}).onOpen();
  };
})();
