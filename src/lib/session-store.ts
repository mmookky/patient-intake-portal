import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { PatientSession } from "@/lib/patient-schema";

const localKey = (id: string) => `agnos-patient-session:${id}`;

interface SessionRow {
  id: string;
  form_data: PatientSession["formData"];
  status: PatientSession["status"];
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

function fromRow(row: SessionRow): PatientSession {
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
  if (!supabase) return;

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
  if (supabase) {
    const { data, error } = await supabase.from("patient_sessions").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (data) return fromRow(data as SessionRow);
  }

  const stored = localStorage.getItem(localKey(id));
  return stored ? (JSON.parse(stored) as PatientSession) : null;
}
