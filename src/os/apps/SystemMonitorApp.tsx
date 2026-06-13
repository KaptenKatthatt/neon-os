import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import type { AppHostProps } from './registry';

interface MemoryInfo {
  readonly usedJSHeapSize: number;
  readonly totalJSHeapSize: number;
  readonly jsHeapSizeLimit: number;
}

interface PerfWithMemory extends Performance {
  readonly memory?: MemoryInfo;
}

interface NetworkInformation {
  readonly effectiveType?: string;
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
  readonly type?: string;
  addEventListener: (t: string, l: () => void) => void;
  removeEventListener: (t: string, l: () => void) => void;
}

interface NavWithConn extends Navigator {
  readonly connection?: NetworkInformation;
}

interface StorageEstimateResult {
  readonly usage?: number;
  readonly quota?: number;
}

interface StorageManagerWithEstimate {
  estimate?: () => Promise<StorageEstimateResult>;
}
interface LongTaskEntry extends PerformanceEntry {
  readonly duration: number;
}

interface PerformanceObserverWithLongTask {
  new (cb: PerformanceObserverCallback, opts?: { entryTypes?: ReadonlyArray<string> }): PerformanceObserver;
  supportedEntryTypes: ReadonlyArray<string>;
}

const getMemory = (): MemoryInfo | null => {
  if (typeof performance === 'undefined') return null;
  const p = performance as PerfWithMemory;
  if (!p.memory) return null;
  return p.memory;
};

const getNetwork = (): NetworkInformation | null => {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as NavWithConn;
  return nav.connection ?? null;
};

const getStorage = (): StorageManagerWithEstimate | null => {
  if (typeof navigator === 'undefined') return null;
  const sm = navigator.storage as StorageManagerWithEstimate | undefined;
  return sm ?? null;
};

const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const formatMs = (n: number): string => {
  if (n < 1) return `${n.toFixed(2)} ms`;
  if (n < 100) return `${n.toFixed(1)} ms`;
  return `${Math.round(n)} ms`;
};

interface Sample {
  readonly cpu: number;
  readonly mem: number;
  readonly fps: number;
  readonly longTasks: number;
  readonly t: number;
}

const SAMPLE_LIMIT = 120;

const drawSparkline = (
  canvas: HTMLCanvasElement,
  values: ReadonlyArray<number>,
  min: number,
  max: number,
  stroke: string,
  fill: string,
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW <= 0 || cssH <= 0) return;
  const wantW = Math.floor(cssW * dpr);
  const wantH = Math.floor(cssH * dpr);
  if (canvas.width !== wantW || canvas.height !== wantH) {
    canvas.width = wantW;
    canvas.height = wantH;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  if (values.length === 0) return;
  const range = max - min || 1;
  const stepX = values.length > 1 ? cssW / (values.length - 1) : cssW;
  const grad = ctx.createLinearGradient(0, 0, 0, cssH);
  grad.addColorStop(0, fill);
  grad.addColorStop(1, 'rgba(34, 211, 238, 0)');

  ctx.beginPath();
  for (let i = 0; i < values.length; i++) {
    const v = values[i] ?? min;
    const x = i * stepX;
    const y = cssH - ((v - min) / range) * cssH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(cssW, cssH);
  ctx.lineTo(0, cssH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i < values.length; i++) {
    const v = values[i] ?? min;
    const x = i * stepX;
    const y = cssH - ((v - min) / range) * cssH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = stroke;
  ctx.stroke();
};

export const SystemMonitorApp = (_props: AppHostProps): JSX.Element => {
  const [samples, setSamples] = useState<ReadonlyArray<Sample>>([]);
  const [tick, setTick] = useState<number>(0);
  const [longTaskTotal, setLongTaskTotal] = useState<number>(0);
  const [storage, setStorage] = useState<{ usage: number | null; quota: number | null }>({
    usage: null,
    quota: null,
  });
  const [thermalPressure, setThermalPressure] = useState<number>(0);
  const lastFrameRef = useRef<number>(performance.now());
  const framesRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);
  const lastSampleRef = useRef<number>(performance.now());
  const startRef = useRef<number>(performance.now());
  const busyStartRef = useRef<number>(0);
  const busyAccumRef = useRef<number>(0);
  const longTasksInWindowRef = useRef<number>(0);
  const longTaskMsInWindowRef = useRef<number>(0);
  const cpuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const memCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fpsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ltCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const loop = (t: number): void => {
      if (!mounted) return;
      const delta = t - lastFrameRef.current;
      lastFrameRef.current = t;
      framesRef.current += 1;
      busyAccumRef.current += t - busyStartRef.current;
      busyStartRef.current = t;
      if (delta > 0) {
        const inst = 1000 / delta;
        fpsRef.current = fpsRef.current === 0 ? inst : fpsRef.current * 0.9 + inst * 0.1;
      }
      if (t - lastSampleRef.current >= 500) {
        const sampleT = t;
        const elapsed = sampleT - startRef.current;
        const cpuPct = elapsed > 0 ? Math.min(100, (busyAccumRef.current / elapsed) * 100) : 0;
        busyAccumRef.current = 0;
        startRef.current = sampleT;
        const mem = getMemory();
        const memPct = mem && mem.jsHeapSizeLimit > 0
          ? (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100
          : 0;
        const fps = fpsRef.current;
        const ltCount = longTasksInWindowRef.current;
        longTasksInWindowRef.current = 0;
        const ltMs = longTaskMsInWindowRef.current;
        longTaskMsInWindowRef.current = 0;
        const pressure = Math.min(100, (ltMs / 500) * 100);
        setThermalPressure(pressure);
        setSamples((prev) => {
          const next: Sample = { cpu: cpuPct, mem: memPct, fps, longTasks: ltCount, t: sampleT };
          const combined = [...prev, next];
          if (combined.length > SAMPLE_LIMIT) combined.splice(0, combined.length - SAMPLE_LIMIT);
          return combined;
        });
        setTick((x) => x + 1);
        lastSampleRef.current = sampleT;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return (): void => {
      mounted = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;
    const PO = PerformanceObserver as unknown as PerformanceObserverWithLongTask;
    if (!PO.supportedEntryTypes.includes('longtask')) return;
    let total = 0;
    const obs = new PO(
      (list) => {
        for (const entry of list.getEntries() as ReadonlyArray<LongTaskEntry>) {
          if (entry.duration > 50) {
            longTasksInWindowRef.current += 1;
            longTaskMsInWindowRef.current += entry.duration;
            total += entry.duration;
          }
        }
        setLongTaskTotal(total);
      },
      { entryTypes: ['longtask'] },
    );
    obs.observe({ entryTypes: ['longtask'] });
    return (): void => obs.disconnect();
  }, []);

  useEffect(() => {
    const sm = getStorage();
    if (!sm || !sm.estimate) return;
    const refresh = (): void => {
      sm.estimate?.()
        .then((est) => setStorage({ usage: est.usage ?? null, quota: est.quota ?? null }))
        .catch(() => undefined);
    };
    refresh();
    const t = window.setInterval(refresh, 5000);
    return (): void => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const net = getNetwork();
    if (!net) return;
    const onChange = (): void => setTick((x) => x + 1);
    net.addEventListener('change', onChange);
    return (): void => net.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const cpu = cpuCanvasRef.current;
    const mem = memCanvasRef.current;
    const fps = fpsCanvasRef.current;
    const lt = ltCanvasRef.current;
    if (!cpu || !mem || !fps || !lt) return;
    drawSparkline(cpu, samples.map((s) => s.cpu), 0, 100, '#22d3ee', 'rgba(34, 211, 238, 0.35)');
    drawSparkline(mem, samples.map((s) => s.mem), 0, 100, '#a78bfa', 'rgba(167, 139, 250, 0.35)');
    drawSparkline(fps, samples.map((s) => s.fps), 0, 120, '#34d399', 'rgba(52, 211, 153, 0.35)');
    drawSparkline(lt, samples.map((s) => s.longTasks), 0, 10, '#f472b6', 'rgba(244, 114, 182, 0.35)');
  }, [samples, tick]);

  const latest: Sample | undefined = samples[samples.length - 1];
  const mem = useMemo(() => getMemory(), [tick]);
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const ua = nav?.userAgent ?? 'unknown';
  const cores = nav ? (nav.hardwareConcurrency ?? null) : null;
  const lang = nav?.language ?? 'unknown';
  const online = nav ? nav.onLine : true;
  const viewport = typeof window !== 'undefined'
    ? { w: window.innerWidth, h: window.innerHeight }
    : { w: 0, h: 0 };
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const net = getNetwork();
  const totalLongTasks = samples.reduce((acc, s) => acc + s.longTasks, 0);
  const ltSupported = (() => {
    if (typeof PerformanceObserver === 'undefined') return false;
    const PO = PerformanceObserver as unknown as PerformanceObserverWithLongTask;
    return PO.supportedEntryTypes.includes('longtask');
  })();

  return (
    <div className="sysmon" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>Live System Monitor</h2>
        <p style={{ margin: 0, color: 'var(--neon-muted)', fontSize: 12 }}>
          CPU = main-thread animation work � Memory = JS heap � Long-tasks &gt; 50 ms � Network = browser connection API.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}
      >
        <Tile
          label="CPU"
          value={`${latest ? latest.cpu.toFixed(0) : '0'}%`}
          sub="Main thread"
        />
        <Tile
          label="FPS"
          value={`${latest ? latest.fps.toFixed(0) : '0'}`}
          sub={`${samples.length} samples`}
        />
        <Tile
          label="Memory"
          value={mem ? formatBytes(mem.usedJSHeapSize) : 'N/A'}
          sub={mem ? `of ${formatBytes(mem.jsHeapSizeLimit)}` : 'heap API unavailable'}
        />
        <Tile
          label="Thermal"
          value={`${thermalPressure.toFixed(0)}%`}
          sub="Long-task pressure"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SparkRow
          title="CPU usage"
          unit="%"
          current={latest ? latest.cpu : 0}
          canvasRef={cpuCanvasRef}
          min={0}
          max={100}
        />
        <SparkRow
          title="JS heap"
          unit="%"
          current={latest ? latest.mem : 0}
          canvasRef={memCanvasRef}
          min={0}
          max={100}
        />
        <SparkRow
          title="Frames per second"
          unit="fps"
          current={latest ? latest.fps : 0}
          canvasRef={fpsCanvasRef}
          min={0}
          max={120}
        />
        <SparkRow
          title="Long tasks"
          unit="/0.5s"
          current={latest ? latest.longTasks : 0}
          canvasRef={ltCanvasRef}
          min={0}
          max={10}
        />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--neon-border)' }} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 8,
          fontSize: 12,
        }}
      >
        <Row label="CPU cores" value={cores !== null ? String(cores) : 'unknown'} />
        <Row label="Language" value={lang} />
        <Row label="Viewport" value={`${viewport.w} � ${viewport.h}`} />
        <Row label="Timezone" value={tz} />
        <Row label="Network" value={online ? 'online' : 'offline'} />
        <Row label="Connection" value={net?.effectiveType ?? 'unknown'} />
        <Row
          label="Downlink"
          value={net?.downlink !== undefined ? `${net.downlink} Mbps` : 'unknown'}
        />
        <Row
          label="RTT"
          value={net?.rtt !== undefined ? `${net.rtt} ms` : 'unknown'}
        />
        <Row
          label="Storage used"
          value={storage.usage !== null ? formatBytes(storage.usage) : 'unknown'}
        />
        <Row
          label="Storage quota"
          value={storage.quota !== null ? formatBytes(storage.quota) : 'unknown'}
        />
        <Row label="Heap limit" value={mem ? formatBytes(mem.jsHeapSizeLimit) : 'unknown'} />
        <Row label="Total heap" value={mem ? formatBytes(mem.totalJSHeapSize) : 'unknown'} />
        <Row
          label="Long-task support"
          value={ltSupported ? `yes (${totalLongTasks} in window)` : 'no'}
        />
        <Row
          label="Total blocked"
          value={ltSupported ? `${(longTaskTotal / 1000).toFixed(2)} s` : '�'}
        />
        <Row label="User agent" value={ua} mono />
      </div>

      <p style={{ margin: 0, fontSize: 11, color: 'var(--neon-muted)' }}>
        {latest ? `Updated ${formatMs(performance.now() - latest.t)} ago` : 'Waiting for first sample...'}
      </p>
    </div>
  );
};

interface TileProps {
  readonly label: string;
  readonly value: string;
  readonly sub: string;
}

const Tile = ({ label, value, sub }: TileProps): JSX.Element => (
  <div
    style={{
      padding: 10,
      borderRadius: 10,
      border: '1px solid var(--neon-border)',
      background: 'rgba(255,255,255,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <span style={{ fontSize: 10, color: 'var(--neon-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
    <span style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    <span style={{ fontSize: 10, color: 'var(--neon-muted)' }}>{sub}</span>
  </div>
);

interface SparkRowProps {
  readonly title: string;
  readonly unit: string;
  readonly current: number;
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly min: number;
  readonly max: number;
}

const SparkRow = ({ title, unit, current, canvasRef, min, max }: SparkRowProps): JSX.Element => (
  <div
    style={{
      padding: 10,
      borderRadius: 10,
      border: '1px solid var(--neon-border)',
      background: 'rgba(255,255,255,0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 12, color: 'var(--neon-text)' }}>{title}</span>
      <span style={{ fontSize: 12, color: 'var(--neon-muted)', fontVariantNumeric: 'tabular-nums' }}>
        {current.toFixed(0)} {unit}
      </span>
    </div>
    <div style={{ width: '100%', height: 56, position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--neon-muted)' }}>
      <span>min {min}</span>
      <span>max {max}</span>
    </div>
  </div>
);

interface RowProps {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}

const Row = ({ label, value, mono }: RowProps): JSX.Element => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
      padding: '6px 8px',
      borderRadius: 6,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--neon-border)',
    }}
  >
    <span style={{ color: 'var(--neon-muted)' }}>{label}</span>
    <span
      title={value}
      style={{
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        textAlign: 'right',
        maxWidth: '70%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </span>
  </div>
);
