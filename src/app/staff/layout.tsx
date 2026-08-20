import { StaffSessionMonitor } from "@/components/staff-session-monitor";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StaffSessionMonitor>{children}</StaffSessionMonitor>;
}
