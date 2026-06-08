"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function OtpInput({
    length = 6,
    value,
    onChange,
    disabled = false
}: OtpInputProps) {
    const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
    const inputRefs = useRef<HTMLInputElement[]>([]);

    // Keep state in sync with external value prop
    useEffect(() => {
        const valueDigits = value.split("").slice(0, length);
        const newDigits = Array(length).fill("");
        valueDigits.forEach((char, idx) => {
            newDigits[idx] = char;
        });
        setDigits(newDigits);
    }, [value, length]);

    const focusInput = (index: number) => {
        const nextInput = inputRefs.current[index];
        if (nextInput) {
            nextInput.focus();
            nextInput.select();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const char = e.target.value.replace(/[^0-9]/g, "").slice(-1);
        const newDigits = [...digits];
        newDigits[index] = char;
        setDigits(newDigits);

        const newValue = newDigits.join("");
        onChange(newValue);

        // Auto-advance if a digit was entered
        if (char && index < length - 1) {
            focusInput(index + 1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            const newDigits = [...digits];
            
            if (!digits[index] && index > 0) {
                // If current input is empty, clear the previous input and move focus back
                newDigits[index - 1] = "";
                setDigits(newDigits);
                onChange(newDigits.join(""));
                focusInput(index - 1);
            } else {
                // Clear current input
                newDigits[index] = "";
                setDigits(newDigits);
                onChange(newDigits.join(""));
            }
            e.preventDefault();
        } else if (e.key === "ArrowLeft") {
            if (index > 0) focusInput(index - 1);
            e.preventDefault();
        } else if (e.key === "ArrowRight") {
            if (index < length - 1) focusInput(index + 1);
            e.preventDefault();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length);
        if (!text) return;

        const newDigits = Array(length).fill("");
        text.split("").forEach((char, idx) => {
            newDigits[idx] = char;
        });
        setDigits(newDigits);

        const newValue = newDigits.join("");
        onChange(newValue);

        // Focus the last filled input or the first empty one
        const nextFocusIndex = Math.min(text.length, length - 1);
        focusInput(nextFocusIndex);
    };

    return (
        <div className="flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        if (el) inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digits[index] || ""}
                    disabled={disabled}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className={cn(
                        "w-10 h-12 sm:w-12 sm:h-14 bg-black/40 border text-center text-xl sm:text-2xl font-bold font-mono rounded-xl outline-none transition-all duration-200 select-all",
                        digits[index]
                            ? "border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.2)] text-amber-400"
                            : "border-white/10 hover:border-white/20 focus:border-amber-500/50 text-white/90"
                    )}
                />
            ))}
        </div>
    );
}
