import { VerifiedGender } from '@randomcams/shared';

const OPTIONS: { value: VerifiedGender; label: string; emoji: string }[] = [
  { value: 'female', label: 'Women', emoji: '♀' },
  { value: 'male', label: 'Men', emoji: '♂' },
];

export function GenderFilterSelect({
  value,
  onChange,
}: {
  value: VerifiedGender[];
  onChange: (next: VerifiedGender[]) => void;
}) {
  function toggle(gender: VerifiedGender) {
    onChange(value.includes(gender) ? value.filter((g) => g !== gender) : [...value, gender]);
  }

  return (
    <div>
      <p className="label !mb-2">Show me</p>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => {
          const active = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                active
                  ? 'border-transparent bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white shadow-md shadow-brand-500/30'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500'
              }`}
            >
              <span className="text-base leading-none">{opt.emoji}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Filtering uses each user's verified gender from ID checks, not what they type into a profile.
      </p>
    </div>
  );
}
