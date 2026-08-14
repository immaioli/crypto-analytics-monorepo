import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getHealthPayload } from "./health.js";

describe("GET /health payload", () => {
  it("returns a ready-to-serialize health contract", () => {
    const payload = getHealthPayload();

    assert.equal(payload.status, "ok");
    assert.equal(payload.service, "api");
    assert.equal(typeof payload.timestamp, "string");
    assert.doesNotThrow(() => new Date(payload.timestamp).toISOString());
  });
});
