import { assets } from "../assets/assets";

export default function Logo() {
  return (
    <div className="flex items-center space-x-1">
      {/* Logo Image */}
      <img
        src={assets.logo}
        alt="Knowledge Hive Logo"
        className="w-14 h-14 object-contain"
      />

      {/* Text */}
      <h3 className="font-extrabold text-3xl tracking-tight">
        Knowledge
        <br />
        <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-transparent bg-clip-text">
          Hive
        </span>
      </h3>
    </div>
  );
}
