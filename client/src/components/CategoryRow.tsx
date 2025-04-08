import React from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface CategoryRowProps {
  categories: string[];
  title?: string;
  showFilter?: boolean;
  selectedCategory?: string;
  onCategoryClick?: (category: string) => void;
  onFilterClick?: () => void;
}

export function CategoryRow({
  categories,
  title,
  showFilter = true,
  selectedCategory,
  onCategoryClick,
  onFilterClick,
}: CategoryRowProps) {
  return (
    <div className="mb-6">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* Scrollable categories container */}
        <div className="flex-1 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={
                  selectedCategory 
                    ? category === selectedCategory ? "secondary" : "outline"
                    : index === 0 ? "secondary" : "outline"
                }
                className="whitespace-nowrap"
                onClick={() => onCategoryClick?.(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Filter button always right-aligned with a keyline */}
        {showFilter && (
          <div className="ml-2 flex-shrink-0 border-l border-neutral-200 flex items-center p-0">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 ml-3 h-9"
              onClick={onFilterClick}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}