import { getLeaders } from "@/actions/leaders";
import LeadersClient from "./LeadersClient";

export const dynamic = "force-dynamic";

export default async function LeadersManagementPage() {
    // 1. Fetch live data from PostgreSQL (falls back to mocks if DB is down)
    const leaders = await getLeaders();

    return <LeadersClient initialLeaders={leaders} />;
}
