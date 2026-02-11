import type { ComponentType } from "react";
import type { Collection, DocMeta, DocContent } from "@/types";

// Lazy-load all MDX files at build time via Vite glob
// Each entry returns a module with { default: ComponentType }
const mdxModules = import.meta.glob<{ default: ComponentType }>("/docs/**/*.mdx");

// Parse a glob key like "/docs/blind75/01-contains-duplicate.mdx"
function parseGlobKey(key: string): { collection: string; filename: string } | null {
  const match = key.match(/^\/docs\/([^/]+)\/(.+\.mdx)$/);
  if (!match) return null;
  return { collection: match[1], filename: match[2] };
}

function slugify(filename: string): string {
  return filename
    .replace(/\.mdx$/, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function extractTitle(filename: string): string {
  const name = filename.replace(/\.mdx$/, "");
  return name.replace(/^\d+[-\s]*/, "").replace(/-/g, " ");
}

function extractOrder(filename: string): number {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 99;
}

function formatCollectionLabel(name: string): string {
  const labels: Record<string, string> = {
    "blind75": "Blind 75 — LeetCode",
    "focus-wp": "Focus — WordPress",
    "furnicraft-odoo": "Furnicraft — Odoo ERP",
    "furnicraft-woo": "Furnicraft — WooCommerce",
  };
  return labels[name] ?? name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// Build the collections index from glob keys (synchronous — no file I/O)
export function getCollections(): Collection[] {
  const collectionMap = new Map<string, DocMeta[]>();

  for (const key of Object.keys(mdxModules)) {
    const parsed = parseGlobKey(key);
    if (!parsed) continue;

    const { collection, filename } = parsed;
    if (!collectionMap.has(collection)) {
      collectionMap.set(collection, []);
    }

    collectionMap.get(collection)!.push({
      slug: slugify(filename),
      title: extractTitle(filename),
      order: extractOrder(filename),
      collection,
    });
  }

  const collections: Collection[] = [];
  for (const [name, docs] of collectionMap) {
    docs.sort((a, b) => a.order - b.order);
    collections.push({
      name,
      label: formatCollectionLabel(name),
      docs,
    });
  }

  return collections.sort((a, b) => a.label.localeCompare(b.label));
}

// Load a single doc's MDX component (lazy — only fetches the chunk when called)
export async function getDoc(
  collection: string,
  slug: string,
): Promise<DocContent | null> {
  const matchingKey = Object.keys(mdxModules).find(key => {
    const parsed = parseGlobKey(key);
    return parsed && parsed.collection === collection && slugify(parsed.filename) === slug;
  });

  if (!matchingKey) return null;

  const parsed = parseGlobKey(matchingKey)!;
  const mod = await mdxModules[matchingKey]();

  return {
    slug,
    title: extractTitle(parsed.filename),
    order: extractOrder(parsed.filename),
    collection,
    Content: mod.default,
  };
}
