import BiometricBar from "./bioMetricBar";
import { Icon } from "../../../components";
export default function BiometricsCard({ biometrics }) {
  const metrics = [
    { label: 'Body Alignment', val: biometrics.alignment, color: '#D1FD52' },
    { label: 'Rep Speed',      val: biometrics.velocity,  color: '#5BC8FF' },
    { label: 'Symmetry Index', val: biometrics.symmetry,  color: '#FF7A5C' },
  ];
  return (
    <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-white/5">
      <h4 className="text-white font-black text-[10px] mb-5 sm:mb-8 uppercase tracking-[0.3em] flex items-center gap-2">
        <Icon name="monitor_heart" className="text-[#D1FD52] text-sm" />
        Live Biometrics
      </h4>
      <div className="space-y-5 sm:space-y-8">
        {metrics.map((m) => (
          <BiometricBar key={m.label} label={m.label} val={m.val} color={m.color} />
        ))}
      </div>
    </div>
  );
}
