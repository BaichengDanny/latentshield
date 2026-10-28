/* Add release URLs here; all three resources remain visible while links are pending. */
const projectLinks = { paper: "", code: "", huggingface: "" };
const resources = [
  { key: "paper", label: "Paper", icon: "paper" },
  { key: "code", label: "Code", icon: "code" },
  { key: "huggingface", label: "Hugging Face", icon: "huggingface" },
];
const icon = (name) =>
  name === "huggingface"
    ? '<span class="hf-icon" aria-hidden="true">🤗</span>'
    : `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
resources.forEach((resource) => {
  const url = projectLinks[resource.key];
  const attrs = url
    ? `href="${url}" target="_blank" rel="noopener noreferrer"`
    : `type="button" data-pending="${resource.label}" title="${resource.label} — coming soon" aria-label="${resource.label} — coming soon"`;
  const tag = url ? "a" : "button";
  document
    .querySelector("#hero-resources")
    .insertAdjacentHTML(
      "beforeend",
      `<${tag} class="resource-button" ${attrs}>${icon(resource.icon)}${resource.label}</${tag}>`,
    );
});
let toastTimeout;
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove("visible"), 3200);
}
document
  .querySelectorAll("[data-pending]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      toast(`${button.dataset.pending} — coming soon.`),
    ),
  );

// One continuous timeline. Dedicated motion routes continue through nodes and
// beneath the monitor labels; visible connector arrows stop at node boundaries.
// Orange packets are token messages; blue packets are latent states; teal is the monitor readout/control.
const demo = document.querySelector("#demo");
const playButton = document.querySelector("#play-toggle");
const progressInput = document.querySelector("#animation-progress");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const phases = [
  {
    duration: 1300,
    label: "MDU 1 · Input",
    paths: ["flow-input"],
    nodes: ["agent-1"],
    text: "A token query enters MDU 1.",
  },
  {
    duration: 2300,
    label: "MDU 1 · Collaborate",
    paths: ["flow-collab-1"],
    nodes: ["agent-1", "agent-2", "agent-3"],
    text: "The first MDU’s contributors exchange latent representations.",
  },
  {
    duration: 2400,
    label: "MDU 1 · Monitor",
    paths: ["flow-monitor-1"],
    nodes: ["shield-1"],
    text: "The contributor latent trajectory flows into LatentShield for risk assessment.",
  },
  {
    duration: 2100,
    label: "MDU 1 · Decide",
    paths: ["flow-control-1", "flow-context-1"],
    nodes: ["shield-1", "decision-1"],
    text: "LatentShield adds a safety instruction before the decision node generates its token output.",
    low: "The risk check allows normal generation. The decision node receives its latent context without an added safety instruction.",
  },
  {
    duration: 1400,
    label: "Between MDUs · Handoff",
    paths: ["flow-handoff"],
    nodes: ["decision-1"],
    text: "The first decision node releases a token-space message to the next MDU.",
  },
  {
    duration: 1400,
    label: "MDU 2 · Input",
    paths: ["flow-branch-top", "flow-branch-bottom"],
    nodes: ["agent-4", "agent-5"],
    text: "The token handoff becomes input to the second MDU’s parallel contributors.",
  },
  {
    duration: 2100,
    label: "MDU 2 · Collaborate",
    paths: ["flow-join-top", "flow-join-bottom"],
    nodes: ["agent-4", "agent-5", "agent-6"],
    text: "Parallel agents collaborate in latent space, forming a new contributor trajectory.",
  },
  {
    duration: 2400,
    label: "MDU 2 · Monitor",
    paths: ["flow-monitor-2"],
    nodes: ["shield-2"],
    text: "The second MDU’s trajectory flows through its own LatentShield check.",
  },
  {
    duration: 2100,
    label: "MDU 2 · Decide",
    paths: ["flow-control-2", "flow-context-2"],
    nodes: ["shield-2", "decision-2"],
    text: "A safety instruction reaches the second decision node before output generation.",
    low: "The second risk check allows the decision node to generate normally, without an added safety instruction.",
  },
  {
    duration: 1600,
    label: "Final output",
    paths: ["flow-output"],
    nodes: ["decision-2", "output-node"],
    text: "The second monitored decision is released as the workflow’s final token output.",
  },
  {
    duration: 1300,
    label: "Workflow complete",
    paths: [],
    nodes: ["output-node"],
    text: "Each MDU keeps its latent states local; monitored token messages connect the workflow.",
  },
];
const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
const svgNS = "http://www.w3.org/2000/svg";
const pathCache = new Map();
phases.forEach((phase) =>
  phase.paths.forEach((id) => {
    if (pathCache.has(id)) return;
    const path = document.getElementById(id);
    const motionPath = path.dataset.motionPath
      ? document.getElementById(path.dataset.motionPath)
      : path;
    const packet = document.createElementNS(svgNS, "circle");
    packet.setAttribute("r", "5");
    packet.setAttribute(
      "class",
      `packet ${path.classList.contains("token-path") ? "token-packet" : path.classList.contains("latent-path") ? "latent-packet" : "monitor-packet"}`,
    );
    packet.dataset.path = id;
    packet.style.display = "none";
    document.querySelector("#packet-layer").append(packet);
    pathCache.set(id, {
      path,
      motionPath,
      packet,
      length: motionPath.getTotalLength(),
    });
  }),
);
let elapsed = 0,
  playing = !reducedMotion.matches,
  visible = true,
  lastFrame = null,
  frameId = null,
  currentPhase = -1;
function drawTimeline() {
  let start = 0,
    index = 0;
  while (
    index < phases.length - 1 &&
    elapsed >= start + phases[index].duration
  ) {
    start += phases[index].duration;
    index++;
  }
  const phase = phases[index],
    fraction = Math.min(1, Math.max(0, (elapsed - start) / phase.duration));
  const activePaths = phase.paths.filter(
    (id) =>
      demo.dataset.risk !== "low" ||
      !pathCache.get(id).path.classList.contains("control-path"),
  );
  demo.dataset.phase = String(index);
  demo.dataset.progress = (elapsed / totalDuration).toFixed(4);
  if (currentPhase !== index) {
    currentPhase = index;
    document
      .querySelectorAll(".flow-active,.node-active")
      .forEach((el) => el.classList.remove("flow-active", "node-active"));
    for (const { packet } of pathCache.values()) packet.style.display = "none";
    activePaths.forEach((id) =>
      pathCache.get(id).path.classList.add("flow-active"),
    );
    phase.nodes.forEach((id) =>
      document.getElementById(id).classList.add("node-active"),
    );
    document.querySelector("#phase-label").textContent = phase.label;
  }
  document.querySelector("#step-description").textContent =
    demo.dataset.risk === "low" && phase.low ? phase.low : phase.text;
  activePaths.forEach((id) => {
    const { motionPath, packet, length } = pathCache.get(id),
      position = motionPath.getPointAtLength(length * fraction);
    packet.setAttribute("cx", position.x);
    packet.setAttribute("cy", position.y);
    packet.style.display = "";
  });
  progressInput.value = String(Math.round((elapsed / totalDuration) * 1000));
  progressInput.setAttribute(
    "aria-valuetext",
    `${phase.label}: ${Math.round((elapsed / totalDuration) * 100)}%`,
  );
}
function frame(now) {
  if (!playing || !visible || document.hidden) {
    frameId = null;
    lastFrame = null;
    return;
  }
  if (lastFrame !== null)
    elapsed = (elapsed + Math.min(now - lastFrame, 100)) % totalDuration;
  lastFrame = now;
  drawTimeline();
  frameId = requestAnimationFrame(frame);
}
function updatePlayback() {
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  lastFrame = null;
  playButton.textContent = playing ? "Ⅱ Pause" : "▶ Play";
  playButton.setAttribute(
    "aria-label",
    playing ? "Pause animation" : "Play animation",
  );
  demo.classList.toggle("paused", !playing);
  if (playing && visible && !document.hidden)
    frameId = requestAnimationFrame(frame);
}
playButton.addEventListener("click", () => {
  playing = !playing;
  if (playing && elapsed >= totalDuration) elapsed = 0;
  updatePlayback();
});
document.querySelector("#replay").addEventListener("click", () => {
  elapsed = 0;
  currentPhase = -1;
  playing = true;
  drawTimeline();
  updatePlayback();
});
progressInput.addEventListener("input", () => {
  playing = false;
  elapsed = (Number(progressInput.value) / 1000) * totalDuration;
  drawTimeline();
  updatePlayback();
});
document.querySelectorAll(".segmented button").forEach((button) =>
  button.addEventListener("click", () => {
    demo.dataset.risk = button.dataset.risk;
    currentPhase = -1; // Repaint immediately when toggled within a paused phase.
    document
      .querySelectorAll(".segmented button")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    document
      .querySelectorAll(".risk-action")
      .forEach(
        (label) =>
          (label.textContent =
            button.dataset.risk === "high"
              ? "Safety instruction"
              : "No intervention"),
      );
    drawTimeline();
  }),
);
document.addEventListener("visibilitychange", updatePlayback);
reducedMotion.addEventListener("change", () => {
  playing = !reducedMotion.matches;
  updatePlayback();
});
new IntersectionObserver(
  (entries) => {
    visible = entries[0].isIntersecting;
    updatePlayback();
  },
  { threshold: 0 },
).observe(demo);
// Reduced motion starts with a complete diagram and allows explicit playback or scrubbing.
if (reducedMotion.matches) elapsed = totalDuration;
drawTimeline();
updatePlayback();

// Source: paper-source/tables/main.tex. All MFR values are fractions (not percentages).
const models = [
  "Qwen3-4B",
  "Qwen3-4B-Instruct",
  "Qwen3-14B",
  "Gemma-2-2B-IT",
  "Phi-3-mini-4K-Instruct",
];
const baselines = [
  { name: "LatentMAS", values: [0.174, 0.063, 0.112, 0.1, 0.151] },
  { name: "+ CoT Guard", values: [0.18, 0.158, 0.11, 0.102, 0.145] },
  { name: "+ Backbone Guard", values: [0.151, 0.465, 0.26, 0.129, 0.505] },
  {
    name: "Linear Probe",
    values: [0.117, 0.06, 0.145, 0.163, 0.142],
    sd: [0.003, 0.001, 0.006, 0.002, 0.006],
  },
];
const operatingPoints = {
  p01: {
    values: [0.159, 0.055, 0.091, 0.089, 0.136],
    sd: [0.009, 0.006, 0.007, 0.001, 0.009],
  },
  p05: {
    values: [0.121, 0.056, 0.084, 0.088, 0.13],
    sd: [0.016, 0.01, 0.01, 0.002, 0.002],
  },
  p10: {
    values: [0.111, 0.068, 0.086, 0.088, 0.135],
    sd: [0.025, 0.009, 0.017, 0.003, 0.003],
  },
  p20: {
    values: [0.122, 0.119, 0.114, 0.09, 0.168],
    sd: [0.03, 0.017, 0.024, 0.003, 0.009],
  },
  p50: {
    values: [0.191, 0.302, 0.288, 0.134, 0.319],
    sd: [0.052, 0.007, 0.008, 0.019, 0.037],
  },
};
const chart = document.querySelector("#result-chart");
const fixed = (value) => value.toFixed(3);
function renderResults() {
  const model = Number(document.querySelector("#model-select").value);
  const point = document.querySelector("#point-select").value;
  const current = operatingPoints[point];
  const rows = [
    ...baselines,
    { name: `LatentShield · ${point}`, ...current, ours: true },
  ];
  const max =
    Math.ceil(
      Math.max(...rows.map((r) => r.values[model] + (r.sd?.[model] || 0))) * 10,
    ) / 10;
  chart.innerHTML =
    rows
      .map(
        (row) =>
          `<div class="chart-row ${row.ours ? "ours" : ""}"><span class="chart-label">${row.name}</span><div class="chart-track"><div class="chart-bar" style="width:${(row.values[model] / max) * 100}%"></div></div><span class="chart-value">${fixed(row.values[model])}${row.sd ? ` <small>± ${fixed(row.sd[model])}</small>` : ""}</span></div>`,
      )
      .join("") +
    `<div class="chart-axis">${Array.from({ length: 6 }, (_, i) => `<span>${((max * i) / 5).toFixed(2)}</span>`).join("")}</div>`;
  const relative =
    ((baselines[0].values[model] - current.values[model]) /
      baselines[0].values[model]) *
    100;
  document.querySelector("#result-summary").innerHTML =
    `<strong>${Math.abs(relative).toFixed(1)}% ${relative >= 0 ? "lower" : "higher"} MFR</strong> relative to unguarded LatentMAS · ${models[model]} · ${point}.`;
}
document
  .querySelector("#model-select")
  .addEventListener("change", renderResults);
document
  .querySelector("#point-select")
  .addEventListener("change", renderResults);
renderResults();
const table = document.querySelector("#full-results-table");
table.insertAdjacentHTML(
  "beforeend",
  `<thead><tr><th scope="col">Method</th>${models.map((m) => `<th scope="col">${m}</th>`).join("")}</tr></thead><tbody>${[...baselines, ...Object.entries(operatingPoints).map(([point, values]) => ({ name: `LatentShield (${point})`, ...values, ours: true }))].map((row) => `<tr class="${row.ours ? "ours" : ""}"><th scope="row">${row.name}</th>${row.values.map((v, i) => `<td>${fixed(v)}${row.sd ? ` ± ${fixed(row.sd[i])}` : ""}</td>`).join("")}</tr>`).join("")}</tbody>`,
);

// Edges follow the provided topology figure exactly, including the twin-chain skip edges.
const topologies = {
  fuse: {
    name: "Fuse-CD · 5 agents",
    base: 0.19,
    ours: 0.093,
    nodes: [
      [100, 55],
      [100, 155],
      [295, 105],
      [295, 225],
      [520, 145],
    ],
    edges: [
      [0, 2],
      [1, 2],
      [2, 4],
      [3, 4],
    ],
  },
  wide: {
    name: "Wide fan-out · 5 agents",
    base: 0.162,
    ours: 0.094,
    nodes: [
      [65, 140],
      [270, 45],
      [270, 140],
      [270, 235],
      [520, 140],
    ],
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 4],
      [2, 4],
      [3, 4],
    ],
  },
  tree: {
    name: "Tree · 6 agents",
    base: 0.181,
    ours: 0.096,
    nodes: [
      [60, 140],
      [210, 70],
      [210, 210],
      [370, 70],
      [370, 210],
      [530, 140],
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 4],
      [3, 5],
      [4, 5],
    ],
  },
  twin: {
    name: "Twin chains · 6 agents",
    base: 0.176,
    ours: 0.097,
    nodes: [
      [60, 140],
      [210, 75],
      [370, 75],
      [210, 205],
      [370, 205],
      [530, 140],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [0, 2, "top"],
      [0, 3],
      [3, 4],
      [0, 4, "bottom"],
      [2, 5],
      [4, 5],
    ],
  },
  fan: {
    name: "Fan-out + fuse · 6 agents",
    base: 0.186,
    ours: 0.117,
    nodes: [
      [60, 140],
      [220, 45],
      [220, 140],
      [220, 235],
      [380, 140],
      [530, 140],
    ],
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 5],
    ],
  },
  nine: {
    name: "9-agent fuse · 9 agents",
    base: 0.185,
    ours: 0.09,
    nodes: [
      [100, 25],
      [100, 68],
      [100, 111],
      [100, 169],
      [100, 212],
      [100, 255],
      [310, 68],
      [310, 212],
      [530, 140],
    ],
    edges: [
      [0, 6],
      [1, 6],
      [2, 6],
      [3, 7],
      [4, 7],
      [5, 7],
      [6, 8],
      [7, 8],
    ],
  },
};
function renderTopology() {
  const selected = topologies[document.querySelector("#topology-select").value];
  const svg = document.querySelector("#topology-svg");
  svg.setAttribute(
    "aria-label",
    `${selected.name}. Contributors communicate in latent space before a monitored decision node.`,
  );
  const edges = selected.edges
    .map(([a, b, curve]) => {
      const [x1, y1] = selected.nodes[a],
        [x2, y2] = selected.nodes[b];
      const angle = Math.atan2(y2 - y1, x2 - x1),
        startX = x1 + 22 * Math.cos(angle),
        startY = y1 + 22 * Math.sin(angle),
        endX = x2 - 27 * Math.cos(angle),
        endY = y2 - 27 * Math.sin(angle);
      const path = curve
        ? `M${startX} ${startY} Q${(x1 + x2) / 2} ${curve === "top" ? -35 : 315} ${endX} ${endY}`
        : `M${startX} ${startY}L${endX} ${endY}`;
      return `<path d="${path}" fill="none" stroke="#83a0bb" stroke-width="1.5" marker-end="url(#topo-arrow)"/>`;
    })
    .join("");
  svg.innerHTML = `<defs><marker id="topo-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 6 3 0 6" fill="none" stroke="#83a0bb"/></marker></defs><line x1="468" y1="16" x2="468" y2="264" stroke="#c49b6d" stroke-dasharray="4 5"/>${edges}${selected.nodes.map(([x, y], i) => `<g class="${i === selected.nodes.length - 1 ? "topo-decision" : ""}"><circle cx="${x}" cy="${y}" r="21" fill="${i === selected.nodes.length - 1 ? "#168b8d" : "#edf4fa"}" stroke="${i === selected.nodes.length - 1 ? "#168b8d" : "#b0c6dc"}" stroke-width="1.4"/><text x="${x}" y="${y + 5}" text-anchor="middle">${i === selected.nodes.length - 1 ? "D" : i + 1}</text></g>`).join("")}`;
  document.querySelector("#topology-name").textContent = selected.name;
  document.querySelector("#topology-base").textContent = fixed(selected.base);
  document.querySelector("#topology-ours").textContent = fixed(selected.ours);
}
document
  .querySelector("#topology-select")
  .addEventListener("change", renderTopology);
renderTopology();
document.querySelector("#topology-table").innerHTML =
  `<caption>Qwen3-4B structural transfer. Fixed source-validation p10 threshold; LatentShield means across three monitors.</caption><thead><tr><th scope="col">Unseen structure</th><th scope="col">LatentMAS MFR ↓</th><th scope="col">LatentShield MFR ↓</th></tr></thead><tbody>${Object.values(
    topologies,
  )
    .map(
      (t) =>
        `<tr><th scope="row">${t.name}</th><td>${fixed(t.base)}</td><td>${fixed(t.ours)}</td></tr>`,
    )
    .join(
      "",
    )}<tr class="ours"><th scope="row">Average</th><td>0.180</td><td>0.098</td></tr></tbody>`;

const citation = `@misc{chen2026latentshield,
  title = {LatentShield: Composable Latent Multi-Agent Systems with Decision-Boundary Monitoring},
  author = {Chen, Baicheng and Satheesh, Anirudh and Yuan, Lingzhi and Gjerstad, Drew and Mendez, Andrew and Gnanaraj, Ami Britti Antoni and Kang, Mingyu and Leinwand, Benjamin and Schoen, Andrew Adams and Huang, Furong},
  year = {2026},
  note = {Preprint}
}`;
document.querySelector("#bibtex").textContent = citation;
document.querySelector("#copy-citation").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(citation);
    document.querySelector("#copy-citation span").textContent = "Copied";
    document.querySelector("#copy-status").textContent =
      "BibTeX citation copied to clipboard.";
    setTimeout(() => {
      document.querySelector("#copy-citation span").textContent = "Copy";
    }, 2200);
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("#bibtex"));
    selection.removeAllRanges();
    selection.addRange(range);
    toast(
      "Citation selected. Use your browser’s Copy command, or download the .bib file.",
    );
  }
});
const dialog = document.querySelector("#figure-dialog");
document.querySelectorAll(".figure-zoom").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelector("#dialog-image").src = button.dataset.image;
    document.querySelector("#dialog-image").alt = button.dataset.caption;
    document.querySelector("#dialog-caption").textContent =
      button.dataset.caption;
    dialog.showModal();
  }),
);
document
  .querySelector("#close-dialog")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  }
});
let scrollQueued = false;
function updateScroll() {
  let current = "";
  for (const section of document.querySelectorAll("main section[id]"))
    if (section.getBoundingClientRect().top < 160) current = section.id;
  document
    .querySelectorAll("nav a")
    .forEach((link) =>
      link.classList.toggle("active", link.hash === `#${current}`),
    );
  scrollQueued = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateScroll);
    }
  },
  { passive: true },
);
updateScroll();
document.querySelector("#full-abstract").textContent =
  "Latent communication lets language-model agents exchange continuous representations directly, but removes the textual handoffs inspected by conventional text-based monitors. We introduce LatentShield, which combines a two-scale communication architecture with safety monitoring at decision boundaries. Rather than propagate latent states through an entire agent graph, we partition the workflow into Multi-Agent Decision Units (MDUs): agents communicate in latent space within each MDU, while only token-space messages cross MDU boundaries. Each MDU ends at a designated decision node. Immediately before that node generates the unit’s token output, LatentShield reads the contributor latent trajectory and predicts the risk of harmful compliance. A trainable readout applies learned-query attention to pool the variable-length trajectory and uses an MLP aligner to map the pooled representation into the hidden space of a frozen Llama Guard, without decoding the intermediate communication to text. If the risk score exceeds a validation-selected threshold, LatentShield adds a safety instruction before generation. Across the five backbones, LatentShield achieves the lowest mean failure rate among the evaluated latent-monitoring methods while retaining competitive benign utility overall. On Qwen3-4B, it reduces mean failure rate by 36.2% relative to unguarded LatentMAS. A monitor trained on one MDU structure also transfers without retraining to the evaluated unseen MDU sizes and communication graphs. We further evaluate adaptive prompt-injection attacks and agentic workflows. Together, these results support decision-boundary monitoring as a practical safety interface for latent multi-agent systems.";
