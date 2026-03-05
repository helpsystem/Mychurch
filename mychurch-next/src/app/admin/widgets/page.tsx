import { getWidgets } from "@/actions/widgets";
import WidgetsClient from "./WidgetsClient";

export const dynamic = "force-dynamic";

export default async function WidgetsSettingsPage() {
    // Fetch widgets directly from Supabase via Server Action
    const widgets = await getWidgets();

    return <WidgetsClient initialWidgets={widgets} />;
}
