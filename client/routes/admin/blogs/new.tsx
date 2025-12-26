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
import { rawApi } from "@/client/lib/api";

const uploader: Uploader = async (inputFiles, schema) => {
  const files: File[] = [];

  for (let i = 0; i < inputFiles.length; i++) {
    const file = inputFiles.item(i);
    if (!file) {
      console.warn(`File at index ${i} is null or undefined, skipping.`);
      continue;
    }

    files.push(file);
  }

  console.log("Files to upload:", files);

  const nodes: Node[] = await Promise.all(
    files.map(async (file) => {
      console.log("Uploading file:", file.name);
      const { url } = await rawApi.files.upload(file);
      const alt = file.name;
      if (file.type.startsWith("image/")) {
        return schema.nodes.image?.createAndFill({
          src: url,
          alt,
        }) as Node;
      }
      console.log(schema.nodes);
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

const CrepeEditor: React.FC = () => {
  useEditor((root) => {
    const crepe = new Crepe({
      root,
      featureConfigs: {
        "image-block": {
          async onUpload(file) {
            console.log("Uploading file:", file.name);
            await new Promise((resolve) => setTimeout(resolve, 500));
            return URL.createObjectURL(file);
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

export const MilkdownEditorWrapper: React.FC = () => {
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
