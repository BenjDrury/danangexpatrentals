import { getInviteByToken } from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";
import { InviteAcceptView } from "./InviteAcceptView";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <InviteAcceptView
      token={token}
      invite={
        invite
          ? {
              email: invite.email,
              status: invite.status,
              companyName: invite.companyName,
            }
          : null
      }
      userEmail={user?.email ?? null}
      isSignedIn={Boolean(user)}
    />
  );
}
