import { useState } from 'react';
import { AuthForm } from './AuthForm';
import { SplashScreen } from './SplashScreen';
import styles from './OnboardingFlow.module.css';

type Step = 'splash' | 'signUp' | 'signIn';

interface OnboardingFlowProps {
  /** The visitor chose to skip accounts entirely — the app proceeds in local-only mode. */
  onContinueLocally: () => void;
}

/**
 * Shown once per device to a signed-out visitor: a single plain welcome
 * pitch, then the (unchanged) sign-up/sign-in form. "Sign in" on the
 * welcome screen skips straight to sign-in for a returning user.
 */
export function OnboardingFlow({ onContinueLocally }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('splash');

  if (step === 'splash') {
    return <SplashScreen onGetStarted={() => setStep('signUp')} onSignIn={() => setStep('signIn')} />;
  }

  return (
    <div className={styles.screen}>
      <AuthForm initialMode={step} onBack={() => setStep('splash')} onContinueLocally={onContinueLocally} />
    </div>
  );
}
