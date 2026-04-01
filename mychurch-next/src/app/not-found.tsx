import ErrorAnimatedPage from "@/components/ui/ErrorAnimatedPage";

export default function NotFound() {
    return (
        <ErrorAnimatedPage
            code={404}
            title="انگار گم شدید! 😕"
            message="صفحه ای که دنبالش می گردید وجود ندارد یا جابه جا شده است."
            hintEn="The page you are looking for is not available!"
        />
    );
}
