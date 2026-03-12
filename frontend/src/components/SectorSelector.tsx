import { Sector } from '../types';
import { Briefcase, DollarSign, Heart, Cpu, Leaf, Plus } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  'dollar-sign': DollarSign,
  heart: Heart,
  cpu: Cpu,
  leaf: Leaf,
  plus: Plus,
};

interface SectorSelectorProps {
  sectors: Sector[];
  selected: string;
  onSelect: (id: string) => void;
  customTopic: string;
  onCustomTopicChange: (topic: string) => void;
}

export default function SectorSelector({
  sectors,
  selected,
  onSelect,
  customTopic,
  onCustomTopicChange,
}: SectorSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider">
        Select Sector
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {sectors.map((sector) => {
          const Icon = iconMap[sector.icon] || Briefcase;
          const isSelected = selected === sector.id;
          return (
            <button
              key={sector.id}
              onClick={() => onSelect(sector.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
                isSelected
                  ? 'border-primary-500 bg-primary-600/10 text-primary-400'
                  : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-500 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium leading-tight">{sector.name}</span>
            </button>
          );
        })}
      </div>
      {selected === 'custom' && (
        <input
          type="text"
          value={customTopic}
          onChange={(e) => onCustomTopicChange(e.target.value)}
          placeholder="Enter any industry or topic..."
          className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 text-sm"
        />
      )}
    </div>
  );
}
