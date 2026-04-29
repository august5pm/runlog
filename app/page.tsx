import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isGoogleOAuthConfigured } from "@/lib/auth";
import { Landing } from "@/components/Landing";

function pickSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/dashboard");
  }
  const oauthError = pickSearchParam(searchParams.error);
  return (
    <Landing
      googleOAuthReady={isGoogleOAuthConfigured()}
      oauthErrorFromUrl={oauthError}
    />
  );
}
