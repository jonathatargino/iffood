type ApplyPatchBase<T> = {
  fieldName: string;
  value: T | undefined | null;
  validate?: (value: T) => void;
};

export function applyPatch<T>(
  params: ApplyPatchBase<T> & {
    allowNull: true;
    set: (value: T | null) => void;
  },
): void;

export function applyPatch<T>(
  params: ApplyPatchBase<T> & {
    allowNull?: false | undefined;
    set: (value: T) => void;
  },
): void;

export function applyPatch<T>(
  params: ApplyPatchBase<T> & {
    allowNull?: boolean;
    set: ((value: T) => void) | ((value: T | null) => void);
  },
): void {
  const { fieldName, value, allowNull = false, set, validate } = params;

  if (value === undefined) return;

  if (value === null) {
    if (!allowNull) {
      throw new Error(`Field ${fieldName} cannot be null`);
    }
    (set as (value: T | null) => void)(null);
    return;
  }

  validate?.(value);
  (set as (value: T) => void)(value);
}
