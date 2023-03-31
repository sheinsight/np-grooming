import semver from "semver";
import { $ } from "execa";
import process from "node:process";
import { readPackageUp } from "read-pkg-up";

export async function getChoices(version: string) {
  const hashStr = await getShortHashStr();
  return (<const>[
    "major",
    "minor",
    "patch",
    "premajor",
    "preminor",
    "prepatch",
    "prerelease",
    "snapshot",
  ]).map((x) => {
    if (x === "snapshot") {
      return {
        name: <const>"snapshot",
        value: `0.0.0-snapshot.${hashStr}`,
        hint: `
              ( TODO: 未实现 )
              snapshot版本不会变更本地版本，仅仅只是打 Git Tag
          `,
      };
    } else {
      const newVersion = semver.inc(version, x, "beta");
      return {
        name: x,
        value: newVersion!,
        hint: `(${newVersion})`,
      };
    }
  });
}

export async function getShortHashStr() {
  const list = await $`git status --porcelain`;
  if (list.stdout.trim() === "") {
    console.error("You have uncommitted changes");
    process.exit(1);
  } else {
    const hash = await $`git rev-parse --short=7 HEAD`;
    return hash.stdout.trim();
  }
}

export async function loadPackageJson() {
  const normalizedReadResult = await readPackageUp();

  if (!normalizedReadResult) {
    console.error("No package.json found");
    process.exit(1);
  }

  return normalizedReadResult;
}

export function transformAnswer<T extends { [name: string]: string }>(
  choices: T[],
  selected: string
) {
  return choices.find((x) => x.name === selected)?.value!;
}
