import WorshipAdminClient from "./WorshipAdminClient";

export const metadata = {
    title: "مدیریت سرودها | MyChurch Admin",
};

export default function WorshipAdminPage() {
    return (
        <div className="min-h-[100dvh] bg-background">
            <WorshipAdminClient />
        </div>
    );
}
