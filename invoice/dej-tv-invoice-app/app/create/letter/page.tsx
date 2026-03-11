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

export default function CreateLetter() {
  const { t } = useLanguage();
  const router = useRouter();

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderTitle, setSenderTitle] = useState("");

  const handleSave = () => {
    if (!subject.trim()) {
      alert(t("alert_name"));
      return;
    }

    const doc = {
      id: uuidv4(),
      type: "letter" as const,
      title: subject,
      date,
      recipient,
      subject,
      body,
      senderName,
      senderTitle,
      createdAt: Date.now(),
    };

    saveDocument(doc);
    router.push("/");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
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
          <CardTitle>{t("letter_details")}</CardTitle>
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
              <Label htmlFor="recipient">{t("recipient")}</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">{t("subject")}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">{t("body")}</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[300px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="senderName">{t("sender_name")}</Label>
              <Input
                id="senderName"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderTitle">{t("sender_title")}</Label>
              <Input
                id="senderTitle"
                value={senderTitle}
                onChange={(e) => setSenderTitle(e.target.value)}
              />
            </div>
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
