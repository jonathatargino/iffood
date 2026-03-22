type PhotoUploadButtonProps = {
  onClick: () => void;
};

export function PhotoUploadButton({ onClick }: PhotoUploadButtonProps) {
  return (
    <button
      onClick={onClick}
      className="size-11 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:shadow-2xl transition-all active:scale-95"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
        <path
          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
          stroke="#2e2e2e"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}
