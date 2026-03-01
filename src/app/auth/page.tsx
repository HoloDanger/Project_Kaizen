"use client";

import { authClient } from "@/src/lib/auth-client";
import { useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async () => {
    if (isLogin) {
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/",
      });
    } else {
      await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/",
      });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center flex-col font-sans bg-black text-white">
      <div className="w-full max-w-md p-8 space-y-6 border border-neutral-800 rounded-lg bg-neutral-900">
        <h1 className="text-2xl font-bold tracking-tight text-center">
          {isLogin ? "Sign In" : "Create Account"}
        </h1>
        
        <div className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-neutral-800 rounded focus:border-white focus:outline-none"
                placeholder="Agent Name"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-neutral-800 rounded focus:border-white focus:outline-none"
              placeholder="agent@archon.works"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-neutral-800 rounded focus:border-white focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-2 font-medium bg-white text-black rounded hover:bg-neutral-200 transition-colors"
          >
            {isLogin ? "Enter System" : "Initialize Node"}
          </button>
        </div>

        <div className="text-center text-sm text-neutral-500">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="hover:text-white underline"
          >
            {isLogin ? "Need access? Initialize" : "Already active? Enter"}
          </button>
        </div>
      </div>
    </main>
  );
}
