/**
 * Point d'intégration paiement pay.kadev.ci.
 * L'application redirige vers cette URL et ne capture aucun paiement.
 */
export const PAY_KADEV_URL = "https://pay.kadev.ci" as const;

export const INTEGRATIONS = {
  payments: {
    provider: "pay.kadev.ci",
    url: PAY_KADEV_URL,
    captureEnabled: false,
  },
} as const;
