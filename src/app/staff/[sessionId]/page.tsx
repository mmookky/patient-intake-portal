import { StaffView } from "@/components/staff-view";

export default async function StaffPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <StaffView sessionId={sessionId} />;
}
