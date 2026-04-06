import cors from "cors";
import express from "express";
import { pool } from "./db/db.js";

const allowedSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
] as const;

const allowedStatuses = ["pending", "confirmed", "cancelled"] as const;
const adminToken = "admin-token";
const adminPassword = process.env.ADMIN_PASSWORD;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string) {
  return datePattern.test(value) && !Number.isNaN(Date.parse(value));
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (token !== adminToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}

export function createApp() {
  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN?.trim();
  const shouldEnableCors = process.env.NODE_ENV !== "production" || Boolean(corsOrigin);

  if (shouldEnableCors) {
    app.use(
      cors(
        corsOrigin
          ? {
              origin: corsOrigin,
            }
          : undefined,
      ),
    );
  }

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
      },
    });
  });

  app.get("/health", (_req, res) => {
    return res.status(200).json({ status: "ok" });
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
        "SELECT time_slot FROM appointments WHERE date = $1",
        [date],
      );

      return res.status(200).json(result.rows.map((row: { time_slot: string }) => row.time_slot));
    } catch (error) {
      console.error("Failed to fetch appointments", error);
      return res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    const body = req.body as {
      name?: unknown;
      phone?: unknown;
      issue?: unknown;
      date?: unknown;
      time_slot?: unknown;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const issue = typeof body.issue === "string" ? body.issue.trim() : "";
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const timeSlot = typeof body.time_slot === "string" ? body.time_slot.trim() : "";

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
      const result = await pool.query<{
        id: number;
        name: string;
        phone: string;
        issue: string;
        date: string;
        time_slot: string;
      }>(
        "INSERT INTO appointments (name, phone, issue, date, time_slot) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, phone, issue, date, timeSlot],
      );

      return res.status(201).json({
        message: "Appointment booked successfully",
        appointment: result.rows[0],
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

  app.post("/api/admin/login", (req, res) => {
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!adminPassword || password !== adminPassword) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json({ success: true, token: adminToken });
  });

  app.use("/api/admin", requireAdminAuth);

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

  app.patch("/api/admin/appointments/:id", async (req, res) => {
    const appointmentId = req.params.id.trim();
    const nextStatus = typeof req.body?.status === "string" ? req.body.status.trim() : "";

    if (!isValidUuid(appointmentId)) {
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

  return app;
}
