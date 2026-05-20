"use client";

import { useEffect, useRef } from "react";
import { logout } from "@/actions/auth";

interface AutoLogoutProps {
    timeoutMinutes?: number;
}

export function AutoLogout({ timeoutMinutes = 60 }: AutoLogoutProps) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        // Set timer for X minutes
        timerRef.current = setTimeout(async () => {
            console.log("[AutoLogout] Inactivity timeout reached. Logging out...");
            try {
                await logout();
            } catch (err) {
                console.error("Auto logout failed", err);
            }
        }, timeoutMinutes * 60 * 1000);
    };

    useEffect(() => {
        // Initial setup
        resetTimer();

        // Events that indicate user activity
        const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        
        const handleActivity = () => {
            resetTimer();
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [timeoutMinutes]);

    return null; // This component is invisible
}
