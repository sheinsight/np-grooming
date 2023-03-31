// write your code

import { cac } from "cac";
import { loadPackageJson } from "./utils.js";
import { bumpAction } from "./bump-action.js";

const cli = cac("@shined/np-grooming");

cli
  .command("[cwd]", " bump version ")
  .alias("bump")
  .option("--prefix <prefix>", "Prefix for the version", { default: "v" })
  .action(bumpAction);

cli.help().parse();
