"use client";
import React, { useState } from "react";
import { Input } from "@sasvoth/ui/input";
import { useAuth } from "@/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const steps = [
  { label: "Account", key: 1 },
  { label: "Wallet", key: 2 },
];

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  wallet: z.string().optional(),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const { signupWithEmail } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      wallet: "",
    },
    mode: "onChange",
  });

  const walletAddress = watch("wallet");

  const handleNext = async () => {
    const isValid = await trigger(["name", "email", "password"]);
    if (isValid) {
      setStep(2);
    }
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setWalletError(null);
    try {
      if (!(window as any).ethereum) {
        setWalletError("MetaMask is not installed.");
        setIsConnecting(false);
        return;
      }
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      setValue("wallet", accounts[0]);
    } catch (err: any) {
      setWalletError("Failed to connect wallet.");
    }
    setIsConnecting(false);
  };

  const onSubmit = async (data: SignUpFormData) => {
    try {
      await signupWithEmail(data.email, data.password, data.name, data.wallet);
    } catch (error) {
      // Error is handled by useAuth/authApi
    }
  };

  const handleStepNav = async (targetStep: number) => {
    if (targetStep < step) {
      setStep(targetStep);
    } else if (targetStep > step) {
      if (step === 1) {
        const isValid = await trigger(["name", "email", "password"]);
        if (isValid) {
          setStep(targetStep);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center mb-4 text-black">
          Sign Up
        </h2>
        <div className="text-center mb-2">
          <span className="text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="/signin"
              className="text-black underline hover:text-gray-900 transition"
            >
              Sign in
            </a>
          </span>
        </div>
        {/* Step Navigator */}
        <div className="flex justify-center mb-6">
          {steps.map((s, idx) => (
            <React.Fragment key={s.key}>
              <button
                type="button"
                onClick={() => handleStepNav(s.key)}
                disabled={s.key === step}
                className={`
                                    px-4 py-2 bg-transparent border-none outline-none shadow-none rounded-none
                                    ${s.key === step ? "text-black underline" : "text-gray-400"}
                                    font-medium transition
                                    ${s.key < step ? "cursor-pointer" : ""}
                                `}
              >
                {s.label}
              </button>
              {idx < steps.length - 1 && (
                <span className="mx-2 text-gray-300">/</span>
              )}
            </React.Fragment>
          ))}
        </div>
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm mb-1 text-black" htmlFor="name">
                Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                className="bg-white border-black text-black"
                {...register("name")}
              />
              {errors.name && (
                <div className="text-red-600 text-xs mt-1">
                  {errors.name.message}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm mb-1 text-black" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="bg-white border-black text-black"
                {...register("email")}
              />
              {errors.email && (
                <div className="text-red-600 text-xs mt-1">
                  {errors.email.message}
                </div>
              )}
            </div>
            <div>
              <label
                className="block text-sm mb-1 text-black"
                htmlFor="password"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                className="bg-white border-black text-black"
                {...register("password")}
              />
              {errors.password && (
                <div className="text-red-600 text-xs mt-1">
                  {errors.password.message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="w-full bg-black text-white py-2 rounded hover:bg-gray-900 transition"
            >
              Next
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <div className="mb-4">
              <label className="block text-sm mb-1 text-black">
                MetaMask Wallet
              </label>
              {walletAddress ? (
                <div className="p-2 bg-gray-100 rounded text-black text-sm">
                  Connected: {walletAddress}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="w-full bg-black text-white py-2 rounded hover:bg-gray-900 transition"
                >
                  {isConnecting ? "Connecting..." : "Connect MetaMask"}
                </button>
              )}
              {walletError && (
                <div className="text-red-600 text-xs mt-2">{walletError}</div>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded hover:bg-gray-900 transition"
              disabled={isSubmitting || !walletAddress}
            >
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </button>
            <button
              type="button"
              className="w-full mt-2 text-gray-400 underline"
              onClick={() => setStep(1)}
            >
              Back
            </button>
          </>
        )}
      </form>
    </div>
  );
}
