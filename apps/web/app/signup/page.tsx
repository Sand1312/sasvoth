"use client";
import React, { useState } from "react";
import { Input } from "@sasvoth/ui/input";

const steps = [
  { label: "Account", key: 1 },
  { label: "Wallet", key: 2 },
];

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    wallet: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const validate = () => {
    const newErrors = { name: "", email: "", password: "" };
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.email.trim()) newErrors.email = "Email is required.";
    else if (!validateEmail(form.email))
      newErrors.email = "Invalid email address.";
    if (!form.password) newErrors.password = "Password is required.";
    else if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";
    setErrors(newErrors);
    return !newErrors.name && !newErrors.email && !newErrors.password;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setStep(2);
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
      setForm((prev) => ({ ...prev, wallet: accounts[0] }));
    } catch (err: any) {
      setWalletError("Failed to connect wallet.");
    }
    setIsConnecting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign up logic here, form contains wallet address
  };

  const handleStepNav = (targetStep: number) => {
    if (targetStep < step) {
      setStep(targetStep);
    } else if (targetStep > step) {
      if (step === 1 && validate()) {
        setStep(targetStep);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={step === 1 ? handleNext : handleSubmit}
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
                                    px-4 py-2 bg-transparent border-none outline-none
                                    ${s.key === step ? "text-black underline" : "text-gray-400"}
                                    font-medium transition
                                    ${s.key < step ? "cursor-pointer" : ""}
                                `}
                style={{
                  boxShadow: "none",
                  borderRadius: 0,
                }}
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
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                required
                className="bg-white border-black text-black"
              />
              {errors.name && (
                <div className="text-red-600 text-xs mt-1">{errors.name}</div>
              )}
            </div>
            <div>
              <label className="block text-sm mb-1 text-black" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="bg-white border-black text-black"
              />
              {errors.email && (
                <div className="text-red-600 text-xs mt-1">{errors.email}</div>
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
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="bg-white border-black text-black"
              />
              {errors.password && (
                <div className="text-red-600 text-xs mt-1">
                  {errors.password}
                </div>
              )}
            </div>
            <button
              type="submit"
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
              {form.wallet ? (
                <div className="p-2 bg-gray-100 rounded text-black text-sm">
                  Connected: {form.wallet}
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
              disabled={!form.wallet}
            >
              Sign Up
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
