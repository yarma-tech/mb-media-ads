"use client";
import { useStudio } from "./StudioProvider";
import Icon from "./Icon";
import s from "../studio.module.css";

export default function StudioSearch() {
  const { query, setQuery } = useStudio();
  return (
    <label className={`${s.search} ${s.toolbarSearch}`}>
      <Icon name="search" size={16} />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher…"
        aria-label="Rechercher une campagne"
      />
    </label>
  );
}
