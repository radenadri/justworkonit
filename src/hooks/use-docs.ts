import { useState, useEffect, useMemo } from "react";
import { getCollections, getDoc } from "@/lib/docs";
import type { Collection, DocContent } from "@/types";

export function useCollections(): {
  collections: Collection[];
  loading: boolean;
  error: string | null;
} {
  const collections = useMemo(() => getCollections(), []);
  return { collections, loading: false, error: null };
}

export function useDoc(
  collection?: string,
  slug?: string,
): {
  doc: DocContent | null;
  loading: boolean;
  error: string | null;
} {
  const [doc, setDoc] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collection || !slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getDoc(collection, slug)
      .then(result => {
        if (cancelled) return;
        if (!result) {
          setError("Document not found");
        } else {
          setDoc(result);
        }
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load document");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [collection, slug]);

  return { doc, loading, error };
}
