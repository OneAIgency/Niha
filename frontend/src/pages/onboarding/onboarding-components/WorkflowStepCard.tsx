import { motion } from 'framer-motion';
import type { WorkflowStep } from './onboardingData';

interface WorkflowStepCardProps {
  step: WorkflowStep;
  isActive: boolean;
  onClick: () => void;
}

export function WorkflowStepCard({
  step,
  isActive,
  onClick,
}: WorkflowStepCardProps) {
  const Icon = step.icon;

  return (
    <motion.div
      className={`p-4 rounded-xl cursor-pointer transition-all ${
        isActive ? 'bg-teal-500 border-2 border-teal-300' : 'bg-navy-800 border-2 border-navy-700'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
            isActive ? 'bg-white/20 text-white' : 'bg-navy-700 text-teal-300'
          }`}
        >
          {step.step}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-white">
            {step.title}
          </div>
          <div className={`text-xs ${isActive ? 'text-white/70' : 'text-navy-600 dark:text-navy-400'}`}>
            {step.duration}
          </div>
        </div>
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-navy-200'}`} />
      </div>
    </motion.div>
  );
}
