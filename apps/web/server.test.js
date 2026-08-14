import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { html } from "./server.js";

describe("web scaffold", () => {
  it("renders a Phase 1 placeholder that points at the API", () => {
    assert.match(html, /Crypto Dashboard/);
    assert.match(html, /API target/);
  });
});
