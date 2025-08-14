export default function Logo() {
  return (
    <div className="flex items-center space-x-3">
      {/* Speech bubble with warm gradient nodes */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="url(#warmGrad)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <linearGradient id="warmGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBBF24" /> {/* Yellow-400 */}
            <stop offset="50%" stopColor="#F97316" /> {/* Orange-500 */}
            <stop offset="100%" stopColor="#EC4899" /> {/* Pink-500 */}
          </linearGradient>
        </defs>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
        {/* Circles with solid warm colors to match gradient */}
        <circle cx="8" cy="12" r="1.5" fill="#FBBF24" /> {/* Yellow */}
        <circle cx="16" cy="12" r="1.5" fill="#F97316" /> {/* Orange */}
        <path d="M8 13.5h8" stroke="#FB923C" strokeWidth={1.5} /> {/* Lighter Orange */}
      </svg>

      {/* Text */}
      <h3 className="font-extrabold text-2xl tracking-tight">
        Knowledge
        <br />
        <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-transparent bg-clip-text">
          Hive
        </span>
      </h3>
    </div>
  );
}
