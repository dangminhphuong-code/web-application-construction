import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Skeleton className="mb-4 h-9 w-64" />
      <Skeleton className="mb-8 h-5 w-96" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-56" />
        ))}
      </div>
    </div>
  );
}
