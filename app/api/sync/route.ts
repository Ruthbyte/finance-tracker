import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.userId },
      include: {
        accounts: true,
        categories: true,
        transactions: {
          include: {
            account: true,
            toAccount: true,
            category: true,
          },
          orderBy: { date: "desc" },
        },
        budgets: {
          include: {
            category: true,
          },
        },
        goals: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Format output
    const accounts = dbUser.accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type as any,
      balance: acc.balance,
      currency: acc.currency,
      accountNumber: acc.accountNumber || undefined,
      color: acc.color || "#3b82f6",
      isDefault: acc.isDefault,
    }));

    const categories = dbUser.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type as any,
      icon: cat.icon,
      color: cat.color,
    }));

    const transactions = dbUser.transactions.map((tx) => ({
      id: tx.id,
      accountId: tx.accountId,
      accountName: tx.account?.name || "Account",
      toAccountId: tx.toAccountId || undefined,
      toAccountName: tx.toAccount?.name || undefined,
      categoryId: tx.categoryId || undefined,
      categoryName:
        tx.type === "TRANSFER"
          ? "Transfer"
          : tx.category?.name || "Uncategorized",
      categoryIcon:
        tx.type === "TRANSFER" ? "refresh-cw" : tx.category?.icon || "tag",
      amount: tx.amount,
      type: tx.type as any,
      description: tx.description,
      date: tx.date.toISOString().split("T")[0],
      payee: tx.payee || undefined,
      isPending: tx.isPending,
    }));

    const budgets = dbUser.budgets.map((b) => ({
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.category?.name || "Category",
      categoryColor: b.category?.color || "#3b82f6",
      amount: b.amount,
      spent: dbUser.transactions
        .filter((t) => t.categoryId === b.categoryId && t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0),
      period: b.period as any,
    }));

    const goals = dbUser.goals.map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate.toISOString().split("T")[0],
      color: g.color || "#10b981",
      icon: g.icon || "target",
    }));

    return NextResponse.json({
      accounts,
      categories,
      transactions,
      budgets,
      goals,
    });
  } catch (error) {
    console.error("GET /api/sync error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user database data" },
      { status: 500 }
    );
  }
}
