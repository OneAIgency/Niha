import { MapPin, Globe, Link2, Building } from 'lucide-react';
import { hongKongPosition } from './strategicAdvantageData';

export function HongKongPositionSection() {
  return (
    <div className="space-y-8">
      {/* Geographic Benefits */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-500">
          <MapPin className="w-5 h-5" />
          {hongKongPosition.geographic.title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">24/7 Global Trading Access:</h5>
            <ul className="space-y-2">
              {hongKongPosition.geographic.tradingAccess.map((t, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-navy-600 dark:text-navy-400">
                  <Globe className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-emerald-500">
            <h5 className="font-semibold mb-2 text-white">Market Growth Trajectory:</h5>
            <p className="text-sm text-white opacity-90">
              {hongKongPosition.geographic.marketGrowth}
            </p>
          </div>
        </div>
      </div>

      {/* One Country Two Systems */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-violet-500">
          <Link2 className="w-5 h-5" />
          {hongKongPosition.oneCountryTwoSystems.title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-emerald-500">China-International Bridge Function:</h5>
            <ul className="space-y-2">
              {hongKongPosition.oneCountryTwoSystems.bridge.map((b, i) => (
                <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {b}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-navy-800">
            <h5 className="font-semibold mb-3 text-blue-500 dark:text-blue-400">Market Integration Infrastructure:</h5>
            <ul className="space-y-2">
              {hongKongPosition.oneCountryTwoSystems.integration.map((item, idx) => (
                <li key={idx} className="text-sm text-navy-600 dark:text-navy-400">• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Policy Support */}
      <div className="p-6 rounded-xl bg-navy-700">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-500 dark:text-blue-400">
          <Building className="w-5 h-5" />
          {hongKongPosition.policySupport.title}
        </h4>
        <div className="p-4 rounded-lg mb-4 bg-navy-800">
          <h5 className="font-semibold mb-3 text-emerald-500">Government-Led Initiatives:</h5>
          <ul className="space-y-2">
            {hongKongPosition.policySupport.government.map((g, i) => (
              <li key={i} className="text-sm text-navy-600 dark:text-navy-400">• {g}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-lg bg-emerald-500">
          <h5 className="font-semibold mb-2 text-white">Strategic Objectives:</h5>
          <p className="text-sm text-white opacity-90">
            {hongKongPosition.policySupport.objectives}
          </p>
        </div>
      </div>
    </div>
  );
}
