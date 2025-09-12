import React, { useState, useEffect } from 'react';
import { RefreshCw, Shield } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface MathCaptchaProps {
  onVerify: (isValid: boolean, token: string) => void;
  className?: string;
  required?: boolean;
}

interface CaptchaChallenge {
  question: string;
  questionFa: string;
  answer: number;
  token: string;
}

const MathCaptcha: React.FC<MathCaptchaProps> = ({ onVerify, className = '', required = true }) => {
  const { t, lang } = useLanguage();
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Generate a new math challenge
  const generateChallenge = (): CaptchaChallenge => {
    const operations = ['+', '-'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1: number, num2: number, answer: number;
    let questionEn: string, questionFa: string;

    if (operation === '+') {
      num1 = Math.floor(Math.random() * 10) + 1; // 1-10
      num2 = Math.floor(Math.random() * 10) + 1; // 1-10
      answer = num1 + num2;
      questionEn = `What is ${num1} + ${num2}?`;
      questionFa = `${num1} + ${num2} چند است؟`;
    } else {
      // For subtraction, ensure positive result
      num1 = Math.floor(Math.random() * 10) + 5; // 5-14
      num2 = Math.floor(Math.random() * num1) + 1; // 1 to num1
      answer = num1 - num2;
      questionEn = `What is ${num1} - ${num2}?`;
      questionFa = `${num1} - ${num2} چند است؟`;
    }

    // Generate a simple token for server-side verification
    const token = btoa(`${num1}${operation}${num2}=${answer}:${Date.now()}`);

    return {
      question: questionEn,
      questionFa: questionFa,
      answer,
      token
    };
  };

  // Initialize challenge on component mount
  useEffect(() => {
    const newChallenge = generateChallenge();
    setChallenge(newChallenge);
  }, []);

  // Handle refresh challenge
  const refreshChallenge = () => {
    const newChallenge = generateChallenge();
    setChallenge(newChallenge);
    setUserAnswer('');
    setIsVerified(false);
    setError('');
    onVerify(false, '');
  };

  // Handle answer input
  const handleAnswerChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setUserAnswer(numericValue);
    setError('');
  };

  // Verify the answer
  const verifyAnswer = () => {
    if (!challenge) return;

    const userNum = parseInt(userAnswer);
    if (isNaN(userNum)) {
      setError(t('captchaEnterNumber') || 'Please enter a number');
      return;
    }

    if (userNum === challenge.answer) {
      setIsVerified(true);
      setError('');
      onVerify(true, challenge.token);
    } else {
      setAttempts(prev => prev + 1);
      setError(t('captchaWrongAnswer') || 'Incorrect answer. Please try again.');
      
      // Generate new challenge after 2 failed attempts
      if (attempts >= 1) {
        refreshChallenge();
        setAttempts(0);
      }
      
      onVerify(false, '');
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyAnswer();
    }
  };

  if (!challenge) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="h-20 bg-gray-300 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-dimWhite">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4" />
          {t('securityVerification') || 'Security Verification'}
          {required && <span className="text-red-400">*</span>}
        </div>
      </label>
      
      <div className="bg-primary p-4 rounded-lg border border-white/20">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-medium">
            {lang === 'fa' ? challenge.questionFa : challenge.question}
          </div>
          <button
            type="button"
            onClick={refreshChallenge}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label={t('refreshCaptcha') || 'Refresh challenge'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('captchaAnswerPlaceholder') || 'Your answer...'}
            className="flex-1 px-3 py-2 bg-black/30 border border-white/30 rounded-md text-white placeholder:text-gray-400 focus:border-secondary focus:outline-none"
            dir="ltr"
            disabled={isVerified}
          />
          <button
            type="button"
            onClick={verifyAnswer}
            disabled={!userAnswer.trim() || isVerified}
            className="px-4 py-2 bg-blue-gradient text-primary font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isVerified ? (t('verified') || 'Verified') : (t('verify') || 'Verify')}
          </button>
        </div>
        
        {error && (
          <div className="mt-2 text-red-400 text-xs">
            {error}
          </div>
        )}
        
        {isVerified && (
          <div className="mt-2 text-green-400 text-xs flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {t('captchaVerified') || 'Security verification completed'}
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-400">
        {t('captchaHelp') || 'This helps us prevent spam and automated registrations.'}
      </div>
    </div>
  );
};

export default MathCaptcha;