import { motion } from 'framer-motion';
import Image from 'next/image';

export const Greeting = () => {
  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto px-8 flex flex-col justify-center items-center text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <Image
          src="/images/kleo.svg"
          alt="Kleo"
          width={107}
          height={32}
          className="h-8 w-auto"
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.4 }}
        className="text-4xl md:text-5xl font-medium text-gray-900 mb-2"
      >
        Post engaging content
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-xl text-gray-600 flex items-center gap-2 flex-wrap justify-center mb-8"
      >
        <span>Create the best content for</span>
        <span className="inline-flex items-center gap-1 relative top-px bg-blue-100 px-1.5 py-1 rounded font-medium">
          <Image
            src="/images/LI-In-Bug.png"
            alt="LinkedIn"
            width={20}
            height={20}
            className="inline-block"
          />
          LinkedIn
        </span>
        <span>in minutes by chatting with AI</span>
      </motion.div>
    </div>
  );
};
