import { useState } from 'react';
import { AuthForm } from './AuthForm';
import { WelcomeScreen } from './WelcomeScreen';
import styles from './OnboardingFlow.module.css';

type Step = 'welcome' | 'signUp' | 'signIn';

interface OnboardingFlowProps {
  /** The visitor chose to skip accounts entirely — the app proceeds in local-only mode. */
  onContinueLocally: () => void;
}

/** Shown once per device to a signed-out visitor, before either the Welcome screen or auth forms have anywhere else to send them. */
export function OnboardingFlow({ onContinueLocally }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('welcome');

  if (step === 'welcome') {
    return <WelcomeScreen onGetStarted={() => setStep('signUp')} onSignIn={() => setStep('signIn')} />;
  }

  return (
    <div className={styles.screen}>
      <AuthForm initialMode={step} onBack={() => setStep('welcome')} onContinueLocally={onContinueLocally} />
    </div>
  );
}
