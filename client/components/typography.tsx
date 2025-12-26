import type { ComponentProps } from "react";
import { cn } from "@/client/lib/utils";

function H1({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-balance text-center font-extrabold text-4xl tracking-tight",
        className
      )}
      data-slot="h1"
      {...props}
    />
  );
}

function H2({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "mt-8 mb-4 scroll-m-20 border-b pb-2 font-semibold text-3xl tracking-tight first:mt-0",
        className
      )}
      data-slot="h2"
      {...props}
    />
  );
}

function H3({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "scroll-m-20 font-semibold text-2xl tracking-tight",
        className
      )}
      data-slot="h3"
      {...props}
    />
  );
}

function H4({ className, ...props }: ComponentProps<"h4">) {
  return (
    <h4
      className={cn(
        "scroll-m-20 font-semibold text-xl tracking-tight",
        className
      )}
      data-slot="h4"
      {...props}
    />
  );
}

function P({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("not-first:mt-6 leading-7", className)}
      data-slot="p"
      {...props}
    />
  );
}

function Blockquote({ className, ...props }: ComponentProps<"blockquote">) {
  return (
    <blockquote
      className={cn("my-6 border-l-2 pl-6 italic", className)}
      data-slot="blockquote"
      {...props}
    />
  );
}

function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <table
      className={cn("my-6 w-full overflow-y-auto", className)}
      data-slot="table-wrapper"
      {...props}
    />
  );
}

function Ul({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      className={cn("my-4 ml-6 list-disc [&>li]:mt-2", className)}
      data-slot="ul"
      {...props}
    />
  );
}

function Ol({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      className={cn("my-4 ml-6 list-decimal [&>li]:mt-2", className)}
      data-slot="ol"
      {...props}
    />
  );
}

function InlineCode({ className, ...props }: ComponentProps<"code">) {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold text-sm",
        className
      )}
      data-slot="inline-code"
      {...props}
    />
  );
}

function CodeBlock({ className, ...props }: ComponentProps<"code">) {
  return (
    <code
      className={cn(
        "relative my-4 block whitespace-pre-wrap bg-muted px-4 py-4 font-mono font-semibold text-sm leading-relaxed",
        className
      )}
      data-slot="code-block"
      {...props}
    />
  );
}

export { H1, H2, H3, H4, P, Blockquote, Table, Ul, Ol, InlineCode, CodeBlock };
