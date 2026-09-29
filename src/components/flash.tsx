const ERRORS: Record<string, string> = {
  formulaire: "Vérifiez les champs du formulaire.",
  email: "Un compte existe déjà avec cette adresse e-mail.",
  identifiants: "E-mail ou mot de passe incorrect.",
  releve: "Le relevé doit être un entier supérieur ou égal au compteur actuel.",
  vehicule: "Impossible d’ajouter ce véhicule. Vérifiez l’immatriculation et les compteurs.",
  seuil: "Impossible d’enregistrer ce seuil.",
  acces: "Accès refusé.",
};

const SUCCESS: Record<string, string> = {
  releve: "Relevé enregistré. Les seuils franchis créent une alerte.",
  vehicule: "Véhicule ajouté.",
  seuil: "Seuil d’alerte enregistré.",
  alerte: "Alerte marquée comme lue.",
  validee: "Entreprise validée.",
  suspendue: "Entreprise suspendue.",
};

export function Flash({ erreur, ok }: { erreur?: string; ok?: string }) {
  if (erreur) {
    return (
      <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {ERRORS[erreur] ?? "Action impossible."}
      </p>
    );
  }
  if (ok && SUCCESS[ok]) {
    return (
      <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        {SUCCESS[ok]}
      </p>
    );
  }
  return null;
}
