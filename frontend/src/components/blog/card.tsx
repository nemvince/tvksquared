import { Badge } from "@frontend/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@frontend/components/ui/card";
import { Skeleton } from "@frontend/components/ui/skeleton";
import { Link } from "@tanstack/react-router";

type BlogCardProps = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
};

export function BlogCard({ title, slug, excerpt, tags }: BlogCardProps) {
  return (
    <Card className="relative w-full max-w-sm overflow-hidden pt-0">
      <Link
        className="relative z-10 block hover:underline"
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
          <CardTitle>{title}</CardTitle>
          <CardDescription className="truncate">{excerpt}</CardDescription>
        </CardHeader>
      </Link>
      <CardFooter className="overflow-y-scroll">
        {tags.map((tag) => (
          <Badge
            key={tag.slug}
            render={
              <Link params={{ tag: tag.slug }} to="/blog/tags/$tag">
                {tag.name}
              </Link>
            }
            variant="link"
          />
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
