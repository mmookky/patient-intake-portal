import { PatientForm } from "@/components/patient-form";

export default async function PatientPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <PatientForm sessionId={sessionId} />;
}
