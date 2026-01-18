export function applyPatch<T>(params: {
  fieldName: string;
  value: T | undefined | null;
  allowNull?: boolean;
  set: (value: T | null) => void;
  validate?: (value: T) => void;
}) {
  const { fieldName, value, allowNull = false, set, validate } = params;

  if (value === undefined) return;

  if (value === null) {
    if (!allowNull) {
      throw new Error(`Field ${fieldName} cannot be null`);
    }
    set(null);
    return;
  }

  if (validate) validate(value);

  set(value);
}
