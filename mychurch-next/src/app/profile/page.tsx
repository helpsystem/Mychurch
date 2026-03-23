import { createClient } from "@/utils/supabase/server";
import ProfilePageClient from "./ProfilePageClient";
import { getUserProfile } from "@/actions/user";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const supabase = await createClient();
    
    // Get current auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect("/login");
    }

    // Check if the AI Avatar widget is enabled by the admin
    const { data: widgetData } = await supabase
        .from('widgets')
        .select('is_active')
        .eq('id', 'w_ai_avatar')
        .single();

    const isAiAvatarEnabled = widgetData?.is_active ?? false;

    // Fetch user profile from the DB (synced during login/signup)
    const profile = await getUserProfile(user.email!);

    return <ProfilePageClient isAiAvatarEnabled={isAiAvatarEnabled} initialUser={profile} />;
}
