import { Icon } from "../../../components";
import SessionLogRow from "./sessionLogRow";

export default function SessionLog({ logs }) {
  if (logs.length === 0) return null;
  return (
    <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-white/5">
      <h4 className="text-white font-black text-[10px] mb-4 uppercase tracking-[0.3em] flex items-center gap-2">
        <Icon name="history" className="text-[#D1FD52] text-sm" />
        Session Log
      </h4>
      <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
        {logs.slice().reverse().map((log, i) => (
          <SessionLogRow key={i} log={log} />
        ))}
      </div>
    </div>
  );
}