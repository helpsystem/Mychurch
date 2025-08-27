import { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'jquery-easing';

const useScramble = (text: string, options: any = {}) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current || !text) return;

    const element = ref.current;
    // Set initial text to prevent flash of old content, then clear for animation
    element.textContent = text;
    setTimeout(() => {
        if (element) element.innerHTML = '';
    }, 20);


    const defaults = {
      probability: 0.2,
      glitches: '-|/\\',
      blank: '',
      duration: text.length * 40,
      ease: 'easeInOutQuad',
      delay: 0.0,
    };

    const settings = { ...defaults, ...options };
    
    const shuffle = () => (Math.random() < 0.5 ? 1 : -1);
    const wrap = (txt: string, classes: string) => `<span class="${classes}">${txt}</span>`;

    const glitchText = settings.glitches;
    const glitchCharacters = glitchText.split('');
    const glitchLength = glitchCharacters.length;
    const glitchProbability = settings.probability;
    const glitches = glitchCharacters.map(letter => wrap(letter, 'glitch'));

    const ghostText = element.textContent || '';
    const ghostCharacters = ghostText.split('');
    const ghosts = ghostCharacters.map(letter => wrap(letter, 'ghost'));

    const textCharacters = text.split('');
    const textLength = textCharacters.length;

    const order = [...Array(textLength).keys()].sort(shuffle);
    const output: string[] = [];

    for (let i = 0; i < textLength; i++) {
      const glitchIndex = Math.floor(Math.random() * glitchLength);
      const glitchCharacter = glitches[glitchIndex];
      const ghostCharacter = ghosts[i] || settings.blank;
      const addGlitch = Math.random() < glitchProbability;
      const character = addGlitch ? glitchCharacter : ghostCharacter;
      output.push(character);
    }
    
    const object = { value: 0 };
    const target = { value: 1 };
    
    const parameters = {
      duration: settings.duration,
      ease: settings.ease,
      step: () => {
        if (!element) return;
        const progress = Math.floor(object.value * textLength);
        for (let i = 0; i < progress; i++) {
          const index = order[i];
          if(textCharacters[index]) {
             output[index] = textCharacters[index];
          }
        }
        element.innerHTML = output.join('');
      },
      complete: () => {
        if (element) {
            element.innerHTML = text;
        }
      },
    };
    
    const animation = $(object).delay(settings.delay).animate(target, parameters);

    return () => {
        animation.stop();
    }

  }, [text, options]);

  return ref;
};

export default useScramble;
