// Récupère les dernières publications de la page LinkedIn de l'association
// et les écrit dans data/linkedin.json (lancé chaque jour par GitHub Actions).
//
// Variables d'environnement (secrets GitHub) :
//   LINKEDIN_ACCESS_TOKEN  jeton d'accès d'un administrateur de la page
//   LINKEDIN_ORG_ID        identifiant numérique de la page (ex. 12345678)
//   LINKEDIN_API_VERSION   optionnel, format AAAAMM
//
// Les publications ajoutées à la main avec "manual": true sont conservées.

import { readFile, writeFile, mkdir } from "node:fs/promises";

const TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const ORG_ID = process.env.LINKEDIN_ORG_ID;
const VERSION = process.env.LINKEDIN_API_VERSION || "202510";
const COUNT = 6;
const DATA_FILE = "data/linkedin.json";
const IMG_DIR = "assets/linkedin";

if (!TOKEN || !ORG_ID) {
  console.log("LINKEDIN_ACCESS_TOKEN ou LINKEDIN_ORG_ID absent : rien à faire.");
  process.exit(0);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "LinkedIn-Version": VERSION,
  "X-Restli-Protocol-Version": "2.0.0",
};

async function api(path) {
  const res = await fetch(`https://api.linkedin.com/rest/${path}`, { headers });
  if (!res.ok) throw new Error(`LinkedIn ${res.status} sur ${path} : ${await res.text()}`);
  return res.json();
}

// Les URL d'images LinkedIn expirent : on télécharge l'image dans le dépôt.
async function saveImage(mediaUrn, postId) {
  if (!mediaUrn?.startsWith("urn:li:image:")) return null;
  try {
    const { downloadUrl } = await api(`images/${encodeURIComponent(mediaUrn)}`);
    const res = await fetch(downloadUrl);
    if (!res.ok) return null;
    const file = `${IMG_DIR}/${postId.replace(/[^a-z0-9]/gi, "_")}.jpg`;
    await mkdir(IMG_DIR, { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    return `./${file}`;
  } catch (err) {
    console.warn(`Image ignorée pour ${postId} : ${err.message}`);
    return null;
  }
}

const author = encodeURIComponent(`urn:li:organization:${ORG_ID}`);
const { elements = [] } = await api(`posts?q=author&author=${author}&count=${COUNT}&sortBy=LAST_MODIFIED`);

const fetched = [];
for (const p of elements) {
  if (p.lifecycleState !== "PUBLISHED" || p.visibility !== "PUBLIC") continue;
  const media = p.content?.media?.id || p.content?.multiImage?.images?.[0]?.id;
  fetched.push({
    url: `https://www.linkedin.com/feed/update/${p.id}/`,
    date: new Date(p.publishedAt || p.createdAt).toISOString(),
    text: (p.commentary || "").replace(/\\([()[\]{}@#*_~<>|])/g, "$1").trim(),
    image: await saveImage(media, p.id),
  });
}

let manual = [];
try {
  manual = (JSON.parse(await readFile(DATA_FILE, "utf8")).posts || []).filter((p) => p.manual);
} catch {}

const posts = [...manual, ...fetched].sort((a, b) => b.date.localeCompare(a.date));
await writeFile(DATA_FILE, JSON.stringify({ posts }, null, 2) + "\n");
console.log(`${fetched.length} publication(s) LinkedIn récupérée(s), ${manual.length} manuelle(s) conservée(s).`);
