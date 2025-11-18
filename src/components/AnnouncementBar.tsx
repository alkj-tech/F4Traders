export function AnnouncementBar() {
  return (
    <div className="bg-black text-white py-2 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col justify-center items-center text-center gap-2 text-sm">
          {/* Sliding text */}
          <div className="w-full overflow-hidden">
            <span className="announcement-marquee">
              Free Shipping On All Prepaid Orders
            </span>
          </div>

          {/* Static text */}
          <span>Cash on delivery and 3 Days easy replacement available</span>
        </div>
      </div>
    </div>
  );
}
