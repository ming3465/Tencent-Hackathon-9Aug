/**
 * Runs the KampungMind authoring prompt against a real model and preserves the
 * run as evidence.
 *
 * This closes a documented gap. `docs/prompts/gemini-kampungmind-authoring.txt`
 * was written, reviewed against every honesty constraint the project publishes,
 * and then never produced anything: the Gemini CLI attempt died on a free-tier
 * auth error, and that failure is currently the only thing in the AI usage log
 * about it. The prompt was never the problem.
 *
 * What this does NOT do, deliberately: it never writes to
 * `src/game/campaignContent.ts`. It writes the model's raw answer to disk and
 * stops. A human reads the table, keeps the lines that survive, and pastes
 * those in by hand. That accept/reject discipline is the reason the four
 * OpenAI visual workflows in this repo hold up under inspection, and an
 * auto-merge would throw it away.
 *
 * Usage:
 *   export HUNYUAN_API_KEY=...
 *   node scripts/author-intents.mjs                        # Tencent Hunyuan
 *
 *   export DASHSCOPE_API_KEY=...
 *   node scripts/author-intents.mjs --provider qwen        # Alibaba Qwen
 *
 *   node scripts/author-intents.mjs --dry-run              # print the request, send nothing
 *   node scripts/author-intents.mjs --model hunyuan-lite --prompt docs/prompts/other.txt
 *
 * Hunyuan is the default because this is a Tencent Cloud event whose prize pool
 * is paid in Tencent Cloud tokens — "we used Tencent's own model to author our
 * NPCs" is worth more on the AI slide than a marginal quality difference. Both
 * providers expose an OpenAI-compatible chat-completions API, so they share one
 * code path.
 *
 * Requires Node 20+. No dependencies, by design: adding one needs approval
 * (AGENTS.md, "Security & Product Guardrails") and `fetch` is enough.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Both providers speak OpenAI chat-completions. Keep it that way — a provider
 * needing a bespoke request shape belongs behind its own script, not an `if`
 * ladder in here.
 */
const PROVIDERS = {
  hunyuan: {
    label: "Tencent Hunyuan",
    baseUrl: "https://api.hunyuan.cloud.tencent.com/v1",
    defaultModel: "hunyuan-turbos-latest",
    envVar: "HUNYUAN_API_KEY",
    console: "https://console.cloud.tencent.com/hunyuan/api-key",
  },
  qwen: {
    label: "Alibaba Qwen (DashScope international)",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-flash",
    envVar: "DASHSCOPE_API_KEY",
    console: "https://bailian.console.alibabacloud.com/",
  },
};

const DEFAULT_PROMPT = "docs/prompts/gemini-kampungmind-authoring.txt";
const DEFAULT_OUT = "docs/prompts/out";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
const has = (name) => args.includes(`--${name}`);

const providerKey = flag("provider", "hunyuan");
const provider = PROVIDERS[providerKey];
if (!provider) {
  console.error(
    `Unknown provider "${providerKey}". Available: ${Object.keys(PROVIDERS).join(", ")}`,
  );
  process.exit(1);
}

const model = flag("model", provider.defaultModel);
const promptPath = flag("prompt", DEFAULT_PROMPT);
const outDir = flag("out", DEFAULT_OUT);
const dryRun = has("dry-run");

const prompt = await readFile(promptPath, "utf8");
const promptHash = createHash("sha256").update(prompt).digest("hex");

/**
 * Sent as the system message. The prompt file already carries the content
 * constraints; this only pins the output contract and the review status, so
 * the model cannot decide on its own that it is shipping something.
 */
const SYSTEM = [
  "You are drafting candidate dialogue for human review.",
  "Nothing you write ships without a human reading it first.",
  "Follow every constraint in the user message exactly.",
  "Return only the requested Markdown table, with no preamble and no commentary.",
].join(" ");

console.log(`Provider   ${provider.label}`);
console.log(`Model      ${model}`);
console.log(`Prompt     ${promptPath}`);
console.log(`SHA-256    ${promptHash}`);
console.log(`Chars      ${prompt.length}`);

if (dryRun) {
  console.log("\n--dry-run: nothing sent. Request body would be:\n");
  console.log(JSON.stringify(
    { model, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: "<prompt file>" }], temperature: 0.8 },
    null,
    2,
  ));
  process.exit(0);
}

const apiKey = process.env[provider.envVar];
if (!apiKey) {
  console.error(
    `\nMissing ${provider.envVar}.\n\n`
    + `  export ${provider.envVar}=...\n\n`
    + `Create one at ${provider.console}\n`
    + `Never put the key in a file — this repo commits no secrets.`,
  );
  process.exit(1);
}

// Warm enough to give genuinely different phrasings across residents, cool
// enough to stay inside the constraint list. Recorded in the sidecar so a run
// can be reproduced or challenged.
const temperature = Number(flag("temperature", "0.8"));

const startedAt = new Date().toISOString();
const response = await fetch(`${provider.baseUrl}/chat/completions`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model,
    temperature,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: prompt },
    ],
  }),
});

if (!response.ok) {
  const detail = await response.text().catch(() => "");
  console.error(`\n${provider.label} returned ${response.status} ${response.statusText}`);
  console.error(detail.slice(0, 1200));
  console.error(
    "\nRecord this failure in docs/AI_USAGE_LOG.md rather than deleting it."
    + " A documented failure is evidence; a silent retry is not.",
  );
  process.exit(1);
}

const payload = await response.json();
const text = payload.choices?.[0]?.message?.content ?? "";
if (!text.trim()) {
  console.error("The model returned an empty message. Nothing written.");
  process.exit(1);
}

const stamp = startedAt.slice(0, 19).replace(/[:T]/g, "").replace(/-/g, "");
const base = `${providerKey}-${model}-${stamp}`;
await mkdir(outDir, { recursive: true });

const answerPath = join(outDir, `${base}.md`);
const receiptPath = join(outDir, `${base}.json`);

await writeFile(
  answerPath,
  `<!--\n`
  + `  Raw model output. NOT reviewed, NOT curated, NOT shipped.\n`
  + `  Provider ${provider.label} · model ${model} · ${startedAt}\n`
  + `  Prompt ${promptPath} (sha256 ${promptHash})\n`
  + `  A human curates from this by hand into src/game/campaignContent.ts.\n`
  + `-->\n\n`
  + text.trim()
  + "\n",
  "utf8",
);

await writeFile(
  receiptPath,
  `${JSON.stringify(
    {
      provider: providerKey,
      providerLabel: provider.label,
      baseUrl: provider.baseUrl,
      model,
      requestedModel: model,
      resolvedModel: payload.model ?? null,
      temperature,
      startedAt,
      promptPath,
      promptSha256: promptHash,
      promptChars: prompt.length,
      usage: payload.usage ?? null,
      outputChars: text.trim().length,
      reviewed: false,
      curatedInto: null,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`\nAnswer     ${answerPath}`);
console.log(`Receipt    ${receiptPath}`);
if (payload.usage) {
  const { prompt_tokens: inTok, completion_tokens: outTok } = payload.usage;
  console.log(`Tokens     ${inTok ?? "?"} in / ${outTok ?? "?"} out`);
}
console.log(
  "\nNext: read the table, keep the lines that survive, paste them into the"
  + "\nResidentDraft entries in src/game/campaignContent.ts by hand, then log"
  + "\nwhat you accepted and what you rejected in docs/AI_USAGE_LOG.md.",
);
