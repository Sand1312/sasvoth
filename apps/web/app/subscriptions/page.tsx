"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@sasvoth/ui/avatar";
import { Button } from "@sasvoth/ui/button";
import { Card } from "@sasvoth/ui/card";
import Link from "next/link";
import { maciApi } from "@/api/maci.api";
import { useAccount } from "wagmi";
import { useMaciSignup } from "@/hooks/useMaciSignup";

type Subscription = {
  id: string;
  name: string;
  logo?: string;
  members: number;
  pollCount: number;
  maciAddress: string;
};

type SubscriptionWithStatus = Subscription & {
  isSubscribed: boolean;
  checking: boolean;
};

function SubscriptionCard({
  subscription,
  isSubscribed,
  checking,
  onSubscribe,
  subscribing,
}: {
  subscription: Subscription;
  isSubscribed: boolean;
  checking: boolean;
  onSubscribe: () => void;
  subscribing: boolean;
}) {
  return (
    <Card className="group flex flex-col border border-black/10 hover:border-black transition-colors rounded-none bg-white shadow-none">
      <div className="p-6 flex flex-col items-center text-center">
        <Avatar className="w-16 h-16 mb-4 border border-black/20">
          <AvatarImage src={subscription.logo} alt={subscription.name} />
          <AvatarFallback className="bg-black text-white text-lg font-medium tracking-tight">
            {subscription.name?.slice(0, 2).toUpperCase() || "MA"}
          </AvatarFallback>
        </Avatar>

        <h3 className="text-base font-medium text-black tracking-tight">
          {subscription.name}
        </h3>

        <div className="flex gap-3 text-xs text-black/50 mt-2 font-mono">
          <span>{subscription.members.toLocaleString()} members</span>
          <span>·</span>
          <span>{subscription.pollCount} polls</span>
        </div>
      </div>

      <div className="border-t border-black/10 p-4">
        {isSubscribed ? (
          <Link
            href={`/subscriptions/${subscription.maciAddress}`}
            className="block"
          >
            <Button
              variant="outline"
              className="w-full border-black text-black hover:bg-black hover:text-white transition-colors rounded-none"
            >
              View
            </Button>
          </Link>
        ) : (
          <Button
            onClick={onSubscribe}
            disabled={checking || subscribing}
            className="w-full bg-black text-white hover:bg-white hover:text-black border border-black transition-colors rounded-none disabled:opacity-40"
          >
            {checking
              ? "Checking..."
              : subscribing
                ? "Subscribing..."
                : "Subscribe"}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithStatus[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null);

  const { address } = useAccount();
  const { signup } = useMaciSignup();

  const { subscribed, notSubscribed } = useMemo(() => {
    const sub = subscriptions.filter((s) => s.isSubscribed);
    const notSub = subscriptions.filter((s) => !s.isSubscribed);
    return { subscribed: sub, notSubscribed: notSub };
  }, [subscriptions]);

  const checkSubscriptionStatus = useCallback(
    async (subs: Subscription[]) => {
      if (!address) {
        return subs.map((s) => ({
          ...s,
          isSubscribed: false,
          checking: false,
        }));
      }

      try {
        const statusResult = await maciApi.getSignupStatus(address);
        const signedUpMacis = new Set(
          (statusResult.signups || []).map((s) => s.maciAddress.toLowerCase()),
        );

        return subs.map((sub) => ({
          ...sub,
          isSubscribed: signedUpMacis.has(sub.maciAddress.toLowerCase()),
          checking: false,
        }));
      } catch (err) {
        console.error("Failed to check signup status:", err);
        return subs.map((s) => ({
          ...s,
          isSubscribed: false,
          checking: false,
        }));
      }
    },
    [address],
  );

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const data = await maciApi.getDeployments();
        const subsWithStatus = data.map((s) => ({
          ...s,
          isSubscribed: false,
          checking: true,
        }));
        setSubscriptions(subsWithStatus);

        const checked = await checkSubscriptionStatus(data);
        setSubscriptions(checked);
      } catch (err: any) {
        console.error("Failed to fetch subscriptions:", err);
        setError(err.message || "Failed to load subscriptions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [checkSubscriptionStatus]);

  const handleSubscribe = async (maciAddress: string) => {
    setSubscribingTo(maciAddress);
    try {
      const result = await signup(maciAddress);
      if (result?.success) {
        const checked = await checkSubscriptionStatus(subscriptions);
        setSubscriptions(checked);
      }
    } catch (err: any) {
      console.error("Subscribe failed:", err);
      setError(err.message || "Failed to subscribe");
    } finally {
      setSubscribingTo(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-6 w-6 animate-spin border-2 border-black/20 border-t-black" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <p className="text-black/60 font-mono text-sm">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-black text-black hover:bg-black hover:text-white rounded-none"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-black/40 mb-2">
            Organizations
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-black">
            Subscriptions
          </h1>
        </header>

        {/* Subscribed Section */}
        {subscribed.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-black/40 mb-6">
              Your Subscriptions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/10">
              {subscribed.map((subscription) => (
                <div key={subscription.id} className="bg-white">
                  <SubscriptionCard
                    subscription={subscription}
                    isSubscribed={true}
                    checking={subscription.checking}
                    subscribing={false}
                    onSubscribe={() => {}}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Discover Section */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-black/40 mb-2">
            {subscribed.length > 0 ? "Discover" : "Available"}
          </h2>
          <p className="text-sm text-black/50 mb-6">
            Organizations using MACI for private voting
          </p>

          {notSubscribed.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/10">
              {notSubscribed.map((subscription) => (
                <div key={subscription.id} className="bg-white">
                  <SubscriptionCard
                    subscription={subscription}
                    isSubscribed={false}
                    checking={subscription.checking}
                    subscribing={subscribingTo === subscription.maciAddress}
                    onSubscribe={() =>
                      handleSubscribe(subscription.maciAddress)
                    }
                  />
                </div>
              ))}
            </div>
          ) : subscribed.length === 0 ? (
            <div className="border border-black/10 py-16 text-center">
              <p className="text-black/40 font-mono text-sm">
                No organizations found
              </p>
            </div>
          ) : (
            <div className="border border-black/10 py-12 text-center">
              <p className="text-black/30 text-sm">
                You're subscribed to all available organizations
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
