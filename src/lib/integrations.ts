/**
 * Point d'intégration paiement pay.kadev.ci.
 * La phase 1 ne capture aucun paiement et n'ouvre pas de session de checkout.
 */
export const PAY_KADEV_URL = "https://pay.kadev.ci" as const;

export const INTEGRATIONS = {
  payments: {
    provider: "pay.kadev.ci",
    url: PAY_KADEV_URL,
    captureEnabled: false,
  },
} as const;
