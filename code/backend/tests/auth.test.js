import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "testSecret";

// -----------------------------
// MOCK MODULES (ESM style)
// -----------------------------
await jest.unstable_mockModule("../db.js", () => ({
  query: jest.fn(),
}));

await jest.unstable_mockModule("bcrypt", () => ({
  default: {
    compare: jest.fn(),
    hash: jest.fn(),
  },
}));

// -----------------------------
// IMPORT AFTER MOCKING
// -----------------------------
const { query } = await import("../db.js");
const bcrypt = (await import("bcrypt")).default;
const { makeTestServer } = await import("./testServer.js");
const app = makeTestServer();

// -----------------------------
// TESTS
// -----------------------------
describe("AUTH ROUTES", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // REGISTER
  // -----------------------------
  test("register → success", async () => {
    // duplicate check (0 rows → no duplicate)
    query
      .mockResolvedValueOnce({ rows: [] })
      // insert result
      .mockResolvedValueOnce({
        rows: [{ id: 1, username: "cyril", email: "c@x.com" }],
      });

    bcrypt.hash.mockResolvedValue("fakeHash");

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "cyril",
        email: "c@x.com",
        password: "pass123",
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload.username).toBe("cyril");
  });

  test("register → missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "aa" });

    expect(res.status).toBe(400);
  });

  test("register → duplicate username", async () => {
    query.mockResolvedValueOnce({
      rows: [{ username: "cyril", email: "other@x.com" }],
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "cyril",
        email: "c@x.com",
        password: "abc",
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Username already exists");
  });

  // -----------------------------
  // LOGIN
  // -----------------------------
  test("login → success", async () => {
    query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            username: "cyril",
            email: "c@x.com",
            password_hash: "hash123",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // last_login update

    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "cyril", password: "pass123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload.username).toBe("cyril");
  });

  test("login → missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "" });

    expect(res.status).toBe(400);
  });

  test("login → user not found", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "none", password: "123" });

    expect(res.status).toBe(401);
  });

  test("login → invalid password", async () => {
    query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          username: "cyril",
          email: "c@x.com",
          password_hash: "hash",
        },
      ],
    });

    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "cyril", password: "wrongpw" });

    expect(res.status).toBe(401);
  });
  test("register → duplicate email", async () => {
    query.mockResolvedValueOnce({
        rows: [{ username: "other", email: "c@x.com" }],
    });

    const res = await request(app)
        .post("/api/auth/register")
        .send({
        username: "cyril",
        email: "c@x.com",
        password: "pass",
        });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email already exists");
  });

  test("register → duplicate username AND email", async () => {
    query.mockResolvedValueOnce({
        rows: [{ username: "cyril", email: "c@x.com" }],
    });

    const res = await request(app)
        .post("/api/auth/register")
        .send({
        username: "cyril",
        email: "c@x.com",
        password: "1234",
        });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Username and email already exist");
});

test("register → database failure on duplicate check", async () => {
  query.mockRejectedValueOnce(new Error("DB FAIL"));

  const res = await request(app)
    .post("/api/auth/register")
    .send({
      username: "x",
      email: "x@x.com",
      password: "123",
    });

  expect(res.status).toBe(500);
  expect(res.body.error).toBe("Server error");
});

test("register → database failure on insert", async () => {
  query
    .mockResolvedValueOnce({ rows: [] })  // no duplicate
    .mockRejectedValueOnce(new Error("DB FAIL"));  // insert fails

  bcrypt.hash.mockResolvedValue("hash");

  const res = await request(app)
    .post("/api/auth/register")
    .send({
      username: "u",
      email: "u@x.com",
      password: "123",
    });

  expect(res.status).toBe(500);
});



test("login → token payload is correct", async () => {
  query
    .mockResolvedValueOnce({
      rows: [{
        id: 10,
        username: "cyril",
        email: "c@x.com",
        password_hash: "hash",
      }],
    })
    .mockResolvedValueOnce({ rows: [] });

  bcrypt.compare.mockResolvedValue(true);

  const res = await request(app)
    .post("/api/auth/login")
    .send({
      identifier: "cyril",
      password: "123",
    });

  const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);

  expect(payload.id).toBe(10);
  expect(payload.username).toBe("cyril");
  expect(payload.email).toBe("c@x.com");
});
});
