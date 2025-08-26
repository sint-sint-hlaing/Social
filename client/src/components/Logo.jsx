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
      <h3 className="font-extrabold text-3xl tracking-wider ">
        Knowledge
        <br />
        <span className="bg-gradient-to-r from-cyan-400 via-teal-500 to-blue-600 text-transparent bg-clip-text font-bold">
          Hive
        </span>
      </h3>
    </div>
  );
}
