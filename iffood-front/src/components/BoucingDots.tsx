export type BouncingDotsProps = {
  size?: number;
  colorClass?: string;
  speed?: number;
};

export function BouncingDots({
  size = 8,
  colorClass = "bg-[#FF7622]/70",
  speed = 0.6,
}: BouncingDotsProps) {
  const style = { width: size, height: size, animationDuration: `${speed}s` };

  return (
    <div className="flex items-end gap-1">
      <span
        style={style}
        className={`${colorClass} animate-bounce rounded-full [animation-delay:-0.2s]`}
      />
      <span
        style={style}
        className={`${colorClass} animate-bounce rounded-full [animation-delay:-0.1s]`}
      />
      <span
        style={style}
        className={`${colorClass} animate-bounce rounded-full`}
      />
    </div>
  );
}
