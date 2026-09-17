import { describe, expect, it } from "vitest";
import nginx from "../../../nginx.conf?raw";
import { modernMapTiles } from "./mapStyle";

describe("modern map tiles", () => {
  it("allows the configured tile host in the production image policy", () => {
    const csp = nginx.match(/Content-Security-Policy "([^"]+)"/);

    expect(modernMapTiles.url).toContain("basemaps.cartocdn.com/rastertiles/voyager");
    expect(csp?.[1]).toMatch(/img-src [^;]*https:\/\/\*\.basemaps\.cartocdn\.com/);
  });
});
