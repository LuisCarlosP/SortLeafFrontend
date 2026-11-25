import { describe, expect, it } from "vitest";
import { combineRegions, normalizeAnalysis, refineMaterial } from "../src/features/vision/analysis-schema";

describe("photo sorting decisions", () => {
  it("only resolves the unclear bottle when that region supplies an unambiguous material", () => {
    const whole = normalizeAnalysis("A plastic bottle and another bottle.");
    const unclear = normalizeAnalysis("A wine bottle.");
    const item = unclear.items[0];
    expect(refineMaterial(unclear, item, "The jar is made of glass.")).toBe(unclear);
    expect(refineMaterial(unclear, item, "Glass or plastic")).toBe(unclear);
    expect(combineRegions(whole, [whole, unclear]).items.map(i => i.material)).toEqual(["plastic", "unknown"]);
    const verified = refineMaterial(unclear, item, "Glass.");
    expect(combineRegions(whole, [whole, verified]).items.map(i => i.material)).toEqual(["plastic", "glass"]);
  });
  it("rejects the reported malformed tree trunk result without presenting a JSON error", () => {
    expect(normalizeAnalysis('{"product":"tree trunk" "components":[]}')).toMatchObject({ outcome: "out_of_scope", items: [] });
  });
  it("keeps materials paired with objects, including unsuitable and special waste in a mixed photo", () => {
    const scan = normalizeAnalysis("A plastic bottle, a metal can, a battery and a used tissue.");
    expect(scan.outcome).toBe("identified");
    expect(scan.items).toEqual([
      { object: "bottle", material: "plastic", route: "likely_recyclable" },
      { object: "can", material: "metal", route: "likely_recyclable" },
      { object: "battery", material: "composite", route: "special_collection" },
      { object: "sanitary_waste", material: "unknown", route: "not_recyclable" },
    ]);
  });
  it("keeps different materials for the same kind of object and ignores examples", () => {
    expect(normalizeAnalysis("A plastic bottle and a glass bottle. The bottles are used for other containers.").items).toHaveLength(2);
  });
  it("accepts material observations across sentences without inventing a resin or the material of a cap", () => {
    expect(normalizeAnalysis("A bottle with a blue cap. The bottle is made of plastic.").items).toEqual([
      { object: "bottle", material: "plastic", route: "likely_recyclable" },
      { object: "cap", material: "unknown", route: "check_locally" },
    ]);
  });
  it.each([
    ["A diaper and some wet wipes.", "not_recyclable"],
    ["A banana peel.", "not_recyclable"],
    ["A pesticide bottle.", "identified"],
    ["A dog in a forest.", "out_of_scope"],
    ["The image is blurry.", "uncertain"],
    ["A clear bottle.", "uncertain"],
    ["x".repeat(16001), "uncertain"],
  ])("classifies %s conservatively", (caption, outcome) => {
    expect(normalizeAnalysis(caption)).toMatchObject({ outcome, requires_verification: true });
  });
  it("keeps pesticide packaging out of ordinary collection", () => {
    expect(normalizeAnalysis("A plastic pesticide bottle.").items).toEqual([{ object: "chemical_container", material: "plastic", route: "special_collection" }]);
  });
});
