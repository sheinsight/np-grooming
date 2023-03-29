// write your code

import { cac } from "cac";
import enquirer from "enquirer";
import { ReleaseType } from "semver";
import { VersionPromptAnswer, getChoices } from "./utils.js";
import { readPackageUp } from "read-pkg-up";
import { writePackageSync } from "write-pkg";
import { $ } from "execa";

const normalizedReadResult = await readPackageUp();

if (!normalizedReadResult) {
  console.error("No package.json found");
  process.exit(1);
}

const cli = cac("@shined/np-grooming");

cli
  .command("[cwd]", " bump version ")
  .alias("bump")
  .option("--prefix <prefix>", "Prefix for the version", { default: "v" })
  .action(async (_, opt) => {
    const { path, packageJson } = normalizedReadResult;
    const choices = await getChoices(packageJson.version);
    const res = await enquirer.prompt<VersionPromptAnswer>({
      type: "autocomplete",
      name: "version",
      message: `Publish a new version of ${packageJson.name} (${packageJson.version})`,
      choices,
      result: (selected: ReleaseType) =>
        choices.find((x) => x.name === selected)?.value!,
    });

    const tagV = `${opt.prefix}${res.version}`;
    await $`git tag ${tagV}`;
    if (!res.version.includes("snapshot")) {
      packageJson.version = res.version;
      writePackageSync(path, packageJson);
    }
  });

cli.version(normalizedReadResult.packageJson.version).help().parse();
