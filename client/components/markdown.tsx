import type { Options } from "react-markdown";
import MarkdownPrimitive from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import {
  Blockquote,
  CodeBlock,
  H1,
  H2,
  H3,
  H4,
  Ol,
  P,
  Table,
  Ul,
} from "@/client/components/typography";
import "@/client/lib/styles/hljs.css";

export const Markdown = (props: Options) => {
  return (
    <MarkdownPrimitive
      {...props}
      components={{
        h1: H1,
        h2: H2,
        h3: H3,
        h4: H4,
        p: P,
        blockquote: Blockquote,
        table: Table,
        ul: Ul,
        ol: Ol,
        pre: CodeBlock,
      }}
      rehypePlugins={[rehypeHighlight]}
      remarkPlugins={[remarkGfm]}
    />
  );
};

export const CommentMarkdown = (props: Options) => {
  return (
    <MarkdownPrimitive
      {...props}
      components={{
        table: Table,
        ul: Ul,
        ol: Ol,
        blockquote: Blockquote,
        pre: CodeBlock,
      }}
      rehypePlugins={[rehypeHighlight]}
      remarkPlugins={[remarkGfm]}
    />
  );
}
