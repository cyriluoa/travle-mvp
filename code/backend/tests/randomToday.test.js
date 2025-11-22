import { jest } from "@jest/globals";
import request from "supertest";

process.env.JWT_SECRET = "testSecret";

// -----------------------------
// Mock DB
// -----------------------------
await jest.unstable_mockModule("../db.js", () => ({
  query: jest.fn(),
}));
const { query } = await import("../db.js");

// -----------------------------
// Import route server AFTER mocks
// -----------------------------
const { makeTestServer } = await import("./testServer.js");
const app = makeTestServer();

const today = new Date().toISOString().slice(0, 10);

// -----------------------------
// TESTS
// -----------------------------
describe("GET /api/random-today", () => {
  beforeEach(() => {
    // reset mock implementation + call history + once-queues
    jest.resetAllMocks();
  });

  // -------------------------------------------------------------------
  // 1. DB has today’s row → return it WITHOUT generating anything
  // -------------------------------------------------------------------
  test("returns existing DB row for today", async () => {
    query.mockResolvedValueOnce({
      rows: [
        {
          date: today,
          start_country: "A",
          end_country: "D",
          route: ["A", "B", "C", "D"],
          route_length: 3,
        },
      ],
    });

    const res = await request(app).get("/api/random-today");

    expect(res.status).toBe(200);
    expect(res.body.date).toBe(today);
    expect(res.body.start).toBe("A");
    expect(res.body.end).toBe("D");
    expect(Array.isArray(res.body.path)).toBe(true);
  });

  // -------------------------------------------------------------------
  // 2. No row in DB → generate → insert → return inserted row
  // -------------------------------------------------------------------
  test("creates today’s row when DB is empty", async () => {
    // 1st SELECT → empty
    query.mockResolvedValueOnce({ rows: [] });

    // INSERT → returns the generated row
    query.mockResolvedValueOnce({
      rows: [
        {
          date: today,
          start_country: "X",
          end_country: "Y",
          route: ["X", "P", "Q", "Y"],
          route_length: 3,
        },
      ],
    });

    const res = await request(app).get("/api/random-today");

    expect(res.status).toBe(200);
    expect(res.body.date).toBe(today);
    expect(res.body.start).toBe("X");
    expect(res.body.end).toBe("Y");
    expect(Array.isArray(res.body.path)).toBe(true);
  });

  // -------------------------------------------------------------------
  // 3. Race condition: INSERT returns no rows → fallback SELECT
  // -------------------------------------------------------------------
  test("handles race condition where another request inserts first", async () => {
    // First SELECT → empty
    query.mockResolvedValueOnce({ rows: [] });

    // INSERT → ON CONFLICT DO NOTHING → no rows
    query.mockResolvedValueOnce({ rows: [] });

    // Fallback SELECT → row inserted by someone else
    query.mockResolvedValueOnce({
      rows: [
        {
          date: today,
          start_country: "B",
          end_country: "Z",
          route: ["B", "C", "Z"],
          route_length: 2,
        },
      ],
    });

    const res = await request(app).get("/api/random-today");

    expect(res.status).toBe(200);
    expect(res.body.date).toBe(today);
    expect(res.body.start).toBe("B");
    expect(res.body.end).toBe("Z");
  });

  // -------------------------------------------------------------------
  // 4. DB throws → return 500
  // -------------------------------------------------------------------
  test("handles DB failure", async () => {
    query.mockRejectedValueOnce(new Error("DB exploded"));

    const res = await request(app).get("/api/random-today");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Unable to fetch today's route");
  });
});
