import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

/**
 * Reusable Feature Information Component
 * Displays detailed feature descriptions with collapsible sections
 * Updated: High contrast colors for better visibility
 */
const FeatureInfo = ({ title, description, steps, examples, tips, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl overflow-hidden border border-blue-200 dark:border-blue-700">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-900 dark:text-gray-300 font-medium">
              {description}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-700 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-700 dark:text-gray-400" />
        )}
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="px-6 pb-6 space-y-4">
          {/* Steps */}
          {steps && steps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-gray-200 mb-2 flex items-center gap-2">
                <span className="text-blue-600">📋</span> How to Use:
              </h4>
              <ol className="space-y-2">
                {steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm text-black dark:text-gray-200 pt-0.5 font-medium">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Examples */}
          {examples && examples.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-black dark:text-gray-200 mb-2 flex items-center gap-2">
                <span className="text-green-600">💡</span> Examples:
              </h4>
              <ul className="space-y-2">
                {examples.map((example, index) => (
                  <li key={index} className="text-sm text-black dark:text-gray-200 flex gap-2 font-medium">
                    <span className="text-green-600 font-bold">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {tips && tips.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Pro Tips:
              </h4>
              <ul className="space-y-1">
                {tips.map((tip, index) => (
                  <li key={index} className="text-xs text-blue-900 dark:text-yellow-300 flex gap-2 font-medium">
                    <span className="font-bold">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeatureInfo;

