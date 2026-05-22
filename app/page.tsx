import { Formulaire } from "./_components/formulaire";

export default function Home() {
  return (
    <>
      <p className="eyebrow">Agence média multi-média · MB Média</p>
      <h1>Décrivez votre projet, recevez la campagne idéale.</h1>
      <p className="subtitle">Votre objectif, votre budget. On compose la campagne idéale.</p>
      <Formulaire />
    </>
  );
}
