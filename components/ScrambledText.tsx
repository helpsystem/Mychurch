
import React, { useState, useEffect, useRef } from 'react';

interface ScrambledTextProps {
  text: string;
}

const ScrambledText: React.FC<ScrambledTextProps> = ({ text }) => {
  const ref = useRef<HTMLDivElement>(null);
  const glitches = '-|/\\';

  useEffect(() => {
    let animationFrameId: number;
    let charIndex = 0;
    const textCharacters = text.split('');
    const textLength = textCharacters.length;
    let output: string[] = Array(textLength).fill('');
    const order = Array.from({ length: textLength }, (_, i) => i).sort(() => Math.random() - 0.5);

    const updateText = () => {
      if (charIndex < textLength) {
        const progress = Math.floor(charIndex);
        for (let i = 0; i <= progress; i++) {
            const index = order[i];
            output[index] = textCharacters[index];
        }

        for (let i = progress + 1; i < textLength; i++) {
            const index = order[i];
            if (Math.random() < 0.2) {
                const glitchIndex = Math.floor(Math.random() * glitches.length);
                output[index] = `<span class="char glitch">${glitches[glitchIndex]}</span>`;
            } else {
                 output[index] = `<span class="char ghost"></span>`;
            }
        }

        if (ref.current) {
            ref.current.innerHTML = output.join('');
        }
        charIndex += 0.5; // Controls animation speed
        animationFrameId = requestAnimationFrame(updateText);
      } else {
        if (ref.current) {
            ref.current.innerHTML = text;
        }
      }
    };

    const timer = setTimeout(() => {
        animationFrameId = requestAnimationFrame(updateText);
    }, 100);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer);
    };
  }, [text, glitches]);

  return <div ref={ref} className="scramble-text" aria-label={text} />;
};

export default ScrambledText;
