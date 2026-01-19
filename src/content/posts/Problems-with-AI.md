---
title: "Problems with AI"
pubDate: 2025-03-31
tags: ["ai", "ethics"]
featured: false
draft: false
author: "Hamish Burke"
---

I just watched Abigail Thorn’s Philosophy Tube video, “[AI is an ethical nightmare](https://www.youtube.com/watch?v=AaU6tI2pb3M),” and it makes a persuasive case. She splits the harms into two areas: what the model outputs, and how we apply that output in the real world.

Consider airport body scanners, what she calls the infamous “penis detectors.” An operator selects male or female before you enter. Anyone outside that binary, such as trans or gender-nonconforming people, ends up flagged as “anomaly” and pulled aside. This shows how an AI system can bake its designers’ limited worldview into actual bodies.

My first thought as a software engineer was to retrain the model with more inclusive data. But that feels like a temporary patch. The deeper issue lies in how these systems are designed and trained from day one.

---

## 1. Data: The Real Culprit

Todays flagship AI models, from large language models to vision systems, consume vast troves of data that no organisation fully controls. Most of it is harvested without genuine consent:

1. **Public Web Scrapes**  
   Blogs, tweets and forum posts are bulk-collected and monetised without explicit permission, eroding informed consent[^1].

2. **Semi-Private Platforms**  
   YouTube videos and Instagram stories can be mined for deepfake generation, even though creators never agreed to that use[^2].

3. **Synthetic Data**  
   Promoted as “neutral,” it’s generated from biased originals, which only doubles down on existing prejudices[^1].

---

## 2. Fixes That Could Help

The “move fast and patch later” mindset seems inadequate. Real change might look more like:

- **Consent-Driven Data Co-ops**  
  People voluntarily pool their data and receive clear benefits or payment. No consent = no data[^1].

- **Community-Led Design**  
  Bring in the most affected groups – for instance, trans travellers – to help shape how systems ought to work[^2].

- **Tiered Regulation**  
  1. **Ban outright:** Gender verification, predictive policing, social scoring[^3].  
  2. **High risk (audit + human oversight):** Hiring algorithms, healthcare triage, credit scoring [^4].  
  3. **Medium risk (transparency + opt-outs):** Chatbots, recommendation engines [^4].  
  4. **Low risk:** Spellcheckers, spam filters – basic oversight suffices [^3].

- **Right to Explanation & Compensation**  
  If an AI decision harms you, you deserve a clear explanation, human review and fair recompense [^5][^6].

- **Regular Ethical Audits**  
  Treat models like cars and give them a “warrant of fitness.” Failing systems must be taken offline until they pass [^7][^8].


## 3. In Short

We can’t simply tweak code to resolve deep ethical problems. AI systems need consent, respect and transparency built in from the start if they are ever going to support human dignity rather than erode it.  

---


### References

1. [^1]: Andreotta AJ, Kirkham N, Rizzi M. **AI, big data, and the future of consent.** *AI & Society*. 2021;37(4):1715–28. 
2. [^2]: Hsu YC, Huang TH “Kenneth”, Verma H, et al. **Empowering Local Communities Using Artificial Intelligence.** *Patterns*. 2022;3(10)
3. [^3]: Zhang J. **A Three-Layered Framework: An AI Governance Guide.** SSRN. 2024.
4. [^4]: Cajueiro DO, Celestino VR. **A Comprehensive Review of Artificial Intelligence Regulation: Weighing Ethical Principles and Innovation.** SSRN. 2024. 
5. [^5]: Metikoš L, Ausloos J. **The Right to an Explanation in Practice: Insights from Case Law for the GDPR and the AI Act.** *Law Innovation and Technology.* 2025;17(1):1–36.
6. [^6]:Kaminski ME. **The Right to Explanation in the AI Act.** SSRN. 2023.
7. [^7]: Laine J, Minkkinen M, Mäntymäki M. **Ethics-based AI auditing: A systematic literature review on conceptualizations of ethical principles and knowledge contributions to stakeholders.** *Information & Management.* 2024;61(5):103969.
8. [^8]: Schiff DS, Kelley S, Camacho Ibáñez JC. **The emergence of artificial intelligence ethics auditing.** *Big Data & Society.* 2025. 
