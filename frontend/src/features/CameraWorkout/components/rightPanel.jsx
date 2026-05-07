import BiometricsCard from "./bioMetricsCard";
import NeuralStatusCard from "./neuralStatusCard";
import SessionLog from "./sessionLog";


export default function RightPanel({ biometrics, logs }) {
  return (
    <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 sm:gap-6">
      <BiometricsCard biometrics={biometrics} />
      <SessionLog logs={logs} />
      <NeuralStatusCard />
    </div>
  );
}