"use client";
import Select from "@/app/_components/Select";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { BrandFilter } from "@/lib/campaign-studio/types";
import { useStudio } from "./StudioProvider";
import Icon, { type IconName } from "./Icon";
import s from "../studio.module.css";

const pages: { href: string; name: string; icon: IconName }[] = [
  { href: "/studio/validation", name: "Validation", icon: "review" },
  { href: "/studio/on-air", name: "Campagnes on air", icon: "live" },
  { href: "/studio/statistiques", name: "Statistiques", icon: "chart" },
];
export default function StudioShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentPage = pages.find((page) => page.href === pathname);
  const [navigation, setNavigation] = useState<"collapsed" | "expanded">(
    "collapsed",
  );
  const [menu, setMenu] = useState<"closed" | "open">("closed");
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  function closeMenu() {
    setMenu("closed");
  }
  useEffect(() => {
    if (menu !== "open") return;
    const trigger = menuButton.current;
    const media = window.matchMedia("(max-width: 760px)");
    const elements = () =>
      Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>(
          "a[href], button, select",
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
    elements()[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenu("closed");
      }
      if (event.key !== "Tab") return;
      const items = elements();
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const onResize = () => {
      if (!media.matches) setMenu("closed");
    };
    document.addEventListener("keydown", onKey);
    media.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onResize);
      if (media.matches) trigger?.focus();
    };
  }, [menu]);
  const { brand, setBrand, notice, notify, storage, reset } = useStudio();
  return (
    <div
      className={`${s.app} ${navigation === "collapsed" ? s.navigationCollapsed : ""}`}
    >
      <a className={s.skipLink} href="#studio-content">
        Aller au contenu
      </a>
      {menu === "open" && (
        <button
          className={s.backdrop}
          aria-label="Fermer le menu"
          onClick={closeMenu}
          tabIndex={-1}
        />
      )}
      <aside
        ref={sidebar}
        role={menu === "open" ? "dialog" : undefined}
        aria-modal={menu === "open" ? true : undefined}
        aria-label="Menu du studio"
        className={`${s.sidebar} ${menu === "open" ? s.sidebarOpen : ""}`}
      >
        {menu === "open" && (
          <button
            className={s.closeMenuButton}
            aria-label="Fermer la navigation"
            onClick={closeMenu}
          >
            <Icon name="close" size={16} />
          </button>
        )}
        <Link
          aria-label="MB Média - Validation"
          title="MB Média"
          href="/studio/validation"
          className={s.logo}
          onClick={closeMenu}
        >
          <span className={s.logoMark}>m.</span>
          <span className={s.navText}>
            MB Média<span className={s.logoSub}>Campaign studio</span>
          </span>
        </Link>
        <nav aria-label="Navigation du studio" className={s.nav}>
          {pages.map((p) => (
            <Link
              aria-label={p.name}
              title={p.name}
              key={p.href}
              href={p.href}
              aria-current={pathname === p.href ? "page" : undefined}
              onClick={closeMenu}
            >
              <Icon name={p.icon} size={18} />
              <span className={s.navText}>{p.name}</span>
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className={s.brandShortcut}
          aria-label="Choisir une marque"
          title="Choisir une marque"
          onClick={() => setNavigation("expanded")}
        >
          <Icon name="grid" />
        </button>
        <Select
          id="studio-brand"
          className={s.brandSelect}
          aria-label="Filtrer par marque"
          value={brand}
          onValueChange={(selectedValue) =>
            setBrand(selectedValue as BrandFilter)
          }
        >
          <option value="all">Toutes les marques</option>
          <option value="cmsa">Collège du Mont-Sainte-Anne</option>
          <option value="cu">Collège Universel</option>
        </Select>
        <div className={s.sidebarBottom}>
          <button
            type="button"
            className={s.collapseButton}
            aria-label={
              navigation === "collapsed"
                ? "Déplier la navigation"
                : "Replier la navigation"
            }
            title={
              navigation === "collapsed"
                ? "Déplier la navigation"
                : "Replier la navigation"
            }
            aria-expanded={navigation === "expanded"}
            onClick={() =>
              setNavigation(
                navigation === "collapsed" ? "expanded" : "collapsed",
              )
            }
          >
            <Icon
              name="chevron"
              style={{
                transform:
                  navigation === "expanded" ? "rotate(180deg)" : undefined,
              }}
            />
            <span className={s.navText}>Replier</span>
          </button>
          <button
            type="button"
            className={s.resetButton}
            aria-label="Réinitialiser la démo"
            title="Réinitialiser la démo"
            onClick={reset}
          >
            <Icon name="reset" size={15} />
            <span className={s.navText}>Réinitialiser la démo</span>
          </button>
        </div>
      </aside>
      <div className={s.main} inert={menu === "open"}>
        <header className={s.topbar}>
          <div className={s.breadcrumb}>
            <button
              ref={menuButton}
              type="button"
              className={s.menuButton}
              aria-label="Ouvrir le menu"
              aria-expanded={menu === "open"}
              onClick={() => setMenu("open")}
            >
              <Icon name="menu" />
            </button>
            <nav aria-label="Fil d’Ariane" className={s.breadcrumb}>
              <Link href="/studio">Home</Link>
              <Icon name="chevron" size={13} />
              <span aria-current="page">{currentPage?.name ?? "Studio"}</span>
            </nav>
          </div>
          <div className={s.topbarRight}>
            <span
              className={s.demoTag}
              title="Données fictives, aucune diffusion réelle"
            >
              Démo
            </span>
          </div>
        </header>
        <div id="studio-content" tabIndex={-1} className={s.page}>
          {children}
        </div>
        {storage === "unavailable" && (
          <p className={s.storageWarning} role="status">
            Sauvegarde locale indisponible. Les changements restent actifs
            jusqu’au rechargement.
          </p>
        )}
      </div>
      {notice && (
        <div className={s.toast} role="status">
          <Icon name="check" size={16} />
          {notice}
          <button
            aria-label="Fermer la notification"
            onClick={() => notify("")}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
