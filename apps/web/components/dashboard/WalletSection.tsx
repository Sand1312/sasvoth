"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@sasvoth/ui/tabs";
import { ScrollArea } from "@sasvoth/ui/scroll-area";
import { Button } from "@sasvoth/ui/button";
import { Input } from "@sasvoth/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@sasvoth/ui/form";
import { useWalletForm } from "@/hooks/useWalletForm";
import { useUser } from "@/hooks";

type DepositHistory = {
  amount: number;
  timestamp: string;
};

export function WalletSection() {
  const {
    depositForm,
    withdrawForm,
    onDeposit,
    onWithdraw,
    token,
    claim,
    user,
    isConnected,
    reloadHistory,
  } = useWalletForm();

  const { getHistoryDeposit } = useUser();
  const [history, setHistory] = useState<DepositHistory[]>([]);

  // Fetch History Effect (Local to this component now)
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?._id) return;
      try {
        const data = await getHistoryDeposit(user._id);
        if (Array.isArray(data)) {
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch deposit history:", error);
      }
    };
    fetchHistory();
  }, [reloadHistory, user, getHistoryDeposit]);

  return (
    <section className="rounded-[30px] border border-black/10 bg-white p-8 shadow-lg relative z-10">
      {/* Header: Title + Balance */}

      <Tabs defaultValue="deposit" className="w-full">
         <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-6">
                <h2 className="text-3xl font-bold text-black">Wallet</h2>
                <TabsList className="flex gap-2 bg-transparent p-0">
                  <TabsTrigger 
                    value="deposit"
                    className="rounded-full px-4 py-1 text-sm font-medium data-[state=active]:bg-black data-[state=active]:text-white transition-all hover:bg-black/5"
                  >
                    ↓ Deposit
                  </TabsTrigger>
                  <TabsTrigger 
                    value="withdraw"
                    className="rounded-full px-4 py-1 text-sm font-medium data-[state=active]:bg-black data-[state=active]:text-white transition-all hover:bg-black/5"
                  >
                    ↑ Withdraw
                  </TabsTrigger>
                </TabsList>
            </div>
             <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-black">
                {token.balance || "0"}
              </span>
              <span className="text-lg font-semibold text-black/60">HD</span>
            </div>
         </div>

        {/* Main Content: Form left, History right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Deposit/Withdraw Forms */}
          <div>
            {/* DEPOSIT FORM */}
            <TabsContent value="deposit" className="mt-0">
              <Form {...depositForm}>
                <form onSubmit={depositForm.handleSubmit(onDeposit)} className="space-y-4">
                  <FormField
                    control={depositForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ETH Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="0.001"
                            className="w-full rounded-full border border-black bg-white px-5 py-3 text-lg font-semibold focus:outline-none h-auto"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {claim.rate && depositForm.watch("amount") > 0 && (
                      <p className="text-sm text-black/60">
                        ≈{" "}
                        {(
                          Number(depositForm.watch("amount")) * Number(claim.rate)
                        ).toLocaleString()}{" "}
                        HD
                      </p>
                    )}

                  <Button
                    type="submit"
                    disabled={!isConnected || claim.isBuying}
                    className="w-full rounded-full border border-black bg-black text-white py-3 font-semibold uppercase tracking-wide hover:bg-black/90 disabled:opacity-50 h-auto"
                  >
                    {claim.isBuying ? "Processing..." : "Buy HD"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* WITHDRAW FORM */}
            <TabsContent value="withdraw" className="mt-0">
                <Form {...withdrawForm}>
                <form onSubmit={withdrawForm.handleSubmit(onWithdraw)} className="space-y-4">
                  <FormField
                    control={withdrawForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HD Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            placeholder="0"
                            className="w-full rounded-full border border-black bg-white px-5 py-3 text-lg font-semibold focus:outline-none h-auto"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                   {claim.rate && withdrawForm.watch("amount") > 0 && (
                      <p className="text-sm text-black/60">
                        ≈{" "}
                        {(Number(withdrawForm.watch("amount")) / Number(claim.rate)).toFixed(6)}{" "}
                        ETH
                      </p>
                    )}

                  <Button
                    type="submit"
                    disabled={!isConnected || claim.isSelling}
                    className="w-full rounded-full border border-black bg-white text-black py-3 font-semibold uppercase tracking-wide hover:bg-black/5 disabled:opacity-50 h-auto"
                  >
                    {claim.isSelling ? "Processing..." : "Sell HD"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </div>

          {/* Right Column: Transaction History */}
          <div className="lg:border-l lg:border-black/10 lg:pl-8">
            <h3 className="text-xs font-bold text-black uppercase tracking-[0.3em] mb-4">
              History
            </h3>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
              {history.length === 0 ? (
                <p className="text-sm text-black/40 text-center py-4">
                  No transactions yet
                </p>
              ) : (
                [...history].reverse().map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-2 py-2 border-b border-black/10 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full border border-black flex items-center justify-center">
                        <span className="text-black text-xs font-bold">
                          {item.amount > 0 ? "↓" : "↑"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-black text-sm">
                          {item.amount > 0 ? "+" : ""}
                          {item.amount} HD
                        </p>
                        <p className="text-xs text-black/40">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-black/40">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </Tabs>
    </section>
  );
}
