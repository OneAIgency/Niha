import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { HolderCategory } from './onboardingData';

interface EntityCategoryDetailProps {
  category: HolderCategory;
  colorScheme: 'cea' | 'eua';
}

export function EntityCategoryDetail({
  category,
  colorScheme,
}: EntityCategoryDetailProps) {
  const Icon = category.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl p-8 mt-8 bg-navy-800 border border-navy-700"
    >
      <div className="flex items-center gap-4 pb-6 mb-6 border-b border-navy-700">
        <div
          className={`w-16 h-16 rounded-xl flex items-center justify-center ${
            colorScheme === 'cea'
              ? 'bg-gradient-to-br from-red-600 to-orange-500'
              : 'bg-gradient-to-br from-blue-500 to-violet-500'
          }`}
        >
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">
            {category.title}
          </h3>
          <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold mt-2 bg-teal-500 text-white">
            {category.tag}
          </span>
        </div>
        <div className="ml-auto text-right">
          <div className="text-4xl font-extrabold text-emerald-500">
            {category.advantage}
          </div>
          <div className="text-sm text-navy-200">
            {category.advantageLabel}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-4 text-white">
          Sub-Categories
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          {category.subCategories.map((sub, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-navy-700"
            >
              <div className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 mt-0.5 text-teal-300" />
                <div>
                  <div className="font-semibold text-white">
                    {sub.name}
                  </div>
                  <div className="text-sm mt-1 text-navy-200">
                    {sub.details}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500 dark:border-emerald-400">
        <h5 className="font-semibold mb-3 text-emerald-500">
          Key Advantages via Nihao Platform
        </h5>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-300">8-15%</div>
            <div className="text-xs text-navy-200">Price Premium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">High</div>
            <div className="text-xs text-navy-200">Confidentiality</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">Medium</div>
            <div className="text-xs text-navy-200">Regulatory</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">High</div>
            <div className="text-xs text-navy-200">Structuring</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
