'use client';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-lg bg-stone-100 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-stone-300" />
        </div>
      )}
      <p className="text-[15px] font-semibold text-stone-700 mb-1">{title}</p>
      {description && (
        <p className="text-sm text-stone-400 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
