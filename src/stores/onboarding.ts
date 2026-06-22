import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  hasCompletedCarousel: boolean;
  hasSeenReaderTutorial: boolean;
  completeCarousel: () => void;
  completeReaderTutorial: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedCarousel: false,
      hasSeenReaderTutorial: false,
      completeCarousel: () => set({ hasCompletedCarousel: true }),
      completeReaderTutorial: () => set({ hasSeenReaderTutorial: true }),
      resetOnboarding: () => set({ hasCompletedCarousel: false, hasSeenReaderTutorial: false }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
