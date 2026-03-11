"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { saveDocument } from "@/lib/store";

export default function CreatePayment() {
  const { t } = useLanguage();
  const router = useRouter();

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [payer, setPayer] = useState("");
  const [payee, setPayee] = useState("DEJ TV");
  const [amount, setAmount] = useState<number | "">("");
  const [amountInWords, setAmountInWords] = useState("");
  const [paymentFor, setPaymentFor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNo, setReferenceNo] = useState("");

  const handleSave = () => {
    if (!payer.trim() || !payee.trim() || amount === "") {
      alert(t("alert_name"));
      return;
    }

    const doc = {
      id: uuidv4(),
      type: "payment" as const,
      title: `Payment from ${payer}`,
      date,
      payer,
      payee,
      amount: Number(amount),
      amountInWords,
      paymentFor,
      paymentMethod,
      referenceNo,
      createdAt: Date.now(),
    };

    saveDocument(doc);
    router.push("/");
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/create">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-slate-600">
            <ArrowLeft className="ltr:mr-2 rtl:ml-2 rtl:rotate-180 h-4 w-4" />
            {t("back_to_dashboard")}
          </Button>
        </Link>
        <LanguageSwitcher />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("payment_details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t("date")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNo">{t("reference_no")}</Label>
              <Input
                id="referenceNo"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payer">{t("payer")}</Label>
              <Input
                id="payer"
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payee">{t("payee")}</Label>
              <Input
                id="payee"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("amount")}</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || "")}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">{t("payment_method")}</Label>
              <Input
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="Cash, Transfer, Crypto..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountInWords">{t("amount_in_words")}</Label>
            <Input
              id="amountInWords"
              value={amountInWords}
              onChange={(e) => setAmountInWords(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentFor">{t("payment_for")}</Label>
            <Textarea
              id="paymentFor"
              value={paymentFor}
              onChange={(e) => setPaymentFor(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t p-6 bg-slate-50 rounded-b-xl">
          <Button onClick={handleSave} size="lg" className="w-full sm:w-auto">
            <Save className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t("save_invoice")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
