import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { AnimatedTitle } from '@/components/AnimatedTitle';

export function BooksFanDemo({ active }: { active: boolean }) {
  const books = [
    { color: 'bg-[#2a3c4a]', title: 'Hana' },
    { color: 'bg-[#3b2a2a]', title: 'Merosu' },
    { color: 'bg-[#2a4a3c]', title: 'Sakura' },
  ];

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="relative w-32 h-44 mb-12">
        {books.map((book, i) => (
          <motion.div
            key={i}
            initial={{ rotate: 0, x: 0, opacity: 0 }}
            animate={active ? { 
              rotate: (i - 1) * 15, 
              x: (i - 1) * 40,
              opacity: 1,
              y: Math.abs(i - 1) * 10
            } : { rotate: 0, x: 0, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 260, 
              damping: 20, 
              delay: i * 0.1 
            }}
            className={`absolute inset-0 rounded-xl ${book.color} border-2 border-white/10 shadow-xl flex items-end p-3`}
          >
            <div className="text-[10px] font-serif font-bold text-white/40 uppercase tracking-widest">{book.title}</div>
          </motion.div>
        ))}
        <motion.div
          animate={active ? { y: [0, -5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute -top-6 -right-6 h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center text-accent"
        >
          <BookOpen className="h-6 w-6" />
        </motion.div>
      </div>
      
      <AnimatedTitle 
        text="Tsundoku"
        className="text-4xl font-serif font-black tracking-tight text-primary mb-2"
      />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground font-medium text-center max-w-[200px]"
      >
        Read real Japanese literature, level by level.
      </motion.p>
    </div>
  );
}
