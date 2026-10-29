"use client";
import Link from "next/link";
import {
  loginErrorMessage,
  workspaceErrorMessage,
} from "@/lib/campaign-studio/workspace/messages";
import { usePathname } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import {
  authClient,
  WorkspaceProvider,
  useWorkspace,
} from "./WorkspaceProvider";
import { useWorkspaceNavigation } from "./WorkspaceNavigation";
import CampaignLanding from "./CampaignLanding";
import Configuration from "./Configuration";
import Review from "./Review";
import Icon from "../Icon";
import type { IconName } from "../Icon";
import w from "./workspace.module.css";
const pages: { url: string; label: string; icon: IconName }[] = [
  { url: "/studio", label: "Accueil", icon: "home" },
  { url: "/studio/configuration", label: "Configuration", icon: "campaign" },
  { url: "/studio/validation", label: "Validation", icon: "approved" },
  { url: "/studio/on-air", label: "On air", icon: "play" },
  { url: "/studio/statistiques", label: "Statistiques", icon: "bars" },
];
export default function WorkspaceApp() {
  return (
    <Suspense fallback={<p role="status">Ouverture du studio…</p>}>
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </Suspense>
  );
}
function App() {
  const { data, loading, error, notice, login, logout, notify } =
    useWorkspace();
  const pathname = usePathname();
  const navigation = useWorkspaceNavigation();
  const context: Record<string, string> =
    pathname === "/studio/configuration" &&
    !navigation.params.get("campagne") &&
    navigation.params.get("nouvelle") !== "1" &&
    data?.campaigns[0]
      ? { campagne: data.campaigns[0].id }
      : {};
  const studioHref = (path: string) =>
    navigation.href(path, { ...context, nouvelle: "" });
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false);
  const [account, setAccount] = useState(false),
    [newPassword, setNewPassword] = useState("");
  const current =
    pages.find((p) => p.url === pathname)?.label ??
    (pathname === "/studio/acces" ? "Accès" : "Terminées");
  const configuration = pathname === "/studio/configuration";
  const selectedCampaign =
    data?.campaigns.find(
      (campaign) => campaign.id === navigation.params.get("campagne"),
    ) ?? data?.campaigns[0];
  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
    } catch (e) {
      notify(workspaceErrorMessage(e, "signin"));
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <section className={w.login} aria-label="Chargement du studio">
        <p role="status">Ouverture du studio…</p>
      </section>
    );
  if (!data)
    return (
      <section className={w.login} aria-label="Connexion au studio">
        <form onSubmit={signIn}>
          <span className={w.wordmark}>MB</span>
          <h1>Campaign studio</h1>
          <p>Connectez-vous à votre espace de travail.</p>
          {loginErrorMessage(error) && (
            <p role="status">{loginErrorMessage(error)}</p>
          )}
          <label>
            E-mail
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button disabled={busy} className={w.primary}>
            {busy ? "Connexion…" : "Se connecter"}
          </button>
          <p className={w.srOnly} role="status">
            {busy ? "Connexion en cours…" : ""}
          </p>
          {notice && <p role="alert">{notice}</p>}
        </form>
      </section>
    );
  const initials = data.actor.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <div className={w.app}>
      <a href="#workspace-main" className={w.skip}>
        Aller au contenu
      </a>
      <aside className={w.sidebar} aria-label="Menu principal du studio">
        <Link
          href={studioHref("/studio")}
          aria-label="MB - Accueil"
          className={w.wordmark}
        >
          MB
        </Link>
        <nav aria-label="Navigation du studio">
          {pages
            .filter(
              (p) =>
                p.url !== "/studio/acces" || data.actor.role === "validator",
            )
            .map((p) => (
              <Link
                key={p.url}
                href={p.url.startsWith("/studio") ? studioHref(p.url) : p.url}
                title={p.label}
                aria-label={p.label}
                aria-current={pathname === p.url ? "page" : undefined}
              >
                <Icon name={p.icon} />
              </Link>
            ))}
        </nav>
        <details className={w.profile}>
          <summary
            aria-label={`${initials} - Compte et outils`}
            title="Compte et outils"
          >
            <span aria-hidden="true">{initials}</span>
          </summary>
          <div className={w.profileMenu}>
            <strong>{data.actor.name}</strong>
            <small>
              {data.actor.role === "validator" ? "Validateur" : "Préparateur"}
            </small>
            <button onClick={() => setAccount((v) => !v)}>Mon compte</button>
            <Link href={studioHref("/studio/terminees")}>
              <Icon name="clock" /> Campagnes terminées
            </Link>
            {data.actor.role === "validator" && (
              <Link href={studioHref("/studio/acces")}>
                <Icon name="info" /> Accès
              </Link>
            )}
            <Link href="/social">
              <Icon name="external" /> Social Ads
            </Link>
            <button onClick={() => void logout()}>
              <Icon name="logout" /> Se déconnecter
            </button>
          </div>
        </details>
      </aside>
      <section
        id="workspace-main"
        tabIndex={-1}
        className={w.main}
        aria-label="Espace de travail du studio"
      >
        <header className={w.header}>
          <nav aria-label="Fil d’Ariane">
            <Link href={studioHref("/studio")}>Accueil</Link>
            {configuration || pathname === "/studio" ? (
              <>
                <Icon name="chevron" size={13} />
                {configuration ? (
                  <Link href={studioHref("/studio")}>Campagnes</Link>
                ) : (
                  <b>Campagnes</b>
                )}
                {configuration &&
                  navigation.params.get("nouvelle") !== "1" &&
                  selectedCampaign && (
                    <>
                      <Icon name="chevron" size={13} />
                      <select
                        className={w.breadcrumbCampaign}
                        aria-label="Campagne à configurer"
                        value={selectedCampaign.id}
                        onChange={(event) =>
                          navigation.update({
                            campagne: event.target.value,
                            etape: "",
                            canaux: "",
                            canal: "",
                          })
                        }
                      >
                        {data.campaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
              </>
            ) : (
              <>
                <Icon name="chevron" size={13} />
                <b>{current}</b>
              </>
            )}
          </nav>
        </header>
        {account && (
          <form
            className={w.accountForm}
            onSubmit={async (e) => {
              e.preventDefault();
              const { error } = await authClient!.auth.updateUser({
                password: newPassword,
              });
              if (error) notify(workspaceErrorMessage(error, "command"));
              else {
                notify("Mot de passe enregistré.");
                setAccount(false);
                setNewPassword("");
              }
            }}
          >
            <label>
              Définir un mot de passe
              <input
                type="password"
                minLength={12}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <button className={w.primary}>Enregistrer</button>
          </form>
        )}
        {pathname !== "/studio" &&
          (pathname !== "/studio/acces" || data.actor.role !== "validator") && (
            <h1 className={w.srOnly}>{current}</h1>
          )}
        {error && (
          <p className={w.error} role="alert">
            {error}
          </p>
        )}
        {pathname === "/studio" ? (
          <Home />
        ) : pathname === "/studio/configuration" ? (
          <Configuration />
        ) : pathname === "/studio/acces" ? (
          <Access />
        ) : pathname === "/studio/statistiques" ? (
          <p>
            Les statistiques des régies ne sont pas connectées à cet espace.
          </p>
        ) : (
          <Review
            key={pathname + ":" + (navigation.params.get("campagne") ?? "all")}
            view={
              pathname === "/studio/on-air"
                ? "live"
                : pathname === "/studio/terminees"
                  ? "finished"
                  : "validation"
            }
          />
        )}
      </section>
      {notice && (
        <div className={w.toast} role="status">
          {notice}
          <button
            onClick={() => notify("")}
            aria-label="Fermer la notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
function Home() {
  return <CampaignLanding />;
}
function Access() {
  const { run, notify, data } = useWorkspace();
  const [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [role, setRole] = useState("preparer"),
    [token, setToken] = useState("");
  if (data!.actor.role !== "validator")
    return <p>Accès réservé au Validateur.</p>;
  return (
    <div className={w.settings}>
      <h1 className={w.title}>Accès au studio</h1>
      <h2>Inviter une personne</h2>
      <p>Les deux profils ont accès à toutes les campagnes.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await run({ type: "invite", email, name, role });
            notify("Invitation envoyée.");
            setEmail("");
          } catch {}
        }}
      >
        <label>
          Nom
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Rôle
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="preparer">Préparateur</option>
            <option value="validator">Validateur</option>
          </select>
        </label>
        <button className={w.primary}>Inviter</button>
      </form>
      <h2>Membres</h2>
      <div className={w.members}>
        {data!.members.map((member) => (
          <div key={member.id}>
            <span>
              {member.name}
              <small>
                {member.access === "active" ? "Accès actif" : "Accès révoqué"}
              </small>
            </span>
            <select
              aria-label={"Rôle de " + member.name}
              disabled={member.id === data!.actor.id}
              value={member.role}
              onChange={(e) =>
                void run({
                  type: "member",
                  memberId: member.id,
                  role: e.target.value,
                  access: member.access,
                }).catch(() => {})
              }
            >
              <option value="preparer">Préparateur</option>
              <option value="validator">Validateur</option>
            </select>
            <button
              disabled={member.id === data!.actor.id}
              onClick={() =>
                void run({
                  type: "member",
                  memberId: member.id,
                  role: member.role,
                  access: member.access === "active" ? "revoked" : "active",
                }).catch(() => {})
              }
            >
              {member.access === "active" ? "Révoquer" : "Réactiver"}
            </button>
          </div>
        ))}
      </div>
      <h2>Accès agent</h2>
      <p>
        Préparation et soumission uniquement. Le jeton n’est affiché qu’une
        fois.
      </p>
      <button
        onClick={async () => {
          const r = await run({ type: "agent", name: name || "Agent studio" });
          setToken(String(r.token));
        }}
      >
        Créer un jeton agent
      </button>
      <div className={w.members}>
        {data!.agents.map((agent) => (
          <div key={agent.id}>
            <span>{agent.name}</span>
            <button
              disabled={!!agent.revoked_at}
              onClick={() =>
                void run({ type: "revoke_agent", agentId: agent.id }).catch(
                  () => {},
                )
              }
            >
              {agent.revoked_at ? "Révoqué" : "Révoquer le jeton"}
            </button>
          </div>
        ))}
      </div>
      {token && (
        <textarea aria-label="Jeton agent à conserver" readOnly value={token} />
      )}
    </div>
  );
}
