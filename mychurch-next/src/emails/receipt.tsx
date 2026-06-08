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

interface OrderItem {
    title: string;
    quantity: number;
    price: number;
}

interface ReceiptEmailProps {
    orderId: string;
    fullName: string;
    items: OrderItem[];
    subtotal: number;
    shippingCost: number;
    total: number;
    trackingNumber?: string;
    trackingUrl?: string;
}

export default function ReceiptEmail({
    orderId,
    fullName,
    items,
    subtotal,
    shippingCost,
    total,
    trackingNumber,
    trackingUrl
}: ReceiptEmailProps) {
    return (
        <Html lang="fa" dir="rtl">
            <Head />
            <Preview>رسید خرید از فروشگاه کلیسا | Order Receipt #{orderId}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={{ textAlign: "center" as const, marginBottom: "25px" }}>
                        <Img
                            src="https://iranianchurchdc.com/logo-transparent.png"
                            width="56"
                            height="56"
                            alt="MyChurch"
                            style={{ margin: "0 auto" }}
                        />
                    </Section>

                    {/* Receipt Card */}
                    <Section style={card}>
                        <Heading style={h1}>رسید پرداخت سفارش</Heading>
                        <Text style={paragraph}>
                            سلام <strong>{fullName}</strong> عزیز،<br />
                            پرداخت شما با موفقیت تایید شد و سفارش شما ثبت گردید. در زیر جزئیات رسید و وضعیت ارسال سفارش آورده شده است:
                        </Text>

                        {/* Order info summary */}
                        <Section style={orderInfoBox}>
                            <Text style={orderInfoText}><strong>شناسه سفارش:</strong> #{orderId}</Text>
                            <Text style={orderInfoText}><strong>تاریخ:</strong> {new Date().toLocaleDateString("fa-IR")}</Text>
                        </Section>

                        {/* Items Table */}
                        <Section style={{ margin: "20px 0" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                                        <th style={{ ...thStyle, textAlign: "right" as const }}>محصول</th>
                                        <th style={{ ...thStyle, textAlign: "center" as const }}>تعداد</th>
                                        <th style={{ ...thStyle, textAlign: "left" as const }}>قیمت</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                            <td style={{ ...tdStyle, textAlign: "right" as const, color: "#ffffff" }}>{item.title}</td>
                                            <td style={{ ...tdStyle, textAlign: "center" as const, color: "#d6d3d1" }}>{item.quantity}</td>
                                            <td style={{ ...tdStyle, textAlign: "left" as const, color: "#ba955c", fontFamily: "monospace" }}>
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Section>

                        {/* Summary Fees */}
                        <Section style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "15px" }}>
                            <div style={feeRow}>
                                <span style={feeLabel}>جمع جزء (Subtotal):</span>
                                <span style={feeVal}>${subtotal.toFixed(2)}</span>
                            </div>
                            <div style={feeRow}>
                                <span style={feeLabel}>هزینه ارسال (Shipping):</span>
                                <span style={feeVal}>${shippingCost.toFixed(2)}</span>
                            </div>
                            <div style={{ ...feeRow, marginTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "8px" }}>
                                <span style={{ ...feeLabel, fontWeight: "bold", color: "#ffffff" }}>جمع کل (Total Paid):</span>
                                <span style={{ ...feeVal, fontWeight: "bold", color: "#ba955c", fontSize: "18px" }}>${total.toFixed(2)}</span>
                            </div>
                        </Section>

                        {/* Shipping Info if available */}
                        {trackingNumber && (
                            <Section style={shippingBox}>
                                <Heading style={h2}>سفارش شما در راه است!</Heading>
                                <Text style={paragraph}>
                                    بسته شما توسط پست ارسال شد. برای رهگیری مرسوله از کد و دکمه زیر استفاده کنید:
                                </Text>
                                <Text style={trackingText}>کد رهگیری پست: {trackingNumber}</Text>
                                {trackingUrl && (
                                    <Section style={{ textAlign: "center" as const, marginTop: "15px" }}>
                                        <Button href={trackingUrl} style={button}>
                                            رهگیری مرسوله پستی
                                        </Button>
                                    </Section>
                                )}
                            </Section>
                        )}
                    </Section>

                    {/* Footer */}
                    <Section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px", marginTop: "40px", textAlign: "center" as const }}>
                        <Text style={footerText}>
                            فروشگاه محصولات فرهنگی کلیسای ایرانی واشنگتن دی‌سی<br />
                            support@iranianchurchdc.com
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
    maxWidth: "580px",
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

const h2 = {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#ba955c",
    margin: "0 0 10px 0",
};

const paragraph = {
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#e7e5e4",
    margin: "0 0 16px 0",
};

const orderInfoBox = {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
    padding: "12px 18px",
    margin: "15px 0",
};

const orderInfoText = {
    fontSize: "13px",
    color: "#d6d3d1",
    margin: "2px 0",
};

const thStyle = {
    padding: "10px",
    fontSize: "13px",
    color: "#a8a29e",
    fontWeight: "bold" as const,
};

const tdStyle = {
    padding: "12px 10px",
    fontSize: "14px",
};

const feeRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
};

const feeLabel = {
    fontSize: "13px",
    color: "#a8a29e",
};

const feeVal = {
    fontSize: "14px",
    color: "#ffffff",
    fontFamily: "monospace",
};

const shippingBox = {
    border: "1px solid rgba(186, 149, 92, 0.25)",
    backgroundColor: "rgba(186, 149, 92, 0.05)",
    borderRadius: "16px",
    padding: "20px",
    margin: "25px 0 0 0",
};

const trackingText = {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#ba955c",
    fontFamily: "monospace",
    margin: "0",
};

const button = {
    backgroundColor: "#ba955c",
    borderRadius: "10px",
    color: "#000000",
    fontSize: "13px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "10px 20px",
};

const footerText = {
    fontSize: "11px",
    color: "#57534e",
    lineHeight: "1.5",
};
