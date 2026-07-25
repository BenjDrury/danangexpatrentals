/** Parse expected commission fields from partner deal forms. */

export type DealCommissionFields = {
  expected_commission_usd: number | null;
  expected_commission_pct: number | null;
  notes: string | null;
};

export function parseCommissionFormData(
  formData: FormData
): DealCommissionFields | { error: string } {
  const notes = String(formData.get("commission_note") ?? "").trim() || null;

  const usdRaw = String(formData.get("commission_usd") ?? "").trim();
  let expected_commission_usd: number | null = null;
  if (usdRaw) {
    const n = Number(usdRaw);
    if (!Number.isFinite(n) || n < 0) {
      return { error: "Commission USD must be a non-negative number." };
    }
    expected_commission_usd = n;
  }

  const pctRaw = String(formData.get("commission_pct") ?? "").trim();
  let expected_commission_pct: number | null = null;
  if (pctRaw) {
    const n = Number(pctRaw);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return { error: "Commission % must be between 0 and 100." };
    }
    expected_commission_pct = n;
  }

  return { expected_commission_usd, expected_commission_pct, notes };
}

export function hasAnyCommission(fields: DealCommissionFields): boolean {
  return (
    fields.expected_commission_usd != null ||
    fields.expected_commission_pct != null ||
    Boolean(fields.notes)
  );
}
