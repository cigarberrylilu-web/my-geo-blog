import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plane, ChevronLeft, ChevronRight, Pause, Play,
  Minimize2, X, MapPin, Clock
} from "lucide-react";
import { Location } from "@/src/types";

function cfThumb(originalUrl: string, width = 800, quality = 85): string {
  if (!originalUrl) return '';
  if (import.meta.env.DEV) return originalUrl;
  const options = `width=${width},quality=${quality},format=auto`;
  return `/cdn-cgi/image/${options}/${originalUrl}`;
}

interface AutoCruiseProps {
  locations: Location[];
  // 增加 isInitialJump 接口声明
  onFlyTo: (coords: [number, number], zoom: number, bearing: number, pitch: number, isInitialJump?: boolean) => Promise<void>;
  onCruiseStateChange: (active: boolean) => void;
}

interface LocationCardProps {
  location: Location;
  onClose: () => void;
}

function LocationCard({ location, onClose }: LocationCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const thumbUrl = location.images[0] ? cfThumb(location.images[0]) : null;
  const [currentImgSrc, setCurrentImgSrc] = useState<string | null>(thumbUrl);

  useEffect(() => {
    setCurrentImgSrc(thumbUrl);
    setImgLoaded(false);
  }, [thumbUrl]);

  const handleImageError = () => {
    if (currentImgSrc !== location.images[0]) {
      setCurrentImgSrc(location.images[0]); 
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] w-full max-w-sm pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/60 backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
        {currentImgSrc && (
          <div className="relative h-48 overflow-hidden">
            <motion.img
              src={currentImgSrc}
              alt={location.name}
              onLoad={() => setImgLoaded(true)}
              onError={handleImageError}
              initial={{ scale: 1.08 }}
              animate={{ scale: imgLoaded ? 1 : 1.08 }}
              transition={{ duration: 0.8 }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {location.images.length > 1 && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-full text-white/70 text-[10px] font-bold border border-white/10">
                +{location.images.length - 1} photos
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-xl leading-tight tracking-tight drop-shadow-lg">
                {location.name}
              </h3>
            </div>
          </div>
        )}

        <div className="px-5 pt-3 pb-4 space-y-2">
          {!currentImgSrc && (
            <h3 className="text-white font-bold text-xl">{location.name}</h3>
          )}
          <div className="flex items-center gap-3 text-white/50 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {location.date}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location.coordinates[1].toFixed(2)}°, {location.coordinates[0].toFixed(2)}°
            </span>
          </div>
          <p className="text-white/65 text-sm leading-relaxed line-clamp-2">
            {location.description}
          </p>
        </div>

        <div className="h-0.5 w-full bg-white/10">
          <motion.div
            className="h-full bg-blue-400"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "linear" }}
          />
        </div>
      </div>
      <button
        onClick={onClose}
        className="absolute -top-3 -right-3 w-7 h-7 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export function AutoCruise({ locations, onFlyTo, onCruiseStateChange }: AutoCruiseProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const [isCruising, setIsCruising] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadedImgs = useRef<Set<string>>(new Set());
  const isPausedRef = useRef(isPaused);
  const isActiveRef = useRef(isActive);
  const currentFlightId = useRef(0); 

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  const sorted = [...locations].sort((a, b) => a.date.localeCompare(b.date));

  const preloadImages = useCallback((idx: number) => {
    const loc = sorted[idx];
    if (!loc) return;
    loc.images.forEach(url => {
      if (preloadedImgs.current.has(url)) return;
      preloadedImgs.current.add(url);
      const img = new Image();
      img.src = cfThumb(url);
    });
  }, [sorted]);

  // 新增 isInitialJump 参数控制飞行动画形态
  const flyToLocation = useCallback(async (idx: number, isInitialJump = false) => {
    if (!sorted[idx]) return;
    const loc = sorted[idx];
    const flightId = ++currentFlightId.current;

    let bearing = 0;
    if (idx > 0) {
      const prev = sorted[idx - 1];
      const dLng = loc.coordinates[0] - prev.coordinates[0];
      const dLat = loc.coordinates[1] - prev.coordinates[1];
      bearing = (Math.atan2(dLng, dLat) * 180) / Math.PI;
    }

    setIsCruising(true);
    setShowCard(false);

    if (idx + 1 < sorted.length) preloadImages(idx + 1);

    // 将 isInitialJump 传给底层的 MapContainer
    await onFlyTo([loc.coordinates[0], loc.coordinates[1]], 11, bearing, 55, isInitialJump);

    if (flightId !== currentFlightId.current || !isActiveRef.current || isPausedRef.current) {
      return;
    }

    setIsCruising(false);
    setShowCard(true);

    timerRef.current = setTimeout(() => {
      if (flightId !== currentFlightId.current || !isActiveRef.current || isPausedRef.current) return;
      setShowCard(false);

      const next = idx + 1;
      if (next < sorted.length) {
        setCurrentIndex(next);
        // 自动巡航的下一步，isInitialJump 必须为 false，这样才会出现真实航线
        flyToLocation(next, false);
      } else {
        setIsActive(false);
        setCurrentIndex(0);
        onCruiseStateChange(false);
      }
    }, 5500); 
  }, [sorted, onFlyTo, onCruiseStateChange, preloadImages]);

  const startCruise = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    onCruiseStateChange(true);
    preloadImages(currentIndex);
    preloadImages(currentIndex + 1);
    // 首次点击开始，直接跳跃，不画非洲飞过来的线
    flyToLocation(currentIndex, true);
  }, [currentIndex, flyToLocation, preloadImages, onCruiseStateChange]);

  const stopCruise = useCallback(() => {
    currentFlightId.current++; 
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsActive(false);
    setIsPaused(false);
    setShowCard(false);
    setIsCruising(false);
    onCruiseStateChange(false);
  }, [onCruiseStateChange]);

  const pauseResume = useCallback(() => {
    setIsPaused(p => !p);
  }, []);

  const goTo = useCallback((idx: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowCard(false);
    const clamped = Math.max(0, Math.min(sorted.length - 1, idx));
    setCurrentIndex(clamped);
    // 用户手动点击跳转点，直接跳跃过去，不拉杂乱的航线
    if (isActive && !isPaused) flyToLocation(clamped, true);
  }, [isActive, isPaused, sorted.length, flyToLocation]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  useEffect(() => {
    if (!isActive) return;
    if (isPaused && timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [isPaused, isActive]);

  if (locations.length === 0) return null;

  if (isCollapsed) {
    return (
      <>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsCollapsed(false)}
          className="fixed top-[24rem] right-6 z-40 w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all shadow-lg"
        >
          <Plane className={`w-4 h-4 ${isActive ? "text-blue-400 animate-pulse" : ""}`} />
        </motion.button>
        <AnimatePresence>
          {showCard && sorted[currentIndex] && (
            <LocationCard location={sorted[currentIndex]} onClose={() => setShowCard(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-[24rem] right-6 z-40 w-64 pointer-events-auto"
      >
        <div className="p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={isActive && !isPaused ? { rotate: [0, 15, -5, 10, 0] } : {}}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <Plane className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-white/40"}`} />
              </motion.div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Auto Cruise
              </span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/30 hover:text-white/60"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 mb-3 overflow-hidden">
            {sorted.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative flex-1 h-1 rounded-full overflow-hidden transition-all"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                {i < currentIndex && (
                  <div className="absolute inset-0 bg-blue-500/70 rounded-full" />
                )}
                {i === currentIndex && (
                  <motion.div className="absolute inset-0 bg-blue-400 rounded-full" layoutId="activeDot" />
                )}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">
              {isActive ? (isCruising ? "Flying to..." : "Arrived at") : "Starting at"}
            </p>
            <p className="text-sm font-medium text-white truncate">
              {sorted[currentIndex]?.name ?? "—"}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">
              {currentIndex + 1} / {sorted.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all border border-white/5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {!isActive ? (
              <button
                onClick={startCruise}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-500/20"
              >
                <Play className="w-3.5 h-3.5" /> Start
              </button>
            ) : (
              <>
                <button
                  onClick={pauseResume}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-white/10"
                >
                  {isPaused ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
                </button>
                <button
                  onClick={stopCruise}
                  className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all border border-white/5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === sorted.length - 1}
              className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all border border-white/5"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <AnimatePresence>
            {isCruising && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <motion.div animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}>
                    <Plane className="w-3 h-3 text-blue-400" />
                  </motion.div>
                  <span className="text-[10px] text-blue-300/80 font-medium">
                    En route to {sorted[currentIndex]?.name?.split(",")[0]}...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showCard && sorted[currentIndex] && (
          <LocationCard location={sorted[currentIndex]} onClose={() => setShowCard(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
