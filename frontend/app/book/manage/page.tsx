import { ManageBookingClient } from "@/components/ManageBookingClient";

type ManageBookingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ManageBookingPage({ searchParams }: ManageBookingPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const tokenParam = resolvedSearchParams.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] ?? "" : tokenParam ?? "";

  return <ManageBookingClient token={token} />;
}
