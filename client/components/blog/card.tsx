import { Link } from "@tanstack/react-router";
import { Badge } from "@/client/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { Skeleton } from "@/client/components/ui/skeleton";

type BlogCardProps = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  updateSearch: (updates: {
    q?: string;
    page?: number;
    sort?: "publishedAt" | "title";
    tag?: string;
  }) => void;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
};

export function BlogCard({
  title,
  slug,
  excerpt,
  tags,
  updateSearch,
}: BlogCardProps) {
  return (
    <Card className="relative flex w-full max-w-sm flex-col overflow-hidden py-0">
      <Link
        className="relative z-10 block grow hover:underline"
        params={{ slug }}
        to="/blog/$slug"
      >
        <div className="absolute inset-0 z-30 aspect-video bg-primary opacity-50 mix-blend-color" />
        <img
          alt="Taken by mymind on Unsplash"
          className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale"
          height={1062}
          src="https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          title="Taken by mymind on Unsplash"
          width={1887}
        />
        <CardHeader className="relative z-20 pt-4">
          <CardTitle className="line-clamp-2">{title}</CardTitle>
          <CardDescription className="line-clamp-2">{excerpt}</CardDescription>
        </CardHeader>
      </Link>
      <CardFooter className="overflow-scroll overflow-y-scroll [&::-webkit-scrollbar-thumb]:box-border [&::-webkit-scrollbar-thumb]:border-primary [&::-webkit-scrollbar-thumb]:border-b-2 [&::-webkit-scrollbar-thumb]:bg-card [&::-webkit-scrollbar-track]:bg-card [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-0">
        {tags.map((tag) => (
          <Badge
            className="-mb-2 cursor-pointer py-0"
            key={tag.slug}
            onClick={() => {
              updateSearch({ tag: tag.slug, page: 1 });
            }}
            variant="link"
          >
            {tag.name}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );
}

export function BlogCardSkeleton() {
  return (
    <Card className="relative w-full max-w-sm overflow-hidden pt-0">
      <Skeleton className="aspect-video w-full" />
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardFooter>
        <Skeleton className="h-5 w-16" />
        <Skeleton className="ml-2 h-5 w-12" />
      </CardFooter>
    </Card>
  );
}
