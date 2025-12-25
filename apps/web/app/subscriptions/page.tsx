"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@sasvoth/ui/avatar";
import { Button } from "@sasvoth/ui/button";
import { Card } from "@sasvoth/ui/card";
import Link from "next/link";

type Subscription = {
  id: string;
  name: string;
  logo?: string;
  members: number;
  pollCount: number;
  maciAddress: string;
};

// Mock data - replace with API call when backend is ready
const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "1",
    name: "CSES",
    logo: "/logo-cses.png",
    members: 2104,
    pollCount: 5,
    maciAddress: "0x1234...5678",
  },
  {
    id: "2", 
    name: "DevDAO",
    logo: undefined,
    members: 856,
    pollCount: 3,
    maciAddress: "0x2345...6789",
  },
  {
    id: "3",
    name: "Web3 Club",
    logo: undefined,
    members: 1203,
    pollCount: 8,
    maciAddress: "0x3456...7890",
  },
];

function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  return (
    <Card className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <Avatar className="w-24 h-24 mb-4">
        <AvatarImage src={subscription.logo} alt={subscription.name} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
          {subscription.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <h3 className="text-lg font-bold text-gray-900 mb-1">
        {subscription.name}
      </h3>
      
      <p className="text-sm text-gray-500 mb-4">
        {subscription.members.toLocaleString()} members
      </p>
      
      <Link href={`/subscriptions/${subscription.id}`} className="w-full">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          View
        </Button>
      </Link>
    </Card>
  );
}

export default function SubscriptionsPage() {
  // TODO: Replace with actual API call
  // const { data: subscriptions } = useQuery(['subscriptions'], maciApi.getDeployments);
  const subscriptions = MOCK_SUBSCRIPTIONS;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-500 mt-2">
            Organizations using MACI for private voting
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {subscriptions.map((subscription) => (
            <SubscriptionCard key={subscription.id} subscription={subscription} />
          ))}
        </div>

        {subscriptions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No subscriptions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
