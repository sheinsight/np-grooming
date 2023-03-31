import { NormalizedPackageJson } from "read-pkg-up";
import { it, vi, expect, beforeEach, describe } from "vitest";

class Faker {
  static #faker: Faker;

  static newInstance = () => {
    if (!this.#faker) {
      this.#faker = new Faker();
    }
    return this.#faker;
  };

  execa = () => {
    vi.doMock("execa", () => {
      return {
        $: () => {},
      };
    });
    return this;
  };

  enquirer = <T>(answer: T) => {
    vi.doMock("enquirer", () => {
      return {
        default: {
          prompt: () => answer,
        },
      };
    });
    return this;
  };

  writePkg = (pkgMap: Map<string, NormalizedPackageJson | string>) => {
    vi.doMock("write-pkg", () => {
      return {
        writePackageSync: (path: string, pkgJson: NormalizedPackageJson) => {
          pkgMap.set("path", path).set("pkgJson", pkgJson);
        },
      };
    });
    return this;
  };

  utils = () => {
    vi.doMock("./utils", () => {
      return {
        getChoices: () => [],
        loadPackageJson: () => ({
          path: "",
          packageJson: {
            version: null,
          },
        }),
      };
    });
    return this;
  };
}

beforeEach(() => {
  vi.resetModules();
});

describe("bumpAction", async () => {
  it("should bump release version", async () => {
    const pkgMap = new Map<string, NormalizedPackageJson | string>();
    const nextVersion = "2.0.0";
    Faker.newInstance()
      .execa()
      .enquirer({ version: nextVersion })
      .writePkg(pkgMap)
      .utils();
    const { bumpAction } = await import("./bump-action.js");
    await bumpAction("", { prefix: "v" });
    expect(pkgMap.get("pkgJson")).toEqual({ version: nextVersion });
  });

  it("should bump snapshot version", async () => {
    const pkgMap = new Map<string, NormalizedPackageJson | string>();
    const nextVersion = "2.0.0-snapshot.asdwr32";
    Faker.newInstance()
      .execa()
      .enquirer({ version: nextVersion })
      .writePkg(pkgMap)
      .utils();
    const { bumpAction } = await import("./bump-action.js");
    await bumpAction("", { prefix: "v" });
    expect(pkgMap.get("pkgJson")).toEqual(undefined);
  });
});
