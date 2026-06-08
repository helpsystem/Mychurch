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
} from "@react-email/components";
import * as React from "react";

interface Admin2faOtpEmailProps {
    code: string;
}

export default function Admin2faOtpEmail({ code }: Admin2faOtpEmailProps) {
    return (
        <Html lang="fa" dir="rtl">
            <Head />
            <Preview>کد تایید دو مرحله‌ای پنل مدیریت | MyChurch Admin 2FA Code</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Logo */}
                    <Section style={{ textAlign: "center" as const, marginBottom: "20px" }}>
                        <Img
                            src="https://iranianchurchdc.com/logo-transparent.png"
                            width="56"
                            height="56"
                            alt="MyChurch"
                            style={{ margin: "0 auto" }}
                        />
                    </Section>

                    {/* Farsi Section */}
                    <Section style={card}>
                        <Heading style={h1}>تاییدیه امنیتی ورود (2FA)</Heading>
                        <Text style={paragraph}>
                            یک درخواست برای ورود به پنل مدیریت MyChurch با حساب شما ثبت شده است. لطفاً کد زیر را جهت احراز هویت وارد کنید:
                        </Text>
                        
                        {/* OTP Box */}
                        <Section style={otpBox}>
                            <Text style={otpText}>{code}</Text>
                        </Section>

                        <Text style={notice}>این کد تایید به مدت ۱۰ دقیقه معتبر می‌باشد.</Text>
                    </Section>

                    {/* English Section */}
                    <Section style={{ ...card, direction: "ltr" as const, textAlign: "left" as const, marginTop: "20px" }}>
                        <Heading style={{ ...h1, textAlign: "left" as const }}>Admin 2FA Verification</Heading>
                        <Text style={{ ...paragraph, textAlign: "left" as const }}>
                            A login request for the admin console has been initiated for your account. Use this security code to verify:
                        </Text>
                        
                        <Section style={{ ...otpBox, borderColor: "rgba(186, 149, 92, 0.2)" }}>
                            <Text style={{ ...otpText, color: "#a8a29e" }}>{code}</Text>
                        </Section>

                        <Text style={{ ...notice, textAlign: "left" as const }}>This code is valid for 10 minutes.</Text>
                    </Section>

                    {/* Footer */}
                    <Section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px", marginTop: "40px", textAlign: "center" as const }}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} Iranian Christian Church of D.C.<br />
                            USA
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
    maxWidth: "500px",
    margin: "0 auto",
};

const card = {
    backgroundColor: "#1c1917",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "20px",
    padding: "30px",
    textAlign: "center" as const,
};

const h1 = {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#ba955c",
    margin: "0 0 10px 0",
};

const paragraph = {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#e7e5e4",
    margin: "0 0 20px 0",
};

const otpBox = {
    backgroundColor: "#000000",
    border: "1px solid rgba(186, 149, 92, 0.35)",
    borderRadius: "12px",
    padding: "15px",
    margin: "20px 0",
};

const otpText = {
    fontSize: "32px",
    fontWeight: "bold",
    letterSpacing: "8px",
    color: "#ba955c",
    margin: "0",
    fontFamily: "monospace",
};

const notice = {
    fontSize: "12px",
    color: "#78716c",
    margin: "0",
};

const footerText = {
    fontSize: "11px",
    color: "#57534e",
    lineHeight: "1.5",
};
