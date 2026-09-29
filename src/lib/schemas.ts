import { z } from "zod";

export const signupSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  managerName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(100),
});

export const vehicleSchema = z.object({
  label: z.string().trim().min(2).max(80),
  registration: z.string().trim().min(2).max(32),
  brand: z.string().trim().max(40).optional().or(z.literal("")),
  model: z.string().trim().max(40).optional().or(z.literal("")),
  year: z.string().trim().optional().or(z.literal("")),
  currentKm: z.coerce.number().int().min(0).max(10_000_000),
  currentHours: z.coerce.number().int().min(0).max(1_000_000),
});

export const readingSchema = z.object({
  vehicleId: z.string().min(1),
  metric: z.enum(["KILOMETRES", "HEURES"]),
  value: z.coerce.number().int().min(0).max(10_000_000),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export const ruleSchema = z.object({
  vehicleId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  metric: z.enum(["KILOMETRES", "HEURES"]),
  threshold: z.coerce.number().int().positive().max(10_000_000),
});

export function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function parseYear(value: string | undefined): number | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  const year = Number(trimmed);
  if (!Number.isInteger(year) || year < 1980 || year > 2100) {
    return null;
  }
  return year;
}
