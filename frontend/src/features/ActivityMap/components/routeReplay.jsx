const RouteReplay = ({ fullPath }) => {
  const [drawnPath, setDrawnPath] = useState([fullPath[0]]);
  const [isDone, setIsDone] = useState(false);
  const frameRef = useRef(null);
  const indexRef = useRef(1);
  const PPF = Math.max(1, Math.ceil(fullPath.length / 120));

  useEffect(() => {
    indexRef.current = 1;
    setDrawnPath([fullPath[0]]);
    setIsDone(false);
    const tick = () => {
      if (indexRef.current >= fullPath.length) { setIsDone(true); return; }
      indexRef.current = Math.min(indexRef.current + PPF, fullPath.length);
      setDrawnPath(fullPath.slice(0, indexRef.current));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [fullPath, PPF]);

  return (
    <>
      <Polyline positions={fullPath} pathOptions={{ color: '#D1FD52', weight: 4, opacity: 0.12 }} />
      <Polyline positions={drawnPath} pathOptions={{ color: '#D1FD52', weight: 5, opacity: 0.9 }} />
      <Marker position={fullPath[0]} icon={createStartIcon()} />
      {!isDone && drawnPath.length > 0 && (
        <Marker position={drawnPath[drawnPath.length - 1]} icon={createUserIcon()} />
      )}
      {isDone && (
        <Marker position={fullPath[fullPath.length - 1]} icon={createFinishIcon()} />
      )}
    </>
  );
};

export default RouteReplay