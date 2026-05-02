import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  FileText,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { createActor } from "../backend";
import { useAuth } from "../hooks/useAuth";

const FEATURES = [
  {
    icon: FileText,
    title: "Digital Invoicing",
    desc: "Create, manage and print invoices instantly",
  },
  {
    icon: TrendingUp,
    title: "Revenue Tracking",
    desc: "Monitor billing totals and monthly trends",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    desc: "Data secured on the Internet Computer",
  },
];

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const router = useRouter();

  const [showSignup, setShowSignup] = useState(false);
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState(false);

  // Read URL query param "reason"
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const reason = searchParams.get("reason");

  if (isAuthenticated) return <Navigate to="/dashboard" />;

  const handleRegisterShop = async () => {
    setRegisterError(null);
    setIsRegistering(true);
    try {
      // Step 1: login with Internet Identity first
      await login();
      // Step 2: call activateWithCode with phone + code + shopName
      if (actor) {
        const a = actor as unknown as {
          activateWithCode: (
            phone: string,
            code: string,
            shopName: string,
          ) => Promise<
            | { __kind__: "ok"; ok: { approvalCode?: string } }
            | { __kind__: "err"; err: string }
          >;
        };
        const result = await a.activateWithCode(
          phone.trim(),
          activationCode.trim(),
          shopName.trim(),
        );
        if (result.__kind__ === "err") {
          setRegisterError(
            "Invalid phone number or activation code. Please contact admin.",
          );
          setIsRegistering(false);
          return;
        }
        qc.invalidateQueries({ queryKey: ["callerTenantStatus"] });
        setActivationSuccess(true);
        setIsRegistering(false);
        return;
      }
      router.navigate({ to: "/dashboard" });
    } catch (err) {
      setRegisterError(
        err instanceof Error ? err.message : "Registration failed",
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero flex-col justify-between p-12 border-r border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            MediBill <span className="text-gradient-primary">Pro</span>
          </span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight text-foreground mb-4">
              Professional billing for{" "}
              <span className="text-gradient-primary">medical practices</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Streamline your invoicing, track payments, and manage your
              practice finances with confidence.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <img
          src="/assets/generated/medibill-hero.dim_1200x500.jpg"
          alt="MediBill Pro dashboard preview"
          className="rounded-2xl shadow-elevated w-full object-cover h-48"
        />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:hidden">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              MediBill Pro
            </h1>
          </div>

          {/* Reason banners */}
          {reason === "suspended" && (
            <div
              className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
              data-ocid="login.suspended.error_state"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Your account has been suspended. Please contact support.
              </span>
            </div>
          )}
          {reason === "expired" && (
            <div
              className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
              data-ocid="login.expired.error_state"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Your trial or subscription has expired. Please contact your
                administrator.
              </span>
            </div>
          )}

          <div>
            <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">
              {showSignup ? "Register your shop" : "Sign in"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {showSignup
                ? "Enter your activation code to create your account"
                : "Access your medical billing dashboard"}
            </p>
          </div>

          <Card className="shadow-subtle border-border">
            <CardContent className="p-6 space-y-5">
              {!showSignup ? (
                /* ── Login view ── */
                <div className="space-y-5">
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Sign in with your Internet Identity to access your
                      practice billing portal.
                    </p>
                    <div className="flex items-center gap-2 bg-muted/60 rounded-lg p-3 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>
                        Secured by Internet Identity — no passwords required
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={login}
                    disabled={isLoading}
                    className="w-full h-11 font-semibold gradient-primary border-0 text-primary-foreground"
                    data-ocid="login.primary_button"
                  >
                    {isLoading
                      ? "Connecting..."
                      : "Sign in with Internet Identity"}
                  </Button>
                </div>
              ) : (
                /* ── Signup view ── */
                <div className="space-y-4">
                  {activationSuccess ? (
                    /* ── Post-activation success ── */
                    <div className="space-y-4">
                      <div
                        className="rounded-lg border border-yellow-300/60 bg-yellow-500/8 p-4 space-y-3"
                        data-ocid="signup.activation_success.panel"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          Your account has been activated. Waiting for admin
                          approval.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          The admin will review your account and grant access
                          shortly. Please sign in with Internet Identity once
                          approved.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full h-9 text-sm"
                        onClick={() => {
                          setActivationSuccess(false);
                          setShowSignup(false);
                        }}
                        data-ocid="signup.activation_success.back_button"
                      >
                        Back to Sign In
                      </Button>
                    </div>
                  ) : phone.trim() === "9403612490" ? (
                    /* ── Admin direct login path ── */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          data-ocid="signup.phone.input"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-muted/60 rounded-lg p-3 text-xs text-muted-foreground">
                        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>
                          Admin access detected — no activation code required
                        </span>
                      </div>
                      <Button
                        onClick={login}
                        disabled={isLoading}
                        className="w-full h-11 font-semibold gradient-primary border-0 text-primary-foreground"
                        data-ocid="signup.admin_login.submit_button"
                      >
                        {isLoading ? "Connecting..." : "Login as Admin"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          data-ocid="signup.phone.input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="activationCode"
                          className="text-sm font-medium"
                        >
                          Activation Code
                        </Label>
                        <Input
                          id="activationCode"
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="4-digit code from admin"
                          value={activationCode}
                          onChange={(e) =>
                            setActivationCode(
                              e.target.value.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                          data-ocid="signup.activation_code.input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="shopName"
                          className="text-sm font-medium"
                        >
                          Shop / Practice Name
                        </Label>
                        <Input
                          id="shopName"
                          placeholder="e.g. City Medical Centre"
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          data-ocid="signup.shop_name.input"
                        />
                      </div>
                      {registerError && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="signup.error_state"
                        >
                          {registerError}
                        </p>
                      )}
                      <div className="flex items-center gap-2 bg-muted/60 rounded-lg p-3 text-xs text-muted-foreground">
                        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>
                          You'll be asked to sign in with Internet Identity to
                          complete registration
                        </span>
                      </div>
                      <Button
                        onClick={handleRegisterShop}
                        disabled={
                          isRegistering ||
                          !shopName.trim() ||
                          !phone.trim() ||
                          activationCode.length !== 4
                        }
                        className="w-full h-11 font-semibold gradient-primary border-0 text-primary-foreground"
                        data-ocid="signup.register.submit_button"
                      >
                        {isRegistering
                          ? "Activating..."
                          : "Activate with Internet Identity"}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground pt-1">
                        Need an activation code? Contact the admin to get one.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Toggle between login and signup */}
          <div className="text-center">
            {!showSignup ? (
              <p className="text-sm text-muted-foreground">
                New here?{" "}
                <button
                  type="button"
                  onClick={() => setShowSignup(true)}
                  className="text-primary underline hover:text-primary/80 transition-smooth font-medium"
                  data-ocid="login.signup_toggle.button"
                >
                  Register your shop
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setShowSignup(false)}
                  className="text-primary underline hover:text-primary/80 transition-smooth font-medium"
                  data-ocid="signup.login_toggle.button"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <a
              href="/terms"
              className="underline hover:text-foreground transition-smooth"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline hover:text-foreground transition-smooth"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
