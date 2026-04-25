import { motion } from 'framer-motion';

export default function AppleSpinner({ size = 20, color = '#86868b' }: { size?: number; color?: string }) {
  return (
    <motion.div
      className="apple-spinner"
      style={{
        width: size,
        height: size,
        position: 'relative',
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, transparent 0deg, ${color} 180deg, transparent 360deg)`,
          opacity: 0.15,
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        }}
        animate={{ scale: [0.8, 1.2, 0.8] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}