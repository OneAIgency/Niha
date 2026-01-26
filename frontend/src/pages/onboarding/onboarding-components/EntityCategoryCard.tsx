import { motion } from 'framer-motion';
import type { HolderCategory } from './onboardingData';

interface EntityCategoryCardProps {
  category: HolderCategory;
  isActive: boolean;
  onClick: () => void;
  colorScheme: 'cea' | 'eua';
}

export function EntityCategoryCard({
  category,
  isActive,
  onClick,
  colorScheme,
}: EntityCategoryCardProps) {
  const Icon = category.icon;
  return (
    <motion.div
      className={`p-6 rounded-2xl cursor-pointer transition-all ${
        isActive
          ? 'bg-gradient-to-br from-teal-500/15 to-transparent border-2 border-teal-500 opacity-100'
          : 'bg-navy-800 border-2 border-navy-700 opacity-60'
      }`}
      onClick={onClick}
      whileHover={{ y: -4, opacity: 1 }}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
          colorScheme === 'cea'
            ? 'bg-gradient-to-br from-red-600 to-orange-500'
            : 'bg-gradient-to-br from-blue-500 to-violet-500'
        }`}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h4 className="font-bold text-lg mb-2 text-white">{category.title}</h4>
      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-teal-500/30 text-teal-300">
        {category.tag}
      </span>
      <p className="text-sm mb-4 text-navy-200">
        {category.description}
      </p>
      <div className="text-center p-3 rounded-lg bg-white/5">
        <div className="text-2xl font-bold text-emerald-500">
          {category.advantage}
        </div>
        <div className="text-xs text-navy-400">
          {category.advantageLabel}
        </div>
      </div>
    </motion.div>
  );
}
