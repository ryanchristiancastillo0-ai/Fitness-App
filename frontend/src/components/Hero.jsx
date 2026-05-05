const Hero = ({ name, goal, avatar }) => {
  return (
    <div className="flex items-center gap-4 mb-8 p-6 bg-[#1c1b1b] rounded-[14px] border border-white/[0.05]">
      <div className="relative">
        <img
          src={avatar || 'https://via.placeholder.com/150'}
          className="w-16 h-16 rounded-full border-2 border-[#c7f248]"
          alt="Profile"
        />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[#e5e2e1]">
          Welcome back, {name || 'Athlete'}
        </h1>
        <p className="text-sm text-[#555]">Goal: {goal}</p>
      </div>
    </div>
  );
};

export default Hero;