import { Formulaire } from "./_components/formulaire";

export default function Home() {
  return (
    <>
      <p className="eyebrow">Agence média multi-média · MB Média</p>
      <h1>Décrivez votre projet, recevez la campagne idéale.</h1>
      <p className="subtitle">
        Donnez votre objectif et votre budget (ou votre objectif chiffré). Notre moteur compose la
        meilleure combinaison de médias, programmes et formats, et estime vos résultats avec un
        niveau de confiance.
      </p>
      <Formulaire />
    </>
  );
}
