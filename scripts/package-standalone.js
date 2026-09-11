// Runs after `next build` (via the "postbuild" npm script). `output: "standalone"`
// in next.config.ts makes Next.js emit a self-contained server at
// .next/standalone, but per Next's docs it deliberately leaves out `public/`
// and `.next/static/` (meant to be served by a CDN) — this copies both in so
// `node .next/standalone/server.js` serves a complete site on its own, which
// is what a plain Node.js hosting slot (no CDN in front) needs.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.log("[package-standalone] .next/standalone not found — is `output: \"standalone\"` set in next.config.ts?");
  process.exit(0);
}

fs.cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
fs.cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });

// Next's output-file-tracing only reliably follows node_modules packages;
// our Prisma client generator writes outside node_modules (src/generated/prisma,
// see prisma/schema.prisma's generator block), so it doesn't get traced into
// the standalone bundle automatically — copy it in by hand, matching the
// bundle's compiled require("../src/generated/prisma") path.
const prismaClientDir = path.join(root, "src", "generated", "prisma");
if (fs.existsSync(prismaClientDir)) {
  fs.cpSync(prismaClientDir, path.join(standalone, "src", "generated", "prisma"), { recursive: true });
  console.log("[package-standalone] Copied src/generated/prisma into .next/standalone/src/generated/prisma");
} else {
  console.warn("[package-standalone] src/generated/prisma not found — run `npx prisma generate` before building.");
}

console.log("[package-standalone] Copied public/ and .next/static/ into .next/standalone/");
