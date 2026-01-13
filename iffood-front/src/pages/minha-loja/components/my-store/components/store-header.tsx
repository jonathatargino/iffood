type StoreHeaderProps = {
  photoUrl: string | null;
  onBack: () => void;
  onPhotoUpload: () => void;
};

export function StoreHeader({
  photoUrl,
  onBack,
  onPhotoUpload,
}: StoreHeaderProps) {
  return (
    <div className="relative h-[321px] w-full overflow-hidden">
      <img
        src={
          photoUrl ||
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
        }
        alt="Store"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

      <div className="absolute left-6 right-6 top-14 flex justify-between">
        <button
          onClick={onBack}
          className="size-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center hover:bg-white transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#2e2e2e"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
        <button
          onClick={onPhotoUpload}
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
      </div>
    </div>
  );
}
