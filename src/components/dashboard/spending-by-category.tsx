import { EmptyState } from "@/components/ui/empty-state";
import { getSpendingByCategoryForUser } from "@/server/repositories/transaction.repository";
import { formatCurrency } from "@/lib/utils/format-currency";

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function SpendingByCategory({ userId }: { userId: string }) {
  const categories = await getSpendingByCategoryForUser(userId);

  if (categories.length === 0) {
    return (
      <EmptyState
        title="Nothing to show yet"
        description="This will populate once transactions start syncing."
      />
    );
  }

  const maxTotal = Math.max(...categories.map((c) => c.total));

  return (
    <ul className="flex flex-col gap-3">
      {categories.map((category) => (
        <li key={category.category}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">
              {toTitleCase(category.category)}
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {formatCurrency(category.total)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100"
              style={{ width: `${(category.total / maxTotal) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
