import { $ } from "execa";
import enquirer from "enquirer";
import { writePackageSync } from "write-pkg";
import { getChoices, loadPackageJson, transformAnswer } from "./utils.js";

export interface PrefixOpt {
  prefix: string;
}

export interface VersionPromptAnswer {
  version: "snapshot" | string;
}

export async function bumpAction(_: string, opt: PrefixOpt) {
  const normalizedReadResult = await loadPackageJson();
  const { path, packageJson } = normalizedReadResult;
  const choices = await getChoices(packageJson.version);
  const answer = await enquirer.prompt<VersionPromptAnswer>({
    type: "autocomplete",
    name: "version",
    message: `Publish a new version of ${packageJson.name} (${packageJson.version})`,
    choices,
    /* c8 ignore next */
    result: (selected) => transformAnswer(choices, selected),
  });
  const tagV = `${opt.prefix}${answer.version}`;
  if (!answer.version.includes("snapshot")) {
    packageJson.version = answer.version;
    writePackageSync(path, packageJson);
    await $`git add .`;
    const message = `chore: bump version to ${answer.version}`;
    await $`git commit -m '${message}'`;
  }
  await $`git tag ${tagV}`;
}
