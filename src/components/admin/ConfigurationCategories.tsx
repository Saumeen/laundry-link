'use client';

interface ConfigurationCategoriesProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function ConfigurationCategories({
  categories,
  selectedCategory,
  onCategoryChange,
}: ConfigurationCategoriesProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Filter by category:</span>
        
        {/* All Categories Button */}
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>

        {/* Category Buttons */}
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              selectedCategory === category
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {formatCategoryName(category)}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
} 