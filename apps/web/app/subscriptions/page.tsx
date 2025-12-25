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
    <Card className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <Avatar className="w-20 h-20 mb-3">
        <AvatarImage src={subscription.logo} alt={subscription.name} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
          {subscription.name?.slice(0, 2).toUpperCase() || "MA"}
        </AvatarFallback>
      </Avatar>

      <h3 className="text-lg font-bold text-gray-900 mb-1">
        {subscription.name}
      </h3>

      <div className="flex gap-4 text-sm text-gray-500 mb-4">
        <span>{subscription.members.toLocaleString()} members</span>
        <span>•</span>
        <span>{subscription.pollCount} polls</span>
      </div>

      {isSubscribed ? (
        <Link
          href={`/subscriptions/${subscription.maciAddress}`}
          className="w-full"
        >
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            View
          </Button>
        </Link>
      ) : (
        <Button
          onClick={onSubscribe}
          disabled={checking || subscribing}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
        >
          {checking
            ? "Checking..."
            : subscribing
              ? "Subscribing..."
              : "Subscribe"}
        </Button>
      )}
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

  // Split into subscribed and not subscribed
  const { subscribed, notSubscribed } = useMemo(() => {
    const sub = subscriptions.filter((s) => s.isSubscribed);
    const notSub = subscriptions.filter((s) => !s.isSubscribed);
    return { subscribed: sub, notSubscribed: notSub };
  }, [subscriptions]);

  // Check subscription (MACI signup) status from DATABASE (fast, no on-chain query)
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
        // Get all user's signups in ONE API call (efficient)
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
        // Fallback: assume not subscribed
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subscribed Section */}
        {subscribed.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Subscriptions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {subscribed.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  isSubscribed={true}
                  checking={subscription.checking}
                  subscribing={false}
                  onSubscribe={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {/* Discover Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {subscribed.length > 0 ? "Discover" : "Organizations"}
          </h2>
          <p className="text-gray-500 mb-6">
            Organizations using MACI for private voting
          </p>

          {notSubscribed.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {notSubscribed.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  isSubscribed={false}
                  checking={subscription.checking}
                  subscribing={subscribingTo === subscription.maciAddress}
                  onSubscribe={() => handleSubscribe(subscription.maciAddress)}
                />
              ))}
            </div>
          ) : subscribed.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No organizations found</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">
                You're subscribed to all available organizations!
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
