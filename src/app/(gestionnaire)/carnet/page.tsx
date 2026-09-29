import { PhaseTwoPlaceholder } from "@/components/placeholder";

export const metadata = { title: "Carnet d’entretien" };

export default function MaintenancePage() {
  return (
    <PhaseTwoPlaceholder
      title="Carnet d’entretien"
      description="Le carnet d’entretien n’est pas ouvert dans cette version. L’enregistrement des opérations, des coûts en francs CFA et de l’historique par véhicule sera ajouté ensuite. Aucune saisie n’est possible ici pour le moment."
    />
  );
}
