import { Routes, Route } from "react-router-dom";
import { DocsLayout } from "@/components/layout/docs-layout";
import { HomePage } from "@/pages/home";
import { DocPage } from "@/pages/doc-page";

export default function App() {
  return (
    <Routes>
      <Route element={<DocsLayout />}>
        <Route index element={<HomePage />} />
        <Route path=":collection/:slug" element={<DocPage />} />
      </Route>
    </Routes>
  );
}
