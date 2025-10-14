"use client";
import React from "react";
import { Button } from "@sasvoth/ui/button";
import { Input } from "@sasvoth/ui/input";
import { useState } from "react";
import { signinWithGoogle } from "@/app/api/auth";
function IconButton({
  children,
  label,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Button
      type="button"
      className="w-full flex items-center justify-center gap-2 py-2 border rounded hover:bg-gray-100 transition relative h-12"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
    >
      {children}
      {hover && (
        <span className="absolute left-full ml-3 px-3 py-1 bg-gray-800 text-white text-xs rounded shadow z-10 whitespace-nowrap">
          {label}
        </span>
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [walletError, setWalletError] = useState<string| null>(null);
  const handleWalletLogin = async () => {
    setWalletError(null);
    try{
      if (!(window as any).ethereum) {
        setWalletError("MetaMask is not installed.");
        return;
      }
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];
      const message = "Sign to login with MetaMask";
      const signature = await (window as any).ethereum.request({
        method: "personal_sign",
        params: [message, account],
      });
      console.log("Address:", account);
      console.log("Signature:", signature);
      // Send walletAddress and signature to backend for verification and login
    } catch (err: any) {
      console.error(err);
      setWalletError("Failed to connect wallet.");
    } 
  
  }
  const handleGoogleLogin = () => {
    signinWithGoogle();
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-semibold text-center mb-6">Login</h1>
        <div className="text-center mb-4 text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="underline text-blue-600 hover:text-blue-800 font-medium"
          >
            Sign up
          </a>
        </div>
        <form className="space-y-4">
          <Input
            type="text"
            placeholder="Username or Email"
            className="w-full"
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Password"
            className="w-full"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Login
          </Button>
        </form>
        <div className="my-6 flex items-center">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-2 text-xs text-gray-400">or</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <div className="space-y-2">
          <IconButton label="Login with Google" onClick = {handleGoogleLogin}>
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <g>
                <path
                  fill="#4285F4"
                  d="M44.5 20H24v8.5h11.7C34.1 33.7 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.6 0 5 .8 7 2.2l6.4-6.4C33.5 5.1 28.9 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"
                />
                <path
                  fill="#34A853"
                  d="M6.3 14.7l7 5.1C15.1 17.1 19.2 14 24 14c2.6 0 5 .8 7 2.2l6.4-6.4C33.5 5.1 28.9 3 24 3c-7.4 0-13.7 4.2-17 10.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.2-5.1C29.7 36 24 36 24 36c-5.7 0-10.1-2.3-13.2-5.8l-7 5.4C6.2 39.8 14.1 44 24 44z"
                />
                <path
                  fill="#EA4335"
                  d="M44.5 20H24v8.5h11.7c-1.1 3.1-4.1 5.5-7.7 5.5-5.7 0-10.1-4.6-10.1-10.1 0-1.6.4-3.1 1.1-4.4l-7-5.1C7.1 17.1 6 19.9 6 23c0 7.1 5.8 13 13 13 7.2 0 13-5.8 13-13 0-.9-.1-1.8-.2-2.7z"
                />
              </g>
            </svg>
          </IconButton>
          <IconButton label="Login with GitHub">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#181717"
                d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.262.82-.582 0-.288-.012-1.243-.018-2.252-3.338.726-4.042-1.415-4.042-1.415-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.931 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.803 5.625-5.475 5.921.43.372.823 1.104.823 2.225 0 1.606-.015 2.898-.015 3.293 0 .322.218.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"
              />
            </svg>
          </IconButton>
          <IconButton label="Login with MetaMask" onClick={handleWalletLogin}>
            <svg className="w-5 h-5" viewBox="0 0 32 32">
              <path
                fill="#f6851b"
                d="M29.1 6.6c-2.7-2.7-7.1-2.7-9.8 0l-1.3 1.3-1.3-1.3c-2.7-2.7-7.1-2.7-9.8 0-2.7 2.7-2.7 7.1 0 9.8l1.3 1.3 9.8 9.8 9.8-9.8 1.3-1.3c2.7-2.7 2.7-7.1 0-9.8z"
              />
            </svg>
          </IconButton>
        </div>
      </div>
    </div>
  );
}
