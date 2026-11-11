"use client";

import { useMemo, useRef, useState } from "react";
import { Flaticon } from "@/components/ui/Flaticon";

const ORIGIN = {
  lat: Number(process.env.NEXT_PUBLIC_STORE_LAT || -7.204176),
  lng: Number(process.env.NEXT_PUBLIC_STORE_LNG || 109.911214),
};
const TILE_SIZE = 256;
type Point = { lat: number; lng: number };

function project({lat,lng}:Point, zoom:number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return { x: ((lng + 180) / 360) * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale };
}
function unproject(x:number,y:number,zoom:number):Point {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  return { lat: (180 / Math.PI) * Math.atan(Math.sinh(n)), lng };
}
function distanceKm(a:Point,b:Point) {
  const r=(n:number)=>n*Math.PI/180, dLat=r(b.lat-a.lat), dLng=r(b.lng-a.lng);
  const h=Math.sin(dLat/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}

export default function DeliveryLocationPicker({onEligibilityChange}:{onEligibilityChange?:(eligible:boolean)=>void}) {
  const [center,setCenter]=useState<Point>(ORIGIN);
  const [pin,setPin]=useState<Point>(ORIGIN);
  const [zoom,setZoom]=useState(11);
  const mapRef=useRef<HTMLDivElement>(null);
  const centerPx=useMemo(()=>project(center,zoom),[center,zoom]);
  const pinPx=useMemo(()=>project(pin,zoom),[pin,zoom]);
  const distance=distanceKm(ORIGIN,pin);
  const eligible=distance<=8;
  
  useMemo(()=>{
    if(onEligibilityChange) onEligibilityChange(eligible);
  },[eligible,onEligibilityChange]);
  const centerTileX=Math.floor(centerPx.x/TILE_SIZE), centerTileY=Math.floor(centerPx.y/TILE_SIZE);
  const tiles=[];
  for(let y=-2;y<=2;y++) for(let x=-2;x<=2;x++) {
    const tx=centerTileX+x, ty=centerTileY+y;
    if(ty<0||ty>=2**zoom) continue;
    tiles.push({tx,ty,left:tx*TILE_SIZE-centerPx.x,top:ty*TILE_SIZE-centerPx.y});
  }
  function chooseFromMap(event:React.MouseEvent<HTMLDivElement>) {
    const bounds=event.currentTarget.getBoundingClientRect();
    const point=unproject(centerPx.x+event.clientX-bounds.left-bounds.width/2,centerPx.y+event.clientY-bounds.top-bounds.height/2,zoom);
    setPin(point);
  }
  function useDeviceLocation() {
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(position=>{
      const point={lat:position.coords.latitude,lng:position.coords.longitude};
      setCenter(point);setPin(point);setZoom(15);
    },()=>{}, {enableHighAccuracy:true,timeout:10000,maximumAge:30000});
  }
  const googleUrl=`https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`;
  const googleEmbed=`https://maps.google.com/maps?q=${pin.lat},${pin.lng}&z=15&output=embed`;
  const markerLeft=pinPx.x-centerPx.x, markerTop=pinPx.y-centerPx.y;
  return <div className="space-y-2.5">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">Tentukan titik antar</p><p className="mt-0.5 text-xs text-[#77766f]">Ketuk peta untuk meletakkan pin, atau gunakan lokasi perangkat.</p></div><button type="button" onClick={useDeviceLocation} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e1d7] bg-white px-3 py-2 text-xs font-semibold hover:bg-[#f8f7f2]"><Flaticon name="crosshairs" variant="rr" className="text-xs" />Gunakan lokasi saya</button></div>
    <div ref={mapRef} onClick={chooseFromMap} role="application" aria-label="Peta pemilihan alamat pengantaran" className="relative h-[300px] cursor-crosshair overflow-hidden rounded-2xl border border-[#dedbd1] bg-[#e8e7df]">
      {tiles.map(tile=><img key={`${zoom}-${tile.tx}-${tile.ty}`} aria-hidden="true" draggable={false} src={`https://tile.openstreetmap.org/${zoom}/${tile.tx}/${tile.ty}.png`} alt="" className="pointer-events-none absolute max-w-none select-none" style={{width:TILE_SIZE,height:TILE_SIZE,left:`calc(50% + ${tile.left}px)`,top:`calc(50% + ${tile.top}px)`}}/>)}
      <div className="pointer-events-none absolute z-10" style={{left:`calc(50% + ${markerLeft}px)`,top:`calc(50% + ${markerTop}px)`,transform:"translate(-50%, -100%)"}}><Flaticon name="marker" variant="sr" className="text-3xl text-rose-600 drop-shadow-[0_2px_4px_rgba(0,0,0,.4)]"/><span className="sr-only">Pin lokasi pengantaran</span></div>
      <div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[10px] text-[#55554e]">© OpenStreetMap</div>
      <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-lg border border-[#ddd] bg-white shadow-sm"><button type="button" aria-label="Perbesar peta" onClick={e=>{e.stopPropagation();setZoom(z=>Math.min(17,z+1))}} className="grid h-9 w-9 place-items-center border-b hover:bg-[#f8f7f2]"><Flaticon name="plus" variant="rr" className="text-xs" /></button><button type="button" aria-label="Perkecil peta" onClick={e=>{e.stopPropagation();setZoom(z=>Math.max(9,z-1))}} className="grid h-9 w-9 place-items-center hover:bg-[#f8f7f2]"><Flaticon name="minus" variant="rr" className="text-xs" /></button></div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#292a23] shadow"/>
    </div>
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-xs ${eligible?"bg-[#f2f5e8] text-[#4e5d26]":"bg-red-50 text-red-700"}`}><span>{eligible?`Pin dalam area antar · ${distance.toFixed(1)} km dari Titik Nol Dieng`:`Di luar area antar · ${distance.toFixed(1)} km (maksimal 8 km)`}</span><a href={googleUrl} target="_blank" rel="noreferrer" className="font-semibold underline">Buka pin di Google Maps</a></div>
    <details className="overflow-hidden rounded-xl border border-[#e8e6df] bg-white"><summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-[#68675f]">Preview lokasi di Google Maps</summary><iframe title="Preview Google Maps untuk alamat pengantaran" src={googleEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-56 w-full border-0"/></details>
    <input type="hidden" name="lat" value={pin.lat}/><input type="hidden" name="lng" value={pin.lng}/>
  </div>;
}
