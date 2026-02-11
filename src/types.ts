export interface DocMeta {
  slug: string;
  title: string;
  order: number;
  collection: string;
}

export interface Collection {
  name: string;
  label: string;
  docs: DocMeta[];
}

export interface DocContent extends DocMeta {
  content: string;
}
