interface SectionHeaderProps {
  title: string;
  description: string;
  icon: string;
}

export function SectionHeader({ 
  title, 
  description, 
  icon
}: SectionHeaderProps) {
  return (
    <div className="border-b border-gray-200 pb-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0">
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

