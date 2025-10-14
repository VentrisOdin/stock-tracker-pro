
import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

export default function CandleChart({ bars }:{ bars:{t:number,o:number,h:number,l:number,c:number}[] }){
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!ref.current) return;
    const chart = createChart(ref.current, { height: 360, layout: { textColor: 'white', background: { type: 'solid', color: '#0b0f1a' }}});
    const s = chart.addCandlestickSeries();
    s.setData(bars.map(b=>({ time: Math.floor(b.t/1000), open:b.o, high:b.h, low:b.l, close:b.c })));
    const ro = new ResizeObserver(()=> chart.applyOptions({ width: ref.current!.clientWidth }));
    ro.observe(ref.current);
    return ()=>{ ro.disconnect(); chart.remove(); };
  }, [bars]);
  return <div style={{ width: "100%" }} ref={ref}/>;
}
