import { it, vi, expect, beforeEach, describe } from "vitest";
import semver from "semver";

class Faker {
  static #fakeClient?: Faker;

  private constructor() {}

  static newInstance = () => {
    if (!this.#fakeClient) {
      this.#fakeClient = new Faker();
    }
    return this.#fakeClient;
  };

  execa = (res: object) => {
    vi.doMock("execa", () => {
      return {
        $: () => res,
      };
    });
    return this;
  };

  process = (fn: Function) => {
    vi.doMock("node:process", () => {
      return {
        default: {
          exit: fn,
        },
      };
    });
    return this;
  };

  readPackageUp = (res: object | undefined) => {
    vi.doMock("read-pkg-up", () => {
      return {
        readPackageUp: () => res,
      };
    });
    return this;
  };
}

beforeEach(() => {
  vi.resetModules();
});

describe("getShortHashStr", () => {
  it("should not call process.exit when there are no uncommitted changes", async () => {
    const processExitFaker = vi.fn();
    Faker.newInstance().execa({ stdout: "" }).process(processExitFaker);
    const { getShortHashStr } = await import("./utils.js");
    await getShortHashStr();
    expect(processExitFaker).toHaveBeenCalled();
  });

  it("should return a hash string of length 7", async () => {
    Faker.newInstance().execa({ stdout: "abcdefg" });
    const { getShortHashStr } = await import("./utils.js");
    const hash = await getShortHashStr();
    expect(hash?.length).toBe(7);
  });
});

describe("getChoices", () => {
  it("should return correct version choices", async () => {
    Faker.newInstance().execa({ stdout: "abcdefg" });
    const { getChoices } = await import("./utils.js");
    const version = "1.0.0";
    const choices = await getChoices(version);
    const releaseTypes = <const>[
      "major",
      "minor",
      "patch",
      "premajor",
      "preminor",
      "prepatch",
      "prerelease",
      "snapshot",
    ];
    expect(choices.length).toBe(releaseTypes.length); // 8 choices (including snapshot)
    for (const [_, choice] of choices.entries()) {
      if (choice.name === "snapshot") {
        const isSnapshot = choice.name === "snapshot";
        expect(isSnapshot).toBe(true);
        expect(choice.value.startsWith("0.0.0-snapshot.")).toBe(true);
      } else {
        const newVersion = semver.inc(version, choice.name, "beta");
        expect(choice.value).toBe(newVersion);
        expect(choice.hint).toBe(`(${newVersion})`);
      }
    }
  });
});

describe("loadPackageJson", () => {
  it("should process killed when no package.json found", async () => {
    const exit = vi.fn();
    Faker.newInstance().readPackageUp(undefined).process(exit);
    const { loadPackageJson } = await import("./utils.js");
    expect(exit).not.toHaveBeenCalled();
    await loadPackageJson();
    expect(exit).toHaveBeenCalled();
  });
});

describe("transformAnswer", () => {
  it("should return correct answer", async () => {
    const { transformAnswer } = await import("./utils.js");
    const choices = [
      {
        name: "major",
        value: "2.0.0",
        hint: "(2.0.0)",
      },
      {
        name: "minor",
        value: "1.1.0",
        hint: "(1.1.0)",
      },
      {
        name: "patch",
        value: "1.0.1",
        hint: "(1.0.1)",
      },
      {
        name: "premajor",
        value: "2.0.0-beta.0",
        hint: "(2.0.0-beta.0)",
      },
      {
        name: "preminor",
        value: "1.1.0-beta.0",
        hint: "(1.1.0-beta.0)",
      },
      {
        name: "prepatch",
        value: "1.0.1-beta.0",
        hint: "(1.0.1-beta.0)",
      },
      {
        name: "prerelease",
        value: "1.0.0-beta.0",
        hint: "(1.0.0-beta.0)",
      },
      {
        name: "snapshot",
        value: "0.0.0-snapshot.abcdefg",
        hint: "",
      },
    ];
    const answer = "patch";
    const result = transformAnswer(choices, answer);
    expect(result).toBe("1.0.1");
  });
});
