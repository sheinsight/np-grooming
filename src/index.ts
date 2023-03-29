// write your code

import { cac } from "cac";
import semver from "semver";
import path from "node:path";
import fs from "node:fs/promises";
import { dirname } from "./utils.js";

const __dirname = dirname(import.meta.url);

const cli = cac();

cli.command("[...a]", " bump version ").action(async () => {
  console.log(path.join(__dirname));
});

cli.parse();
