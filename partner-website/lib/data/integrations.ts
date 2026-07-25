import { createClient, getServiceRoleClient } from "@/lib/supabase/server";

export type IntegrationProvider = "facebook";

export type IntegrationStatus = "connected" | "disconnected";

export type CompanyIntegration = {
  id: string;
  estate_company_id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  external_account_id: string | null;
  external_account_name: string | null;
  meta: Record<string, unknown>;
  connected_at: string | null;
  updated_at: string;
};

const PUBLIC_FIELDS =
  "id, estate_company_id, provider, status, external_account_id, external_account_name, meta, connected_at, updated_at";

export async function getCompanyIntegration(
  estateCompanyId: string,
  provider: IntegrationProvider = "facebook",
): Promise<CompanyIntegration | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("estate_company_integrations")
    .select(PUBLIC_FIELDS)
    .eq("estate_company_id", estateCompanyId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    if (error.message.toLowerCase().includes("estate_company_integrations")) {
      return null;
    }
    console.error("getCompanyIntegration", error.message);
    return null;
  }
  return data as CompanyIntegration | null;
}

export async function disconnectCompanyIntegration(
  estateCompanyId: string,
  provider: IntegrationProvider = "facebook",
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const existing = await getCompanyIntegration(estateCompanyId, provider);

  if (!existing) {
    return {};
  }

  const { error } = await supabase
    .from("estate_company_integrations")
    .update({
      status: "disconnected",
      external_account_id: null,
      external_account_name: null,
      meta: {},
      connected_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("estate_company_id", estateCompanyId);

  if (error) {
    return { error: error.message };
  }

  const service = getServiceRoleClient();
  if (service) {
    await service
      .from("estate_company_integration_secrets")
      .delete()
      .eq("integration_id", existing.id);
  }

  return {};
}

/** Persist Facebook Page connection + token (service role for secrets). */
export async function upsertFacebookConnection(params: {
  estateCompanyId: string;
  pageId: string;
  pageName: string;
  accessToken: string;
  tokenExpiresAt?: string | null;
  meta?: Record<string, unknown>;
}): Promise<{ error?: string }> {
  const service = getServiceRoleClient();
  if (!service) {
    return {
      error:
        "Server missing SUPABASE_SERVICE_ROLE_KEY — cannot store Facebook tokens securely.",
    };
  }

  const now = new Date().toISOString();
  const { data: row, error: upsertError } = await service
    .from("estate_company_integrations")
    .upsert(
      {
        estate_company_id: params.estateCompanyId,
        provider: "facebook",
        status: "connected",
        external_account_id: params.pageId,
        external_account_name: params.pageName,
        meta: params.meta ?? {},
        connected_at: now,
        updated_at: now,
      },
      { onConflict: "estate_company_id,provider" },
    )
    .select("id")
    .single();

  if (upsertError || !row) {
    return {
      error:
        upsertError?.message ??
        "Could not save integration. Run supabase/15-partner-integrations.sql.",
    };
  }

  const { error: secretError } = await service
    .from("estate_company_integration_secrets")
    .upsert(
      {
        integration_id: row.id,
        access_token: params.accessToken,
        token_expires_at: params.tokenExpiresAt ?? null,
        updated_at: now,
      },
      { onConflict: "integration_id" },
    );

  if (secretError) {
    return { error: secretError.message };
  }

  return {};
}
