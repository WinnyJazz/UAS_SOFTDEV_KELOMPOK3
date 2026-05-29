"use client";

import { usePathname } from "next/navigation";
import Footer from "./footer";
import AdminFooter from "./adminFooter";

export default function FooterSwitcher() {
  const pathname = usePathname() ?? "";
  const isAdminSection = pathname.startsWith("/admin") || pathname.startsWith("/superadmin");

  return isAdminSection ? <AdminFooter /> : <Footer />;
}
