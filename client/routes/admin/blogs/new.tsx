import { createFileRoute } from "@tanstack/react-router";
import "@milkdown/crepe/theme/common/style.css";
import "@/client/lib/styles/milkdown.css";
import { Crepe } from "@milkdown/crepe";
import {
  type Uploader,
  upload,
  uploadConfig,
} from "@milkdown/kit/plugin/upload";
import type { Node } from "@milkdown/kit/prose/model";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import type { FC } from "react";
import { rawApi } from "@/client/lib/api";

const uploader: Uploader = async (inputFiles, schema) => {
  const files: File[] = [];

  for (let i = 0; i < inputFiles.length; i++) {
    const file = inputFiles.item(i);
    if (!file) {
      continue;
    }

    files.push(file);
  }

  const nodes: Node[] = await Promise.all(
    files.map(async (file) => {
      const { url } = await rawApi.files.upload(file);
      const alt = file.name;
      if (file.type.startsWith("image/")) {
        return schema.nodes.image?.createAndFill({
          src: url,
          alt,
        }) as Node;
      }
      const linkMark = schema.marks.link?.create({
        href: url,
        title: alt,
      });
      if (!linkMark) {
        throw new Error("Link mark not found in schema");
      }
      return schema.text(alt, [linkMark]);
    })
  );

  return nodes;
};

const CrepeEditor: FC = () => {
  useEditor((root) => {
    const crepe = new Crepe({
      root,
      featureConfigs: {
        "image-block": {
          async onUpload(file) {
            const { url } = await rawApi.files.upload(file);
            return url;
          },
        },
      },
    });

    crepe.editor
      .config((ctx) => {
        ctx.update(uploadConfig.key, (prev) => ({
          ...prev,
          uploader,
          enableHtmlFileUploader: true,
        }));
      })
      .use(upload);

    return crepe;
  });

  return <Milkdown />;
};

export const MilkdownEditorWrapper: FC = () => {
  return (
    <MilkdownProvider>
      <CrepeEditor />
    </MilkdownProvider>
  );
};

export const Route = createFileRoute("/admin/blogs/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <MilkdownEditorWrapper />;
}
