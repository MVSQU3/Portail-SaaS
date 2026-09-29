export const METER_METRICS = ["KILOMETRES", "HEURES"] as const;
export type MeterMetric = (typeof METER_METRICS)[number];

export type ThresholdRule = {
  id: string;
  companyId: string;
  vehicleId: string | null;
  metric: MeterMetric;
  threshold: number;
  name: string;
  active: boolean;
};

export type FiredRule = {
  ruleId: string;
  name: string;
  threshold: number;
  metric: MeterMetric;
};

export function didCrossThreshold(
  previous: number | null,
  next: number,
  threshold: number,
): boolean {
  if (!Number.isInteger(next) || !Number.isInteger(threshold)) return false;
  if (threshold <= 0 || next < threshold) return false;
  if (previous === null) return true;
  if (!Number.isInteger(previous)) return false;
  return previous < threshold && next >= threshold;
}

export function isMeterProgression(previous: number, next: number): boolean {
  return Number.isInteger(previous) && Number.isInteger(next) && next >= previous && next >= 0;
}

export function evaluateMeterReading(input: {
  companyId: string;
  vehicleId: string;
  metric: MeterMetric;
  previous: number | null;
  next: number;
  rules: ThresholdRule[];
}): FiredRule[] {
  if (!Number.isInteger(input.next)) return [];

  return input.rules
    .filter(
      (rule) =>
        rule.active &&
        rule.companyId === input.companyId &&
        rule.metric === input.metric &&
        (rule.vehicleId === null || rule.vehicleId === input.vehicleId) &&
        didCrossThreshold(input.previous, input.next, rule.threshold),
    )
    .map((rule) => ({
      ruleId: rule.id,
      name: rule.name,
      threshold: rule.threshold,
      metric: rule.metric,
    }));
}

export type InitialCrossing = FiredRule & { value: number };

/** Compteurs initiaux d’un véhicule neuf : previous null, comme un premier relevé. */
export function evaluateInitialMeters(input: {
  companyId: string;
  vehicleId: string;
  currentKm: number;
  currentHours: number;
  rules: ThresholdRule[];
}): InitialCrossing[] {
  const readings: Array<{ metric: MeterMetric; value: number }> = [];
  if (input.currentKm > 0) readings.push({ metric: "KILOMETRES", value: input.currentKm });
  if (input.currentHours > 0) readings.push({ metric: "HEURES", value: input.currentHours });

  return readings.flatMap((reading) =>
    evaluateMeterReading({
      companyId: input.companyId,
      vehicleId: input.vehicleId,
      metric: reading.metric,
      previous: null,
      next: reading.value,
      rules: input.rules,
    }).map((fired) => ({ ...fired, value: reading.value })),
  );
}

export function buildAlertCopy(input: {
  ruleName: string;
  vehicleLabel: string;
  registration: string;
  metric: MeterMetric;
  value: number;
  threshold: number;
}): { title: string; message: string; emailSubject: string; emailBody: string } {
  const unit = input.metric === "KILOMETRES" ? "km" : "h";
  const metricName = input.metric === "KILOMETRES" ? "kilomètres" : "heures";
  const message = `${input.vehicleLabel} (${input.registration}) a atteint ${input.value} ${unit}. Seuil : ${input.threshold} ${unit}.`;
  return {
    title: input.ruleName,
    message,
    emailSubject: `Alerte FleetCare — ${input.ruleName}`,
    emailBody: [
      "Bonjour,",
      "",
      `Une alerte a été déclenchée pour ${input.vehicleLabel} (${input.registration}).`,
      `Le compteur ${metricName} est passé à ${input.value} ${unit} et atteint ou dépasse le seuil de ${input.threshold} ${unit}.`,
      `Règle : ${input.ruleName}.`,
      "",
      "Connectez-vous à FleetCare pour consulter le tableau de bord.",
    ].join("\n"),
  };
}
