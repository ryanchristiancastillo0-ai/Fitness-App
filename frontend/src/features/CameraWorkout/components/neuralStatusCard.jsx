import { Icon } from "../../../components";
export default function NeuralStatusCard() {
  return (
    <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] bg-gradient-to-br from-[#D1FD52]/5 to-transparent border border-[#D1FD52]/10">
      <span className="text-[10px] font-black text-[#D1FD52] uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
        <Icon name="psychology" className="text-sm" />
        Neural Status
      </span>
      <p className="text-[11px] text-white/60 leading-relaxed">
        The system is monitoring 33 skeletal keypoints at 7 FPS to ensure maximum orthopedic safety.
        Voice cues announce your position, coach tips, and every 5th rep milestone.
      </p>
    </div>
  );
}