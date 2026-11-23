"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { INITIAL_CAMPAIGNS } from "@/lib/campaign-studio/fixtures";
import {
  restoreCampaigns,
  serializeCampaigns,
  STORAGE_KEY,
} from "@/lib/campaign-studio/storage";
import type { BrandFilter, StudioCampaign } from "@/lib/campaign-studio/types";

interface State {
  campaigns: StudioCampaign[];
  storage: "loading" | "ready" | "unavailable";
}
type Action =
  | { type: "hydrate"; campaigns: StudioCampaign[]; storage: State["storage"] }
  | { type: "update"; campaign: StudioCampaign }
  | { type: "reset" }
  | { type: "unavailable" };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { campaigns: action.campaigns, storage: action.storage };
    case "update":
      return {
        ...state,
        campaigns: state.campaigns.map((c) =>
          c.id === action.campaign.id ? action.campaign : c,
        ),
      };
    case "reset":
      return { ...state, campaigns: INITIAL_CAMPAIGNS };
    case "unavailable":
      return { ...state, storage: "unavailable" };
  }
}
interface StudioContext extends State {
  brand: BrandFilter;
  setBrand: (brand: BrandFilter) => void;
  query: string;
  setQuery: (query: string) => void;
  update: (campaign: StudioCampaign) => void;
  reset: () => void;
  visibleCampaigns: StudioCampaign[];
  notice: string;
  notify: (text: string) => void;
}
const Context = createContext<StudioContext | null>(null);
export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    campaigns: INITIAL_CAMPAIGNS,
    storage: "loading",
  });
  const [brand, setBrand] = useState<BrandFilter>("all");
  const [query, setQuery] = useState("");
  const [notice, notify] = useState("");
  useEffect(() => {
    try {
      dispatch({
        type: "hydrate",
        campaigns: restoreCampaigns(localStorage.getItem(STORAGE_KEY)),
        storage: "ready",
      });
    } catch {
      dispatch({
        type: "hydrate",
        campaigns: INITIAL_CAMPAIGNS,
        storage: "unavailable",
      });
    }
  }, []);
  useEffect(() => {
    if (state.storage !== "ready") return;
    try {
      localStorage.setItem(STORAGE_KEY, serializeCampaigns(state.campaigns));
    } catch {
      dispatch({ type: "unavailable" });
    }
  }, [state]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => notify(""), 5000);
    return () => clearTimeout(timeout);
  }, [notice]);
  const normalized = query.trim().toLocaleLowerCase("fr");
  const visibleCampaigns = state.campaigns.filter(
    (c) =>
      (brand === "all" || c.brandId === brand) &&
      (!normalized ||
        `${c.name} ${c.description} ${c.creatives.map((a) => a.name).join(" ")}`
          .toLocaleLowerCase("fr")
          .includes(normalized)),
  );
  return (
    <Context.Provider
      value={{
        ...state,
        brand,
        setBrand,
        query,
        setQuery,
        notice,
        notify,
        visibleCampaigns,
        update: (campaign) => dispatch({ type: "update", campaign }),
        reset: () => {
          dispatch({ type: "reset" });
          setBrand("all");
          setQuery("");
          notify("La démonstration a été réinitialisée.");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStudio() {
  const context = useContext(Context);
  if (!context) throw new Error("StudioProvider manquant.");
  return context;
}
