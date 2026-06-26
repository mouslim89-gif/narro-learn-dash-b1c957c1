import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  hasCompletedCarousel: boolean;
  hasSeenReaderTutorial: boolean;
  alwaysReplayOnboarding: boolean;
  disableAnimation: boolean;
  completeCarousel: () => void;
  completeReaderTutorial: () => void;
  setAlwaysReplayOnboarding: (replay: boolean) => void;
  setDisableAnimation: (disable: boolean) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedCarousel: false,
      hasSeenReaderTutorial: false,
      alwaysReplayOnboarding: false,
      disableAnimation: false,
      completeCarousel: () => set((state) => ({ 
        hasCompletedCarousel: state.alwaysReplayOnboarding ? false : true 
      })),
      completeReaderTutorial: () => set((state) => ({ 
        hasSeenReaderTutorial: state.alwaysReplayOnboarding ? false : true 
      })),
      setAlwaysReplayOnboarding: (alwaysReplayOnboarding) => set({ alwaysReplayOnboarding }),
      setDisableAnimation: (disableAnimation) => set({ disableAnimation }),
      resetOnboarding: () => set({ hasCompletedCarousel: false, hasSeenReaderTutorial: false }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
