type StoreHeaderProps = {
  photoUrl: string | null;
  onPhotoUpload?: () => void;
};

export function StoreHeader({ photoUrl, onPhotoUpload }: StoreHeaderProps) {
  return (
    <div className="relative h-[321px] w-full overflow-hidden">
      <img
        src={
          photoUrl ||
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
        }
        alt="Store"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

      {onPhotoUpload && (
        <div className="absolute top-14 right-6 left-6 flex flex-row-reverse">
          <button
            onClick={onPhotoUpload}
            className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-xl transition-all hover:shadow-2xl active:scale-95"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
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
      )}
    </div>
  );
}
