"use client";

import { TransactionsList } from "./transactions-list";

export function Transactions() {
  return (
    <div className="space-y-6">
      <TransactionsList transactionType="online" />
    </div>
  );
}