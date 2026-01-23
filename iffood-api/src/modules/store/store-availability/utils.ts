export const hhmmTransformer = {
  to: (value?: string) => (value ? `${value}:00` : value),
  from: (value?: string) => (value ? value.slice(0, 5) : value),
};
