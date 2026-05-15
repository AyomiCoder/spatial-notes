import { motion } from 'motion/react'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

export default function DevSignature() {
  return (
    <motion.a
      href="https://x.com/ayomicoder"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Made by Ayomide Aluko — open X profile"
      initial={{ opacity: 0, y: 18, rotate: -3.5 }}
      animate={{ opacity: 1, y: 0, rotate: -3.5 }}
      whileHover={{ y: -3, rotate: 0, scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{
        type: 'spring',
        stiffness: 360,
        damping: 26,
        delay: 1.1,
      }}
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-1.5 select-none"
      style={{
        // A real little Post-it: tinted bg, soft drop shadow, micro tape strip
        background: 'var(--color-note-blush)',
        color: 'var(--color-ink-900)',
        padding: '7px 11px 7px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        letterSpacing: '-0.005em',
        fontFamily: 'var(--font-sans)',
        boxShadow:
          '0 1px 2px rgba(0,0,0,0.05), ' +
          '0 6px 14px -4px rgba(0,0,0,0.10), ' +
          '0 12px 28px -10px rgba(255,109,150,0.32), ' +
          'inset 0 1px 0 rgba(255,255,255,0.5)',
        transformOrigin: '90% 100%',
        textDecoration: 'none',
      }}
    >
      {/* Tape strip on top edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1 left-1/2 h-2 w-7 -translate-x-1/2 rotate-[-3deg] rounded-[1px]"
        style={{
          background: 'rgba(255,255,255,0.6)',
          boxShadow: '0 0.5px 1px rgba(0,0,0,0.06), inset 0 0.5px 0 rgba(255,255,255,0.8)',
          backdropFilter: 'blur(6px)',
        }}
      />

      <span className="opacity-65 italic" style={{ fontSynthesis: 'style' }}>by</span>
      <span className="font-semibold tracking-[-0.012em]">Ayomide Aluko</span>
      <motion.svg
        width="10"
        height="10"
        viewBox="0 0 12 12"
        fill="none"
        initial={false}
        animate={{ x: 0, y: 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="ml-0.5 opacity-55 transition-[opacity,transform] duration-200 group-hover:opacity-90 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]"
      >
        <path
          d="M4 3h5v5M9 3L3.5 8.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.a>
  )
}
