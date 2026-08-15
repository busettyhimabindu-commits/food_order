import { Variants } from 'framer-motion';

//Standardized easing and spring settings for fast, snappy interactions (150ms-300ms)
export const transitionFast = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1.0],
};

export const transitionMedium = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1.0],
};

export const springSnappy = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

// Staggered Container for Grids and Lists
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

// Staggered Fade Up for Hero and Section Headers
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    }
  },
};

// Card Hover & Entry Variants
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    }
  },
};

// Modal Backdrop and Content Scale-in
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      mass: 0.8,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 4,
    transition: { duration: 0.15 },
  },
};

// Toast Variants
export const toastVariants: Variants = {
  hidden: { opacity: 0, x: 40, scale: 0.95 },
  visible: {
    opacity: 1, x: 0, scale: 1, transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      mass: 0.8,
    }
  },
  exit: { opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.15 } },
};

// Page Transition Variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease: 'easeIn' } },
};
