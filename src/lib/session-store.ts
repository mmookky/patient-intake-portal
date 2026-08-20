import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { PatientSession } from "@/lib/patient-schema";

const localKey = (id: string) => `patient-intake-session:${id}`;
export const staffFeedChannelName = "patient-intake-portal:staff-feed";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function canPersistToSupabase(id: string): boolean {
  return uuidPattern.test(id);
}

export interface SessionRow {
  id: string;
  form_data: PatientSession["formData"];
  status: PatientSession["status"];
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export function sessionFromRow(row: SessionRow): PatientSession {
  return {
    id: row.id,
    formData: row.form_data,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
  };
}

export async function saveSession(session: PatientSession): Promise<void> {
  localStorage.setItem(localKey(session.id), JSON.stringify(session));
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !canPersistToSupabase(session.id)) {
    const channel = new BroadcastChannel(staffFeedChannelName);
    channel.postMessage({ sessionId: session.id, status: session.status });
    channel.close();
    return;
  }

  const { error } = await supabase.from("patient_sessions").upsert({
    id: session.id,
    form_data: session.formData,
    status: session.status,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
    submitted_at: session.submittedAt,
  });

  if (error) throw error;
}

export async function loadSession(id: string): Promise<PatientSession | null> {
  const supabase = getSupabaseBrowserClient();
  if (supabase && canPersistToSupabase(id)) {
    const { data, error } = await supabase
      .from("patient_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (data) return sessionFromRow(data as SessionRow);
  }

  const stored = localStorage.getItem(localKey(id));
  return stored ? (JSON.parse(stored) as PatientSession) : null;
}
