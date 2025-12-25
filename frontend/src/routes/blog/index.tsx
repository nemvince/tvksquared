import { Header } from "@frontend/components/header";
import { Badge } from "@frontend/components/ui/badge";
import { Button } from "@frontend/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@frontend/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@frontend/components/ui/empty";
import { Input } from "@frontend/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@frontend/components/ui/pagination";
import { Skeleton } from "@frontend/components/ui/skeleton";
import { useDebounce } from "@frontend/hooks/use-debounce";
import { api } from "@frontend/lib/api";
import {
  ArrowsDownUpIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  NewspaperClippingIcon,
  TextAaIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  page: z.number().min(1).optional().catch(1),
  sort: z.enum(["publishedAt", "title"]).optional().catch("publishedAt"),
});

export const Route = createFileRoute("/blog/")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function ArticleCardSkeleton() {
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

function RouteComponent() {
  const navigate = useNavigate();
  const { q = "", page = 1, sort = "publishedAt" } = Route.useSearch();

  const debouncedSearch = useDebounce(q, 300);

  const query = useQuery(
    api.articles.getAll.queryOptions({
      input: {
        search: debouncedSearch || undefined,
        sortBy: sort,
        page,
      },
    })
  );

  const updateSearch = (updates: {
    q?: string;
    page?: number;
    sort?: "publishedAt" | "title";
  }) => {
    navigate({
      to: "/blog",
      search: (prev) => ({
        ...prev,
        ...updates,
        // Reset to page 1 when search query or sort changes
        page:
          updates.q !== undefined || updates.sort !== undefined
            ? 1
            : (updates.page ?? prev.page),
      }),
    });
  };

  const { totalPages = 1, totalItems = 0 } = query.data?.pagination ?? {};

  const getPaginationItems = () => {
    const items: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);

      if (page > 3) {
        items.push("ellipsis");
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      if (page < totalPages - 2) {
        items.push("ellipsis");
      }

      items.push(totalPages);
    }

    return items;
  };

  return (
    <>
      <Header additionalButtons={null} />
      <main className="flex grow flex-col gap-6 p-4">
        {/* Search and Sort Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="relative max-w-md flex-1">
              <MagnifyingGlassIcon
                className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                weight="bold"
              />
              <Input
                className="pl-9"
                onChange={(e) => updateSearch({ q: e.target.value })}
                placeholder="Search articles..."
                type="search"
                value={q}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline">
                    <ArrowsDownUpIcon weight="bold" />
                    Sort by: {sort === "publishedAt" ? "Date" : "Title"}
                  </Button>
                }
              />
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem
                  onClick={() => updateSearch({ sort: "publishedAt" })}
                >
                  <CalendarIcon weight="bold" />
                  Date (newest first)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateSearch({ sort: "title" })}
                >
                  <TextAaIcon weight="bold" />
                  Title (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="pr-4 text-muted-foreground text-sm">
            {totalItems} article{totalItems !== 1 ? "s" : ""} found
            {debouncedSearch && ` for "${debouncedSearch}"`}
          </p>
        </div>
        {/* Loading State */}
        {query.isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ArticleCardSkeleton key={`skeleton-${i.toString()}`} />
            ))}
          </div>
        )}

        {/* Error State */}
        {query.error && (
          <Empty className="my-12">
            <EmptyMedia variant="icon">
              <NewspaperClippingIcon weight="bold" />
            </EmptyMedia>
            <EmptyTitle>Error loading articles</EmptyTitle>
            <EmptyDescription>{String(query.error)}</EmptyDescription>
            <Button onClick={() => query.refetch()} variant="outline">
              Try again
            </Button>
          </Empty>
        )}

        {/* Empty State */}
        {query.data?.articles.length === 0 && (
          <Empty className="my-12">
            <EmptyMedia variant="icon">
              <NewspaperClippingIcon weight="bold" />
            </EmptyMedia>
            <EmptyTitle>
              {debouncedSearch ? "No articles found" : "No articles yet"}
            </EmptyTitle>
            <EmptyDescription>
              {debouncedSearch
                ? `No articles match "${debouncedSearch}". Try a different search term.`
                : "Check back later for new content."}
            </EmptyDescription>
            {debouncedSearch && (
              <Button onClick={() => updateSearch({ q: "" })} variant="outline">
                Clear search
              </Button>
            )}
          </Empty>
        )}

        {/* Articles Grid */}
        {query.data && query.data.articles.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {query.data.articles.map((article) => (
                <Card
                  className="relative w-full max-w-sm overflow-hidden pt-0"
                  key={article.id}
                >
                  <Link
                    className="relative z-10 block hover:underline"
                    to={`/blog/${article.slug}`}
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
                      <CardTitle>{article.title}</CardTitle>
                      <CardDescription className="truncate">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                  </Link>
                  <CardFooter className="overflow-y-scroll">
                    {article.tags.map((tag) => (
                      <Badge
                        key={tag.slug}
                        render={
                          <Link to={`/blog/tags/${tag.slug}`}>{tag.name}</Link>
                        }
                        variant="link"
                      />
                    ))}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      aria-disabled={page <= 1}
                      className={
                        page <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                      onClick={() =>
                        page > 1 && updateSearch({ page: page - 1 })
                      }
                    />
                  </PaginationItem>
                  {getPaginationItems().map((item, index) =>
                    item === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${index.toString()}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          className="cursor-pointer"
                          isActive={item === page}
                          onClick={() => updateSearch({ page: item })}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      aria-disabled={page >= totalPages}
                      className={
                        page >= totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                      onClick={() =>
                        page < totalPages && updateSearch({ page: page + 1 })
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </main>
    </>
  );
}
