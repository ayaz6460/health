import { motion } from 'framer-motion';

interface MotionDivProps {
  children: React.ReactNode;
  className?: string;
  initial?: any;
  animate?: any;
  transition?: any;
  whileHover?: any;
  whileTap?: any;
}

export default function MotionDiv({
  children,
  className = '',
  initial = { opacity: 0, y: 12 },
  animate = { opacity: 1, y: 0 },
  transition = { type: 'spring', stiffness: 260, damping: 20 },
  whileHover,
  whileTap,
  ...props
}: MotionDivProps) {
  return (
    <motion.div
      className={className}
      initial={initial}
      animate={animate}
      transition={transition}
      whileHover={whileHover}
      whileTap={whileTap}
      {...props}
    >
      {children}
    </motion.div>
  );
}