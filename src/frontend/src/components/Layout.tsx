import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Settings,
  Shield,
  Stethoscope,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAuth, useCurrentUser } from "../hooks/useAuth";
import { TierBadge } from "./TierBadge";

interface LayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/medicines", label: "Saved Medicines", icon: Pill },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const { logout } = useAuth();
  const { displayName, tier, isAdmin } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-subtle sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 md:px-6 h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden p-2 rounded-md hover:bg-muted transition-smooth"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              onKeyDown={(e) =>
                e.key === "Enter" && setSidebarOpen(!sidebarOpen)
              }
              aria-label="Toggle sidebar"
              data-ocid="nav.menu_toggle"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 transition-smooth hover:opacity-80"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-foreground">
                MediBill <span className="text-gradient-primary">Pro</span>
              </span>
            </Link>
          </div>

          {/* User section */}
          <div className="flex items-center gap-3">
            <TierBadge tier={tier} className="hidden sm:inline-flex" />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {tier} plan
              </p>
            </div>
            <Separator orientation="vertical" className="h-8 hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground gap-2 transition-smooth"
              data-ocid="nav.logout_button"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-foreground/20 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] w-60 bg-sidebar border-r border-sidebar-border z-30",
            "flex flex-col transition-transform duration-300",
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0",
          )}
        >
          <nav className="flex-1 p-4 space-y-1" data-ocid="nav.sidebar">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active =
                currentPath === to || currentPath.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                  data-ocid={`nav.${label.toLowerCase()}_link`}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      active && "text-primary",
                    )}
                  />
                  {label}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                  currentPath === "/admin"
                    ? "bg-accent/20 text-accent-foreground font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
                data-ocid="nav.admin_link"
              >
                <Shield className="w-4 h-4 flex-shrink-0 text-accent-foreground" />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-xs font-semibold text-foreground">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {`${tier === "developer" ? "Developer" : "User"} Plan`}
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto bg-background">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-4 md:p-6 animate-fade-in">{children}</div>

            {/* Footer */}
            <footer className="bg-muted/40 border-t border-border mt-auto">
              <div className="px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-foreground">
                    MediBill Pro
                  </span>
                  <span>
                    © {new Date().getFullYear()}. All rights reserved.
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="/support"
                    className="hover:text-foreground transition-smooth"
                  >
                    Support
                  </a>
                  <a
                    href="/privacy"
                    className="hover:text-foreground transition-smooth"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="/terms"
                    className="hover:text-foreground transition-smooth"
                  >
                    Terms
                  </a>
                  <span>
                    Built with love using{" "}
                    <a
                      href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-foreground transition-smooth"
                    >
                      caffeine.ai
                    </a>
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
