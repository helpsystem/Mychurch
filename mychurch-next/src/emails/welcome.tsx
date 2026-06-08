import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Button,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
    fullName: string;
    loginUrl: string;
}

export default function WelcomeEmail({ fullName, loginUrl }: WelcomeEmailProps) {
    return (
        <Html lang="fa" dir="rtl">
            <Head />
            <Preview>خوش‌آمدگویی به کلیسای ایرانیان مسیحی واشنگتن | Welcome to MyChurch</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header Image */}
                    <Section style={{ textAlign: "center" as const, marginBottom: "20px" }}>
                        <Img
                            src="https://iranianchurchdc.com/logo-transparent.png"
                            width="64"
                            height="64"
                            alt="MyChurch"
                            style={{ margin: "0 auto" }}
                        />
                    </Section>

                    {/* Main Welcome Card */}
                    <Section style={card}>
                        <Heading style={h1}>به خانه‌تان خوش آمدید</Heading>
                        <Text style={paragraph}>
                            سلام <strong>{fullName}</strong> عزیز،<br />
                            ثبت‌نام شما در خانواده کلیسای ایرانیان مسیحی واشنگتن دی‌سی با موفقیت انجام شد. ما بسیار شادمانیم که شما به جمع ما پیوسته‌اید و مشتاقانه منتظر مشارکت و رشد در ایمان در کنار شما هستیم.
                        </Text>

                        <Text style={paragraph}>
                            جهت ورود به حساب کاربری خود و دسترسی به بخش‌های ویژه اعضا، روی دکمه زیر کلیک کنید:
                        </Text>

                        <Section style={{ textAlign: "center" as const, margin: "25px 0" }}>
                            <Button href={loginUrl} style={button}>
                                ورود به پنل کاربری / Sign In
                            </Button>
                        </Section>

                        <div style={noticeContainer}>
                            <strong>توجه:</strong> جهت تایید و فعال‌سازی کامل حساب، حتماً لینک تاییدیه که پیش‌تر از سمت Supabase ارسال شده است را کلیک کنید.
                        </div>
                    </Section>

                    {/* English Welcome Card */}
                    <Section style={{ ...card, direction: "ltr" as const, textAlign: "left" as const, marginTop: "20px" }}>
                        <Heading style={{ ...h1, textAlign: "left" as const }}>Welcome to the Family</Heading>
                        <Text style={{ ...paragraph, textAlign: "left" as const }}>
                            Dear <strong>{fullName}</strong>,<br />
                            Thank you for joining the Iranian Christian Church of D.C. We are thrilled to welcome you as a member of our church family and look forward to growing in faith together.
                        </Text>

                        <Text style={{ ...paragraph, textAlign: "left" as const }}>
                            Click below to sign in to your dashboard:
                        </Text>

                        <Section style={{ textAlign: "center" as const, margin: "25px 0" }}>
                            <Button href={loginUrl} style={{ ...button, backgroundColor: "#ba955c" }}>
                                Sign In to Your Portal
                            </Button>
                        </Section>
                    </Section>

                    {/* Footer */}
                    <Section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px", marginTop: "40px", textAlign: "center" as const }}>
                        <Text style={footerText}>
                            kellisa.org • iranianchurchdc.com<br />
                            Iranian Christian Church D.C.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const main = {
    backgroundColor: "#0c0a09",
    color: "#ffffff",
    fontFamily: "Tahoma, Geneva, sans-serif",
    padding: "40px 10px",
};

const container = {
    maxWidth: "550px",
    margin: "0 auto",
};

const card = {
    backgroundColor: "#1c1917",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "24px",
    padding: "40px 30px",
};

const h1 = {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#ba955c",
    margin: "0 0 16px 0",
    textAlign: "center" as const,
};

const paragraph = {
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#e7e5e4",
    margin: "0 0 16px 0",
};

const button = {
    backgroundColor: "#ba955c",
    borderRadius: "12px",
    color: "#000000",
    fontSize: "15px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "14px 28px",
};

const noticeContainer = {
    border: "1px solid rgba(186, 149, 92, 0.3)",
    backgroundColor: "rgba(186, 149, 92, 0.08)",
    borderRadius: "12px",
    padding: "16px",
    margin: "20px 0 0 0",
    color: "#d6d3d1",
    fontSize: "13px",
    lineHeight: "1.6",
};

const footerText = {
    fontSize: "11px",
    color: "#57534e",
    lineHeight: "1.5",
};
