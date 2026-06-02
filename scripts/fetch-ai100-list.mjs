import { mkdir, writeFile } from "node:fs/promises";

const SOURCE_URL = "https://www.benchcouncil.org/evaluation/ai/";
const OUTPUT_DIR = new URL("../research/ai100/", import.meta.url);

function decodeEntities(value) {
    return value
        .replaceAll("&nbsp;", " ")
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&#39;", "'")
        .replaceAll(/\s+/g, " ")
        .trim();
}

function textFromCell(cellHtml) {
    return decodeEntities(
        cellHtml
            .replaceAll(/<br\s*\/?>/gi, " ")
            .replaceAll(/<[^>]+>/g, " "),
    );
}

function slugify(value) {
    return value
        .normalize("NFKD")
        .replaceAll(/['’]/g, "")
        .replaceAll(/&/g, " and ")
        .replaceAll(/[^a-zA-Z0-9]+/g, "-")
        .replaceAll(/^-|-$/g, "")
        .toLowerCase();
}

function parseAchievements(html) {
    const tableStart = html.indexOf('<p style="text-align: center" id="Achievements"');
    const tableEnd = html.indexOf('<p style="text-align: center" id="Contributors"');
    if (tableStart === -1 || tableEnd === -1) {
        throw new Error("Could not locate the Top AI Achievements table.");
    }

    const tableHtml = html.slice(tableStart, tableEnd);
    const rows = [...tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
    const achievements = [];
    let currentArea = "";

    for (const row of rows) {
        const cells = [
            ...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi),
        ].map((match) => textFromCell(match[1]));

        if (cells.length === 8 && cells[0] !== "Area") {
            currentArea = cells[0];
            achievements.push({
                number: achievements.length + 1,
                area: currentArea,
                work: cells[1],
                year: cells[2],
                publications: cells[3],
                citation: cells[4],
                mainContributors: cells[5],
                institution: cells[6],
                country: cells[7],
                slug: slugify(cells[1]),
            });
        } else if (cells.length === 7 && currentArea) {
            achievements.push({
                number: achievements.length + 1,
                area: currentArea,
                work: cells[0],
                year: cells[1],
                publications: cells[2],
                citation: cells[3],
                mainContributors: cells[4],
                institution: cells[5],
                country: cells[6],
                slug: slugify(cells[0]),
            });
        }
    }

    return achievements;
}

function toMarkdown(achievements) {
    const rows = achievements.map((item) =>
        [
            item.number,
            item.area,
            item.work,
            item.year,
            item.publications,
            item.citation,
            item.mainContributors,
            item.institution,
            item.country,
        ]
            .map((value) => String(value).replaceAll("|", "\\|"))
            .join(" | "),
    );

    return [
        "# AI100 Achievement List",
        "",
        `Source: ${SOURCE_URL}`,
        "",
        "| # | Area | Work | Year | Publications | Citation | Main Contributors | Institution | Country |",
        "| - | - | - | - | - | - | - | - | - |",
        ...rows.map((row) => `| ${row} |`),
        "",
    ].join("\n");
}

const response = await fetch(SOURCE_URL);
if (!response.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status}`);
}

const html = await response.text();
const achievements = parseAchievements(html);

await mkdir(OUTPUT_DIR, { recursive: true });
await writeFile(
    new URL("achievements.json", OUTPUT_DIR),
    `${JSON.stringify(
        {
            source: SOURCE_URL,
            fetchedAt: new Date().toISOString(),
            count: achievements.length,
            achievements,
        },
        null,
        2,
    )}\n`,
);
await writeFile(new URL("achievements.md", OUTPUT_DIR), toMarkdown(achievements));

console.log(`Wrote ${achievements.length} achievements to research/ai100/.`);
