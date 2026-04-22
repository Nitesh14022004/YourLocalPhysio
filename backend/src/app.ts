import cors from "cors";
import { createHmac, timingSafeEqual } from "crypto";
import express from "express";
import { pool } from "./db/db.js";
import { getSiteContent, getSiteContentRevisions, saveSiteContent } from "./services/siteContent.js";

const allowedSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
] as const;

const allowedStatuses = ["pending", "confirmed", "cancelled"] as const;
const adminPassword = process.env.ADMIN_PASSWORD;
const bookingTokenSecret = process.env.BOOKING_TOKEN_SECRET || adminPassword || "booking-token-dev-secret";
const bookingTokenLifetimeMs = 1000 * 60 * 60 * 24 * 30;
const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET || adminPassword || "admin-token-dev-secret";
const adminTokenLifetimeMs = 1000 * 60 * 60 * 8;
const loginRateWindowMs = 1000 * 60 * 10;
const loginRateMaxRequests = 12;
const bruteForceMaxFailures = 5;
const bruteForceLockMs = 1000 * 60 * 15;

const loginRateWindowByKey = new Map<string, { windowStartedAt: number; count: number }>();
const loginFailureStateByKey = new Map<string, { failures: number; lockUntil: number }>();
let appointmentsSourceColumnCached: boolean | null = null;
let reviewsTableReady = false;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string) {
  return datePattern.test(value) && !Number.isNaN(Date.parse(value));
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isValidAppointmentId(value: string) {
  return isValidUuid(value) || /^\d+$/.test(value);
}

function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token || !parseAdminToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}

type BookingTokenPayload = {
  appointmentId: string;
  exp: number;
};

type AdminTokenPayload = {
  exp: number;
  role: "admin";
};

function toBase64Url(data: string) {
  return Buffer.from(data, "utf8").toString("base64url");
}

function fromBase64Url(data: string) {
  return Buffer.from(data, "base64url").toString("utf8");
}

function signTokenPayload(encodedPayload: string) {
  return createHmac("sha256", bookingTokenSecret).update(encodedPayload).digest("base64url");
}

function createBookingToken(appointmentId: string) {
  const payload: BookingTokenPayload = {
    appointmentId,
    exp: Date.now() + bookingTokenLifetimeMs,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signTokenPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseBookingToken(token: string): BookingTokenPayload | null {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signTokenPayload(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as Partial<BookingTokenPayload>;

    if (
      !payload
      || typeof payload.appointmentId !== "string"
      || !payload.appointmentId.trim()
      || typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp < Date.now()) {
      return null;
    }

    return {
      appointmentId: payload.appointmentId,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

function buildManageUrl(req: express.Request, token: string) {
  const configuredFrontend = process.env.FRONTEND_BASE_URL?.trim();
  const requestOrigin = req.headers.origin?.trim();
  const baseUrl = configuredFrontend || requestOrigin || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/book/manage?token=${encodeURIComponent(token)}`;
}

function createAdminToken() {
  const payload: AdminTokenPayload = {
    exp: Date.now() + adminTokenLifetimeMs,
    role: "admin",
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", adminTokenSecret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function parseAdminToken(token: string): AdminTokenPayload | null {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", adminTokenSecret).update(encodedPayload).digest("base64url");
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as Partial<AdminTokenPayload>;

    if (!payload || payload.role !== "admin" || typeof payload.exp !== "number") {
      return null;
    }

    if (payload.exp < Date.now()) {
      return null;
    }

    return { role: "admin", exp: payload.exp };
  } catch {
    return null;
  }
}

function getLoginKey(req: express.Request) {
  return (req.ip || req.socket.remoteAddress || "unknown").trim();
}

function isOverRateLimit(key: string) {
  const now = Date.now();
  const state = loginRateWindowByKey.get(key);

  if (!state || now - state.windowStartedAt > loginRateWindowMs) {
    loginRateWindowByKey.set(key, { windowStartedAt: now, count: 1 });
    return false;
  }

  state.count += 1;
  loginRateWindowByKey.set(key, state);
  return state.count > loginRateMaxRequests;
}

function getBruteForceLockRemainingMs(key: string) {
  const now = Date.now();
  const state = loginFailureStateByKey.get(key);

  if (!state) {
    return 0;
  }

  if (state.lockUntil > now) {
    return state.lockUntil - now;
  }

  if (state.lockUntil > 0) {
    loginFailureStateByKey.delete(key);
  }

  return 0;
}

function recordLoginFailure(key: string) {
  const state = loginFailureStateByKey.get(key) ?? { failures: 0, lockUntil: 0 };
  state.failures += 1;

  if (state.failures >= bruteForceMaxFailures) {
    state.lockUntil = Date.now() + bruteForceLockMs;
    state.failures = 0;
  }

  loginFailureStateByKey.set(key, state);
}

function clearLoginFailureState(key: string) {
  loginFailureStateByKey.delete(key);
}

async function hasAppointmentsSourceColumn() {
  if (appointmentsSourceColumnCached !== null) {
    return appointmentsSourceColumnCached;
  }

  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'appointments' AND column_name = 'source'
    ) AS exists`,
  );

  appointmentsSourceColumnCached = Boolean(result.rows[0]?.exists);
  return appointmentsSourceColumnCached;
}

async function ensureReviewsTable() {
  if (reviewsTableReady) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      message TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'website',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMPTZ NULL
    )
  `);

  reviewsTableReady = true;
}

export function createApp() {
  const app = express();

  const configuredOrigins = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowVercelPreviewDomains = process.env.ALLOW_VERCEL_PREVIEW_DOMAINS === "true";

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow server-to-server calls or non-browser clients without Origin.
        if (!origin) {
          return callback(null, true);
        }

        if (configuredOrigins.length === 0 && process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }

        if (configuredOrigins.includes(origin)) {
          return callback(null, true);
        }

        if (allowVercelPreviewDomains && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.options("*", cors());

  app.use(express.json());

  app.get("/", (_req, res) => {
    return res.status(200).json({
      message: "YourLocalPhysio API Server",
      version: "1.0.0",
      status: "running",
      endpoints: {
        health: "/health",
        bookings: "/api/appointments",
        admin: "/api/admin/appointments",
        siteContent: "/api/site-content",
      },
    });
  });

  app.get("/health", (_req, res) => {
    return res.status(200).json({ status: "ok" });
  });

  app.get("/api/site-content", async (_req, res) => {
    try {
      const siteContent = await getSiteContent();
      return res.status(200).json(siteContent);
    } catch (error) {
      console.error("Failed to fetch site content", error);
      return res.status(500).json({ message: "Failed to fetch site content" });
    }
  });

  app.get("/api/reviews", async (_req, res) => {
    try {
      await ensureReviewsTable();

      const result = await pool.query<{
        id: string;
        name: string;
        rating: number;
        message: string;
        created_at: string;
      }>(
        `SELECT id::text, name, rating, message, created_at
         FROM reviews
         WHERE status = 'approved'
         ORDER BY approved_at DESC NULLS LAST, created_at DESC
         LIMIT 24`,
      );

      return res.status(200).json({ reviews: result.rows });
    } catch (error) {
      console.error("Failed to fetch reviews", error);
      return res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    const body = req.body as {
      name?: unknown;
      rating?: unknown;
      message?: unknown;
      source?: unknown;
    };

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
    const ratingRaw = typeof body.rating === "number" ? body.rating : Number(body.rating);
    const rating = Number.isFinite(ratingRaw) ? Math.trunc(ratingRaw) : NaN;
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
    const source = typeof body.source === "string" && body.source.trim()
      ? body.source.trim().slice(0, 80)
      : "website";

    if (!name || !message || Number.isNaN(rating)) {
      return res.status(400).json({ message: "name, rating and message are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    try {
      await ensureReviewsTable();

      await pool.query(
        `INSERT INTO reviews (name, rating, message, source, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [name, rating, message, source],
      );

      return res.status(201).json({
        success: true,
        message: "Thank you. Your review has been submitted for approval.",
      });
    } catch (error) {
      console.error("Failed to submit review", error);
      return res.status(500).json({ message: "Failed to submit review" });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    const dateParam = req.query.date;

    if (typeof dateParam !== "string" || !dateParam.trim()) {
      return res.status(400).json({ message: "date query parameter is required" });
    }

    const date = dateParam.trim();

    if (!isValidDateString(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    try {
      const result = await pool.query<{ time_slot: string }>(
        "SELECT time_slot FROM appointments WHERE date = $1 AND status IS DISTINCT FROM 'cancelled'",
        [date],
      );

      return res.status(200).json(result.rows.map((row: { time_slot: string }) => row.time_slot));
    } catch (error) {
      console.error("Failed to fetch appointments", error);
      return res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/availability", async (req, res) => {
    const dateParam = req.query.date;

    if (typeof dateParam !== "string" || !dateParam.trim()) {
      return res.status(400).json({ message: "date query parameter is required" });
    }

    const date = dateParam.trim();

    if (!isValidDateString(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    try {
      const result = await pool.query<{ time_slot: string }>(
        "SELECT time_slot FROM appointments WHERE date = $1 AND status IS DISTINCT FROM 'cancelled'",
        [date],
      );

      const bookedSlots = result.rows.map((row) => row.time_slot);
      const remainingSlots = Math.max(allowedSlots.length - bookedSlots.length, 0);

      return res.status(200).json({
        date,
        bookedSlots,
        remainingSlots,
        totalSlots: allowedSlots.length,
        lastSlotLeft: remainingSlots === 1,
      });
    } catch (error) {
      console.error("Failed to fetch slot availability", error);
      return res.status(500).json({ message: "Failed to fetch slot availability" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    const body = req.body as {
      name?: unknown;
      phone?: unknown;
      issue?: unknown;
      date?: unknown;
      time_slot?: unknown;
      source?: unknown;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const issue = typeof body.issue === "string" ? body.issue.trim() : "";
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const timeSlot = typeof body.time_slot === "string" ? body.time_slot.trim() : "";
    const source = typeof body.source === "string" && body.source.trim()
      ? body.source.trim().slice(0, 80)
      : "direct";

    if (!name || !phone || !issue || !date || !timeSlot) {
      return res.status(400).json({ message: "name, phone, issue, date and time_slot are required" });
    }

    if (!isValidDateString(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    if (!allowedSlots.includes(timeSlot as (typeof allowedSlots)[number])) {
      return res.status(400).json({ error: "Invalid time slot" });
    }

    try {
      const sourceColumnExists = await hasAppointmentsSourceColumn();
      const result = sourceColumnExists
        ? await pool.query<{
            id: string;
            name: string;
            phone: string;
            issue: string;
            date: string;
            time_slot: string;
          }>(
          "INSERT INTO appointments (name, phone, issue, date, time_slot, source) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [name, phone, issue, date, timeSlot, source],
        )
        : await pool.query<{
            id: string;
            name: string;
            phone: string;
            issue: string;
            date: string;
            time_slot: string;
          }>(
          "INSERT INTO appointments (name, phone, issue, date, time_slot) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [name, phone, issue, date, timeSlot],
        );

      const appointment = result.rows[0];
      const token = createBookingToken(appointment.id);
      const manageUrl = buildManageUrl(req, token);

      return res.status(201).json({
        message: "Appointment booked successfully",
        appointment,
        manage: {
          token,
          url: manageUrl,
        },
      });
    } catch (error) {
      const databaseError = error as { code?: string };

      if (databaseError.code === "23505") {
        return res.status(409).json({ message: "Slot already booked" });
      }

      console.error("Failed to create appointment", error);
      return res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.get("/api/appointments/manage", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
    const payload = parseBookingToken(token);

    if (!payload) {
      return res.status(401).json({ message: "Invalid or expired manage link" });
    }

    try {
      const result = await pool.query(
        `SELECT id, name, phone, issue, date, time_slot, status, created_at
         FROM appointments
         WHERE id = $1`,
        [payload.appointmentId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      return res.status(200).json({ appointment: result.rows[0] });
    } catch (error) {
      console.error("Failed to fetch managed appointment", error);
      return res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments/cancel", async (req, res) => {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const payload = parseBookingToken(token);

    if (!payload) {
      return res.status(401).json({ message: "Invalid or expired manage link" });
    }

    try {
      const result = await pool.query("DELETE FROM appointments WHERE id = $1", [payload.appointmentId]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Failed to cancel appointment", error);
      return res.status(500).json({ message: "Failed to cancel appointment" });
    }
  });

  app.patch("/api/appointments/reschedule", async (req, res) => {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const date = typeof req.body?.date === "string" ? req.body.date.trim() : "";
    const timeSlot = typeof req.body?.time_slot === "string" ? req.body.time_slot.trim() : "";
    const payload = parseBookingToken(token);

    if (!payload) {
      return res.status(401).json({ message: "Invalid or expired manage link" });
    }

    if (!date || !timeSlot) {
      return res.status(400).json({ message: "date and time_slot are required" });
    }

    if (!isValidDateString(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    if (!allowedSlots.includes(timeSlot as (typeof allowedSlots)[number])) {
      return res.status(400).json({ message: "Invalid time slot" });
    }

    try {
      const result = await pool.query(
        `UPDATE appointments
         SET date = $1, time_slot = $2, status = 'pending'
         WHERE id = $3
         RETURNING id, name, phone, issue, date, time_slot, status, created_at`,
        [date, timeSlot, payload.appointmentId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      return res.status(200).json({ appointment: result.rows[0] });
    } catch (error) {
      const databaseError = error as { code?: string };

      if (databaseError.code === "23505") {
        return res.status(409).json({ message: "Selected slot is already booked" });
      }

      console.error("Failed to reschedule appointment", error);
      return res.status(500).json({ message: "Failed to reschedule appointment" });
    }
  });

  app.post("/api/admin/login", (req, res) => {
    const loginKey = getLoginKey(req);
    const rateLimited = isOverRateLimit(loginKey);

    if (rateLimited) {
      return res.status(429).json({ message: "Too many login attempts. Please wait and try again." });
    }

    const lockRemainingMs = getBruteForceLockRemainingMs(loginKey);
    if (lockRemainingMs > 0) {
      return res.status(429).json({
        message: "Too many failed attempts. Please try again later.",
        retryAfterSeconds: Math.ceil(lockRemainingMs / 1000),
      });
    }

    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!adminPassword || password !== adminPassword) {
      recordLoginFailure(loginKey);
      return res.status(401).json({ message: "Unauthorized" });
    }

    clearLoginFailureState(loginKey);
    const token = createAdminToken();

    return res.status(200).json({ success: true, token, expiresInMs: adminTokenLifetimeMs });
  });

  app.use("/api/admin", requireAdminAuth);

  app.get("/api/admin/session", (_req, res) => {
    return res.status(200).json({ ok: true });
  });

  app.get("/api/admin/appointments", async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, name, phone, issue, date, time_slot, status, created_at
         FROM appointments
         ORDER BY date ASC, CASE time_slot
           WHEN '09:00 AM' THEN 1
           WHEN '10:00 AM' THEN 2
           WHEN '11:00 AM' THEN 3
           WHEN '12:00 PM' THEN 4
           WHEN '02:00 PM' THEN 5
           WHEN '03:00 PM' THEN 6
           ELSE 7
         END ASC, created_at ASC`,
      );

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Failed to fetch admin appointments", error);
      return res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/admin/reviews", async (_req, res) => {
    try {
      await ensureReviewsTable();

      const result = await pool.query<{
        id: string;
        name: string;
        rating: number;
        message: string;
        source: string;
        status: string;
        created_at: string;
      }>(
        `SELECT id::text, name, rating, message, source, status, created_at
         FROM reviews
         ORDER BY created_at DESC
         LIMIT 200`,
      );

      return res.status(200).json({ reviews: result.rows });
    } catch (error) {
      console.error("Failed to fetch admin reviews", error);
      return res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.patch("/api/admin/reviews/:id", async (req, res) => {
    const reviewId = req.params.id.trim();
    const status = typeof req.body?.status === "string" ? req.body.status.trim() : "";

    if (!/^\d+$/.test(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    try {
      await ensureReviewsTable();

      const result = await pool.query(
        `UPDATE reviews
         SET status = $1,
             approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END
         WHERE id = $2
         RETURNING id::text, name, rating, message, source, status, created_at`,
        [status, Number(reviewId)],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Review not found" });
      }

      return res.status(200).json({ review: result.rows[0] });
    } catch (error) {
      console.error("Failed to update review", error);
      return res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete("/api/admin/reviews/:id", async (req, res) => {
    const reviewId = req.params.id.trim();

    if (!/^\d+$/.test(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    try {
      await ensureReviewsTable();

      const result = await pool.query("DELETE FROM reviews WHERE id = $1", [Number(reviewId)]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Review not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Failed to delete review", error);
      return res.status(500).json({ message: "Failed to delete review" });
    }
  });

  app.patch("/api/admin/appointments/:id", async (req, res) => {
    const appointmentId = req.params.id.trim();
    const nextStatus = typeof req.body?.status === "string" ? req.body.status.trim() : "";

    if (!isValidAppointmentId(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    if (!nextStatus) {
      return res.status(400).json({ message: "status is required" });
    }

    if (!allowedStatuses.includes(nextStatus as (typeof allowedStatuses)[number])) {
      return res.status(400).json({ message: "Invalid status" });
    }

    try {
      const result = await pool.query(
        `UPDATE appointments
         SET status = $1
         WHERE id = $2
         RETURNING id, name, phone, issue, date, time_slot, status, created_at`,
        [nextStatus, appointmentId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Failed to update appointment status", error);
      return res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/admin/appointments/:id", async (req, res) => {
    const appointmentId = req.params.id.trim();

    if (!isValidAppointmentId(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    try {
      const result = await pool.query("DELETE FROM appointments WHERE id = $1", [appointmentId]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Failed to delete appointment", error);
      return res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  app.get("/api/admin/analytics/overview", async (_req, res) => {
    try {
      const [weeklyResult, totalsResult] = await Promise.all([
        pool.query<{ week_start: string; bookings: string }>(
          `SELECT TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') AS week_start,
                  COUNT(*)::text AS bookings
           FROM appointments
           WHERE created_at >= NOW() - INTERVAL '56 days'
           GROUP BY 1
           ORDER BY 1 ASC`,
        ),
        pool.query<{ total: string; confirmed: string }>(
          `SELECT COUNT(*)::text AS total,
                  COUNT(*) FILTER (WHERE status = 'confirmed')::text AS confirmed
           FROM appointments`,
        ),
      ]);

      const sourceColumnExists = await hasAppointmentsSourceColumn();
      const sourceResult = sourceColumnExists
        ? await pool.query<{ source: string | null; count: string }>(
          `SELECT COALESCE(NULLIF(TRIM(source), ''), 'direct') AS source,
                  COUNT(*)::text AS count
           FROM appointments
           GROUP BY 1
           ORDER BY 2 DESC`,
        )
        : await pool.query<{ source: string; count: string }>(
          `SELECT 'direct' AS source, COUNT(*)::text AS count FROM appointments`,
        );

      const total = Number(totalsResult.rows[0]?.total ?? 0);
      const confirmed = Number(totalsResult.rows[0]?.confirmed ?? 0);
      const conversionRate = total > 0 ? Math.round((confirmed / total) * 10000) / 100 : 0;

      return res.status(200).json({
        bookingsPerWeek: weeklyResult.rows.map((row) => ({
          weekStart: row.week_start,
          bookings: Number(row.bookings),
        })),
        sourceBreakdown: sourceResult.rows.map((row) => ({
          source: String(row.source || "direct"),
          count: Number(row.count),
        })),
        totals: {
          total,
          confirmed,
          conversionRate,
        },
      });
    } catch (error) {
      console.error("Failed to fetch analytics overview", error);
      return res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  app.get("/api/admin/export/appointments", async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, name, phone, issue, date, time_slot, status, created_at
         FROM appointments
         ORDER BY created_at DESC`,
      );

      return res.status(200).json({
        exportedAt: new Date().toISOString(),
        count: result.rowCount ?? 0,
        appointments: result.rows,
      });
    } catch (error) {
      console.error("Failed to export appointments", error);
      return res.status(500).json({ message: "Failed to export appointments" });
    }
  });

  app.get("/api/admin/export/site-content-revisions", async (_req, res) => {
    try {
      const [current, revisions] = await Promise.all([getSiteContent(), getSiteContentRevisions()]);

      return res.status(200).json({
        exportedAt: new Date().toISOString(),
        current,
        revisions,
      });
    } catch (error) {
      console.error("Failed to export site-content revisions", error);
      return res.status(500).json({ message: "Failed to export site-content revisions" });
    }
  });

  app.get("/api/admin/site-content", async (_req, res) => {
    try {
      const siteContent = await getSiteContent();
      return res.status(200).json(siteContent);
    } catch (error) {
      console.error("Failed to fetch site content", error);
      return res.status(500).json({ message: "Failed to fetch site content" });
    }
  });

  app.put("/api/admin/site-content", async (req, res) => {
    try {
      const siteContent = await saveSiteContent(req.body);
      return res.status(200).json(siteContent);
    } catch (error) {
      console.error("Failed to save site content", error);
      return res.status(500).json({ message: "Failed to save site content" });
    }
  });

  return app;
}
