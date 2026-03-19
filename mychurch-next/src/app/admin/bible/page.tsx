import AdminBibleClient from "./AdminBibleClient";

export const metadata = {
    title: "هوش مصنوعی و انجیل | MyChurch Admin",
    description: "تبدیل اتوماتیک صوت به تایم‌لاین آیات کتاب مقدس با استفاده از Gemini Flash",
};

export default function BibleAdminPage() {
    return <AdminBibleClient />;
}
