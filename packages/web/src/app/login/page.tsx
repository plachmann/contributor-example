"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleDevLogin = async () => {
    try {
      const res = await apiFetch<{ token: string }>("/auth/dev-login", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      await login(res.token);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleOAuthLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    window.location.href = `${apiUrl}/auth/login`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🎁</div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
            Bonus Gifting
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Spread the love to your coworkers
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleOAuthLogin} className="w-full" size="lg">
            Sign in with Google
          </Button>

          {process.env.NODE_ENV !== "production" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or dev login
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDevLogin()}
                />
                <Button variant="outline" onClick={handleDevLogin}>
                  Login
                </Button>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
