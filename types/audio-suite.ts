export interface WordTimestamp {
    word: string;
    startTime: number;
    endTime: number;
}

export interface SlideContent {
    title: string;
    content: string[];
}

export interface TimedSlideContent extends SlideContent {
    startTime: number;
}
