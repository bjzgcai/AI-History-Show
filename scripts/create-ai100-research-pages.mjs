import { mkdir, readFile, writeFile } from "node:fs/promises";

const ROOT_DIR = new URL("../research/ai100/", import.meta.url);
const PAGES_DIR = new URL("pages/", ROOT_DIR);
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : undefined;
const force = process.argv.includes("--force");

function directoryNameFor(item) {
    return `${String(item.number).padStart(3, "0")}.${item.slug}`;
}

function pageTemplate(item, promptTemplate) {
    return [
        "---",
        `number: ${item.number}`,
        `achievement: ${JSON.stringify(item.work)}`,
        `area: ${JSON.stringify(item.area)}`,
        `year: ${JSON.stringify(item.year)}`,
        `source_list: "BenchCouncil AI100"`,
        `research_status: "pending"`,
        "---",
        "",
        promptTemplate.replaceAll("{{Achievement Name}}", item.work).trim(),
        "",
    ].join("\n");
}

const list = JSON.parse(await readFile(new URL("achievements.json", ROOT_DIR), "utf8"));
const promptTemplate = await readFile(new URL("prompt-template.md", ROOT_DIR), "utf8");

await mkdir(PAGES_DIR, { recursive: true });

const achievements = Number.isInteger(limit) ? list.achievements.slice(0, limit) : list.achievements;
let written = 0;
let skipped = 0;

for (const item of achievements) {
    const pageDir = new URL(`${directoryNameFor(item)}/`, PAGES_DIR);
    await mkdir(new URL("photos/", pageDir), { recursive: true });
    try {
        await writeFile(new URL("index.md", pageDir), pageTemplate(item, promptTemplate), {
            flag: force ? "w" : "wx",
        });
        written += 1;
    } catch (error) {
        if (error.code !== "EEXIST") {
            throw error;
        }
        skipped += 1;
    }
}

console.log(
    `Prepared ${achievements.length} achievement directories in research/ai100/pages/. ` +
        `Wrote ${written}, skipped ${skipped} existing index files.`,
);
