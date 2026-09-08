import { useState } from 'react';
import { AuthForm } from './AuthForm';
import { PillarsScreen } from './PillarsScreen';
import { SplashScreen } from './SplashScreen';
import styles from './OnboardingFlow.module.css';

type Step = 'splash' | 'pillars' | 'signUp' | 'signIn';

interface OnboardingFlowProps {
  /** The visitor chose to skip accounts entirely — the app proceeds in local-only mode. */
  onContinueLocally: () => void;
}

/**
 * Shown once per device to a signed-out visitor: a photo-hero splash, then
 * the "Welcome to TripCompanion" pillars screen, before either lands on the
 * (unchanged) sign-up/sign-in form. "I already have an account" on the
 * splash skips straight to sign-in — a returning user doesn't need the
 * pillars pitch again.
 */
export function OnboardingFlow({ onContinueLocally }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('splash');

  if (step === 'splash') {
    return <SplashScreen onGetStarted={() => setStep('pillars')} onSignIn={() => setStep('signIn')} />;
  }

  if (step === 'pillars') {
    return <PillarsScreen onBack={() => setStep('splash')} onGetStarted={() => setStep('signUp')} />;
  }

  return (
    <div className={styles.screen}>
      <AuthForm initialMode={step} onBack={() => setStep(step === 'signUp' ? 'pillars' : 'splash')} onContinueLocally={onContinueLocally} />
    </div>
  );
}
