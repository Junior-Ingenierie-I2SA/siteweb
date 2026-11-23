// ==========================================================
// URL du formulaire de contact : collez ici l'URL de l'application Web
// Google Apps Script (voir README.md, étape « Formulaire de contact »).
// ==========================================================
const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

// Nombre de publications LinkedIn affichées
const MAX_POSTS = 6;

// ---------- Menu mobile ----------
const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");

function setMenu(open) {
  nav.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
}
toggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

document.getElementById("year").textContent = new Date().getFullYear();

// Les boutons « Prendre rendez-vous » / « Rejoindre le réseau » pré-remplissent le sujet
document.querySelectorAll("[data-subject]").forEach((btn) => {
  btn.addEventListener("click", () => { document.getElementById("subject").value = btn.dataset.subject; });
});

// ---------- Actualités LinkedIn (data/linkedin.json) ----------
const postsEl = document.getElementById("linkedin-posts");

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function loadPosts() {
  try {
    const res = await fetch("./data/linkedin.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    const { posts = [] } = await res.json();
    const list = posts
      .filter((p) => p.url)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, MAX_POSTS);
    if (!list.length) throw new Error("empty");

    postsEl.innerHTML = list.map((p) => {
      const date = p.date ? new Date(p.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
      return `
        <a class="post" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">
          ${p.image ? `<img src="${escapeHtml(p.image)}" alt="" loading="lazy">` : ""}
          <div class="post__body">
            ${date ? `<time datetime="${escapeHtml(p.date)}">${date}</time>` : ""}
            <p>${escapeHtml(p.text || "")}</p>
            <span class="post__more">Lire sur LinkedIn →</span>
          </div>
        </a>`;
    }).join("");
  } catch {
    postsEl.innerHTML = `<p class="posts__empty">Retrouvez toutes nos actualités sur notre page LinkedIn.</p>`;
  }
}
loadPosts();

// ---------- Formulaire de contact ----------
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `form-status ${type || ""}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  // Piège anti-spam rempli = robot : on fait semblant que tout va bien
  if (form.website.value) {
    form.reset();
    setStatus("Merci, votre message a bien été envoyé !", "ok");
    return;
  }

  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Envoi en cours…";
  setStatus("");

  try {
    // text/plain évite la requête « preflight » CORS que Google Apps Script ne gère pas
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await res.json();
    if (data.result !== "success") throw new Error(data.error);
    form.reset();
    setStatus("Merci, votre message a bien été envoyé ! Nous revenons vers vous rapidement.", "ok");
  } catch {
    setStatus("Oups, l'envoi a échoué. Réessayez ou écrivez-nous à contact@junior-i2sa.org.", "err");
  } finally {
    button.disabled = false;
    button.textContent = "Envoyer";
  }
});
