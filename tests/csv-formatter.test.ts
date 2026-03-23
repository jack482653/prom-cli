import { describe, expect, it } from "vitest";

import { escapeCsvField, formatCsv } from "../src/formatters/csv.js";

describe("escapeCsvField()", () => {
  it("When value has no special characters, Then returns value as-is", () => {
    expect(escapeCsvField("hello")).toBe("hello");
  });

  it("When value contains a comma, Then wraps in double-quotes", () => {
    expect(escapeCsvField("hello,world")).toBe('"hello,world"');
  });

  it("When value contains a double-quote, Then wraps and doubles the quote", () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it("When value contains a newline, Then wraps in double-quotes", () => {
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("When value contains a carriage return, Then wraps in double-quotes", () => {
    expect(escapeCsvField("line1\rline2")).toBe('"line1\rline2"');
  });

  it("When value is empty string, Then returns empty string", () => {
    expect(escapeCsvField("")).toBe("");
  });
});

describe("formatCsv()", () => {
  const columns = [
    { header: "NAME", key: "name" },
    { header: "VALUE", key: "value" },
  ];

  it("When data is empty, Then returns only header row", () => {
    const result = formatCsv({ columns, data: [] });
    expect(result).toBe("NAME,VALUE");
  });

  it("When data has one row, Then returns header and data row", () => {
    const result = formatCsv({
      columns,
      data: [{ name: "cpu", value: "0.5" }],
    });
    expect(result).toBe("NAME,VALUE\ncpu,0.5");
  });

  it("When data has multiple rows, Then all rows are included", () => {
    const result = formatCsv({
      columns,
      data: [
        { name: "cpu", value: "0.5" },
        { name: "mem", value: "0.8" },
      ],
    });
    expect(result).toBe("NAME,VALUE\ncpu,0.5\nmem,0.8");
  });

  it("When a value contains a comma, Then that field is quoted", () => {
    const result = formatCsv({
      columns,
      data: [{ name: 'key="a,b"', value: "1" }],
    });
    expect(result).toContain('"key=""a,b"""');
  });

  it("When a value is undefined, Then field is empty string", () => {
    const result = formatCsv({
      columns,
      data: [{ name: "cpu" }],
    });
    expect(result).toBe("NAME,VALUE\ncpu,");
  });
});
