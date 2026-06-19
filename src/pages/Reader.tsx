import { useParams } from 'react-router-dom';
import { useDelayedNav } from '@/hooks/use-delayed-nav';
import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback, forwardRef, Fragment, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { books, difficultyConfig, type Difficulty, getChapterContent, chapterKey, DEFAULT_CHAPTER_ID, hasParts, parsePartId, partChapterId } from '@/data/books';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { HeaderChip } from '@/components/HeaderChip';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
// ... rest of the component ...
