import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export function GrammarDemo({ active }: { active: boolean }) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-[300px] perspective-1000">
        <motion.div
          animate={active ? {
            rotateY: [0, 0, 180, 180],
          } : { rotateY: 0 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 1,
            ease: "easeInOut"
          }}
          className="relative w-full h-48 preserve-3d"
        >
          {/* Front: Structure */}
          <div className="absolute inset-0 backface-hidden bg-card rounded-2xl border shadow-sm p-6 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent mb-3">Structure</span>
            <div className="text-xl font-japanese font-bold">
              Dictionary form <span className="text-accent">+</span> のだ
            </div>
          </div>

          {/* Back: Meaning */}
          <div className="absolute inset-0 backface-hidden bg-card rounded-2xl border shadow-sm p-6 flex flex-col items-center justify-center text-center rotate-y-180">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Explanation</span>
            <p className="text-sm leading-relaxed">
              Used to provide an explanation, emphasize a reason, or add emotional weight.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full">
        <Lock className="h-3 w-3 text-accent" />
        <span className="text-[11px] font-bold text-accent uppercase tracking-wider">Premium explanations</span>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="mt-6 text-sm text-center font-medium text-muted-foreground"
      >
        Deep dive into grammar with AI-powered notes.
      </motion.p>
    </div>
  );
}
