/**
 * Import the set logos listed in missings.txt (see download-images.ts) from a
 * local directory, after they have been saved manually from a browser.
 *
 * Usage: bun run import-logos [directory]   (default: ~/Downloads)
 */
import { existsSync, rmSync } from "fs";
import { homedir } from "os";
import { basename, join } from "path";

const MISSINGS_FILE = join(__dirname, "../missings.txt");
const SETS_DIRECTORY = join(__dirname, "../dist/images/sets");
const LOGO_NAME = /^LOGO_expansion_[A-Za-z0-9-]+_[a-z]{2}_[A-Z]{2}\.webp$/;

const isValidWebp = (bytes: Uint8Array): boolean =>
  bytes.length >= 12 &&
  Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
  Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP";

if (!existsSync(MISSINGS_FILE)) {
  console.error("No missings.txt found, run `bun run download` first");
  process.exit(1);
}

const source = process.argv[2] ?? join(homedir(), "Downloads");
const urls = (await Bun.file(MISSINGS_FILE).text())
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const remaining: string[] = [];
for (const url of urls) {
  const name = basename(new URL(url).pathname);
  const from = join(source, name);

  if (!LOGO_NAME.test(name) || !existsSync(from)) {
    remaining.push(url);
    continue;
  }

  const bytes = await Bun.file(from).bytes();
  if (!isValidWebp(bytes)) {
    console.error(`Skipped ${name}: not a valid WebP image`);
    remaining.push(url);
    continue;
  }

  await Bun.write(join(SETS_DIRECTORY, name), bytes);
  console.log(`Imported ${name}`);
}

console.info(
  `${urls.length - remaining.length} imported, ${remaining.length} still missing`,
);

if (remaining.length > 0) {
  await Bun.write(MISSINGS_FILE, remaining.join("\n") + "\n");
  process.exitCode = 1;
} else {
  rmSync(MISSINGS_FILE);
}
