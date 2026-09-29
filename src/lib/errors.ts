export class VehicleNotFoundError extends Error {
  constructor() {
    super("Véhicule introuvable.");
    this.name = "VehicleNotFoundError";
  }
}

export class ResourceNotFoundError extends Error {
  constructor() {
    super("Ressource introuvable.");
    this.name = "ResourceNotFoundError";
  }
}

export class MeterRegressionError extends Error {
  constructor() {
    super("Le nouveau relevé est inférieur au compteur actuel.");
    this.name = "MeterRegressionError";
  }
}
