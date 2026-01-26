import { motion } from 'framer-motion';
import { Clock, CheckCircle, Zap } from 'lucide-react';
import type { WorkflowStep } from './onboardingData';

interface WorkflowStepDetailProps {
  step: WorkflowStep;
}

export function WorkflowStepDetail({ step }: WorkflowStepDetailProps) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="rounded-2xl p-8 bg-navy-800 border border-navy-700"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-blue-700">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-teal-500 text-white">
              Step {step.step}
            </span>
            <span className="flex items-center gap-1 text-sm text-amber-500">
              <Clock className="w-4 h-4" />
              {step.duration}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {step.title}
          </h3>
        </div>
      </div>

      <p className="text-lg mb-6 text-navy-200">
        {step.description}
      </p>

      <div className="mb-6">
        <h4 className="font-semibold mb-4 text-white">
          Process Details
        </h4>
        <div className="space-y-3">
          {step.details.map((detail, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
              <span className="text-navy-200">{detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-xl border border-teal-500 bg-gradient-to-br from-teal-500/15 to-blue-700/15">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-teal-300" />
          <span className="font-semibold text-teal-300">Outcome</span>
        </div>
        <p className="text-white">{step.outcome}</p>
      </div>
    </motion.div>
  );
}
