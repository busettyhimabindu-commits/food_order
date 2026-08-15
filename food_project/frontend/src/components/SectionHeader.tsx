import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  seeAllLink?: string;
  seeAllText?: string;
  badge?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  subtitle,
  seeAllLink,
  seeAllText = "See all",
  badge
}) => {
  return (
    <div className="flex items-end justify-between gap-4 pb-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#FF5722] flex items-center">{icon}</span>}
          {badge && (
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/20 font-display">
              {badge}
            </span>
          )}
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#141414] tracking-tight">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-normal">
            {subtitle}
          </p>
        )}
      </div>

      {seeAllLink && (
        <Link
          to={seeAllLink}
          className="group flex items-center gap-1.5 text-xs font-bold font-display text-[#FF5722] hover:text-[#E64A19] transition-colors shrink-0 pb-0.5"
        >
          <span>{seeAllText}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-150" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
