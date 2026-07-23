import { VerifiedGender } from '@randomcams/shared';

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
      <p>Show me:</p>
      <label>
        <input type="checkbox" checked={value.includes('female')} onChange={() => toggle('female')} />
        Women
      </label>
      <br />
      <label>
        <input type="checkbox" checked={value.includes('male')} onChange={() => toggle('male')} />
        Men
      </label>
      <p style={{ fontSize: 12, color: '#666' }}>
        Filtering uses each user's verified gender from ID checks, not what they type into a profile.
      </p>
    </div>
  );
}
