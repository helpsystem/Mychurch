import type { Variants } from "framer-motion";

export type SlideTransitionName =
    | "fade"
    | "slideLeft"
    | "slideRight"
    | "slideUp"
    | "slideDown"
    | "zoomIn"
    | "zoomOut"
    | "blurFade";

export const SLIDE_TRANSITION_NAMES: SlideTransitionName[] = [
    "fade",
    "slideLeft",
    "slideRight",
    "slideUp",
    "slideDown",
    "zoomIn",
    "zoomOut",
    "blurFade",
];

export const DEFAULT_SLIDE_TRANSITION: SlideTransitionName = "fade";

/** Picks a random transition, optionally avoiding an immediate repeat of the previous one. */
export function pickRandomSlideTransition(exclude?: SlideTransitionName): SlideTransitionName {
    const pool = exclude
        ? SLIDE_TRANSITION_NAMES.filter((n) => n !== exclude)
        : SLIDE_TRANSITION_NAMES;
    return pool[Math.floor(Math.random() * pool.length)];
}

const ENTER_MS = 0.55;
const EXIT_MS = 0.4;

export const SLIDE_TRANSITION_VARIANTS: Record<SlideTransitionName, Variants> = {
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: ENTER_MS, ease: "easeInOut" } },
        exit: { opacity: 0, transition: { duration: EXIT_MS, ease: "easeInOut" } },
    },
    slideLeft: {
        initial: { opacity: 0, x: "8%" },
        animate: { opacity: 1, x: 0, transition: { duration: ENTER_MS, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, x: "-8%", transition: { duration: EXIT_MS, ease: "easeInOut" } },
    },
    slideRight: {
        initial: { opacity: 0, x: "-8%" },
        animate: { opacity: 1, x: 0, transition: { duration: ENTER_MS, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, x: "8%", transition: { duration: EXIT_MS, ease: "easeInOut" } },
    },
    slideUp: {
        initial: { opacity: 0, y: "8%" },
        animate: { opacity: 1, y: 0, transition: { duration: ENTER_MS, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, y: "-8%", transition: { duration: EXIT_MS, ease: "easeInOut" } },
    },
    slideDown: {
        initial: { opacity: 0, y: "-8%" },
        animate: { opacity: 1, y: 0, transition: { duration: ENTER_MS, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, y: "8%", transition: { duration: EXIT_MS, ease: "easeInOut" } },
    },
    zoomIn: {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1, transition: { duration: ENTER_MS, ease: "easeOut" } },
        exit: { opacity: 0, scale: 1.06, transition: { duration: EXIT_MS, ease: "easeIn" } },
    },
    zoomOut: {
        initial: { opacity: 0, scale: 1.08 },
        animate: { opacity: 1, scale: 1, transition: { duration: ENTER_MS, ease: "easeOut" } },
        exit: { opacity: 0, scale: 0.94, transition: { duration: EXIT_MS, ease: "easeIn" } },
    },
    blurFade: {
        initial: { opacity: 0, filter: "blur(16px)" },
        animate: { opacity: 1, filter: "blur(0px)", transition: { duration: ENTER_MS, ease: "easeInOut" } },
        exit: { opacity: 0, filter: "blur(16px)", transition: { duration: EXIT_MS, ease: "easeInOut" } },
    },
};
