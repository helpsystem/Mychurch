import { createClient } from "@/utils/supabase/server";
import ProfilePageClient from "./ProfilePageClient";

export default async function ProfilePage() {
    // Check if the AI Avatar widget is enabled by the admin
    const supabase = await createClient();
    const { data: widgetData } = await supabase
        .from('widgets')
        .select('is_active')
        .eq('id', 'w_ai_avatar')
        .single();

    const isAiAvatarEnabled = widgetData?.is_active ?? false;

    return <ProfilePageClient isAiAvatarEnabled={isAiAvatarEnabled} />;
}
