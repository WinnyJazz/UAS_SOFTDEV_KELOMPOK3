"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Footer from "./footer";
import AdminFooter from "./adminFooter";

export default function FooterSwitcher() {
  const pathname = usePathname() ?? "";
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const updateUserRole = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const user = JSON.parse(stored);
          setUserRole(user.role ?? null);
          return;
        }
      } catch {
        // ignore parse errors
      }
      setUserRole(null);
    };

    updateUserRole();

    window.addEventListener("storage", updateUserRole);
    window.addEventListener("userLoggedIn", updateUserRole as EventListener);
    window.addEventListener("userLoggedOut", updateUserRole as EventListener);
    window.addEventListener("profileUpdated", updateUserRole as EventListener);

    return () => {
      window.removeEventListener("storage", updateUserRole);
      window.removeEventListener("userLoggedIn", updateUserRole as EventListener);
      window.removeEventListener("userLoggedOut", updateUserRole as EventListener);
      window.removeEventListener("profileUpdated", updateUserRole as EventListener);
    };
  }, []);

  const isAdminRole = userRole === "admin" || userRole === "superadmin";
  const isAdminSection = pathname.startsWith("/admin") || pathname.startsWith("/superadmin");
  const showAdminFooter = isAdminRole || isAdminSection;

  return showAdminFooter ? <AdminFooter /> : <Footer />;
}
