import { createFileRoute } from "@tanstack/react-router";
import "@milkdown/crepe/theme/common/style.css";
import "@/client/lib/styles/milkdown.css";

import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";

const CrepeEditor: React.FC = () => {
  useEditor((root) => {
    return new Crepe({ root });
  });

  return <Milkdown />;
};

export const MilkdownEditorWrapper: React.FC = () => {
  return (
    <MilkdownProvider>
      <CrepeEditor />
    </MilkdownProvider>
  );
};

export const Route = createFileRoute("/admin/blog/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <MilkdownEditorWrapper />;
}
