import {
  ArrowsDownUpIcon,
  CalendarIcon,
  CaretUpDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  NewspaperClippingIcon,
  TextAaIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { BlogCard, BlogCardSkeleton } from "@/client/components/blog/card";
import { Button } from "@/client/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/client/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/client/components/ui/empty";
import { Input } from "@/client/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/client/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/client/components/ui/popover";
import { Skeleton } from "@/client/components/ui/skeleton";
import { useDebounce } from "@/client/hooks/use-debounce";
import { api } from "@/client/lib/api";
import { cn } from "@/client/lib/utils";

type SearchUpdates = {
  q?: string;
  page?: number;
  sort?: "publishedAt" | "title";
  tag?: string;
};

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  page: z.number().min(1).optional().catch(1),
  sort: z.enum(["publishedAt", "title"]).optional().catch("publishedAt"),
  tag: z.string().optional(),
});

export const Route = createFileRoute("/blog/")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

const TagFilter = ({
  updateSearch,
}: {
  updateSearch: (updates: SearchUpdates) => void;
}) => {
  const tagsQuery = useQuery(api.tags.getAll.queryOptions());
  const { tag: currentTag } = Route.useSearch();
  const [open, setOpen] = useState(false);

  if (tagsQuery.error) {
    return null;
  }

  if (tagsQuery.isPending) {
    return <Skeleton className="h-8 w-50" />;
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-expanded={open}
            className="w-50 justify-between"
            role="combobox"
            variant="outline"
          >
            {currentTag
              ? tagsQuery.data?.tags.find((tag) => tag.slug === currentTag)
                  ?.name
              : "Filter tags"}
            <CaretUpDownIcon />
          </Button>
        }
      />
      <PopoverContent className="w-50 p-0">
        <Command>
          <CommandInput className="h-9" placeholder="Search tags" />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {tagsQuery.data?.tags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  onSelect={(currentValue) => {
                    updateSearch({
                      tag: currentValue === currentTag ? "" : currentValue,
                      page: 1,
                    });
                    setOpen(false);
                  }}
                  value={tag.slug}
                >
                  {tag.name}
                  <CheckIcon
                    className={cn(
                      "ml-auto",
                      currentTag === tag.slug ? "opacity-100" : "hidden"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const SortFilter = ({
  updateSearch,
}: {
  updateSearch: (updates: SearchUpdates) => void;
}) => {
  const { sort = "publishedAt" } = Route.useSearch();

  return (
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
        <DropdownMenuItem onClick={() => updateSearch({ sort: "publishedAt" })}>
          <CalendarIcon weight="bold" />
          Date (newest first)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateSearch({ sort: "title" })}>
          <TextAaIcon weight="bold" />
          Title (A-Z)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function RouteComponent() {
  const navigate = useNavigate();
  const { q = "", page = 1, sort = "publishedAt", tag } = Route.useSearch();

  const debouncedSearch = useDebounce(q, 300);

  const articlesQuery = useQuery(
    api.articles.getAll.queryOptions({
      input: {
        search: debouncedSearch || undefined,
        sortBy: sort,
        page,
        tag,
      },
    })
  );

  const updateSearch = (updates: SearchUpdates) => {
    navigate({
      to: "/blog",
      search: (prev) => ({
        ...prev,
        ...updates,
        page:
          updates.q !== undefined || updates.sort !== undefined
            ? 1
            : (updates.page ?? prev.page),
        q: updates.q ? updates.q : undefined,
        tag: updates.tag ? updates.tag : undefined,
      }),
    });
  };

  const { totalPages = 1, totalItems = 0 } =
    articlesQuery.data?.pagination ?? {};

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
      <title>tvk² - blog</title>
      <main className="flex grow flex-col gap-6 p-4">
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
            <SortFilter updateSearch={updateSearch} />
            <TagFilter updateSearch={updateSearch} />
          </div>
          <p className="pr-4 text-muted-foreground text-sm">
            {totalItems} article{totalItems !== 1 ? "s" : ""} found
            {debouncedSearch && ` for "${debouncedSearch}"`}
          </p>
        </div>

        {articlesQuery.isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <BlogCardSkeleton key={`skeleton-${i.toString()}`} />
            ))}
          </div>
        )}

        {articlesQuery.error && (
          <Empty className="my-12">
            <EmptyMedia variant="icon">
              <NewspaperClippingIcon weight="bold" />
            </EmptyMedia>
            <EmptyTitle>Error loading articles</EmptyTitle>
            <EmptyDescription>{String(articlesQuery.error)}</EmptyDescription>
            <Button onClick={() => articlesQuery.refetch()} variant="outline">
              Try again
            </Button>
          </Empty>
        )}

        {articlesQuery.data?.articles.length === 0 && (
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

        {articlesQuery.data && articlesQuery.data.articles.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {articlesQuery.data.articles.map((article) => (
                <BlogCard
                  key={article.id}
                  updateSearch={updateSearch}
                  {...article}
                />
              ))}
            </div>

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
