import { createCanvas } from '@napi-rs/canvas';

function getDoy(now) {
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', ly = y;
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' ';
    if (ctx.measureText(test).width > maxW && n > 0) {
      ctx.fillText(line.trim(), x, ly);
      line = words[n] + ' '; ly += lh;
    } else line = test;
  }
  ctx.fillText(line.trim(), x, ly);
  return ly;
}

export default async function handler(req, res) {
  // iPhone 13 & 15 base: 1170x2532 @3x
  const W = 1170, H = 2532;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const now = new Date();
  // IST offset
  const ist = new Date(now.getTime() + (5.5*60*60*1000));
  const doy = getDoy(ist);
  const totalDays = 365;
  const daysLeft = totalDays - doy;
  const pct = Math.round((doy / totalDays) * 100);
  const weeksDone = Math.floor(doy / 7);

  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr = `${DAYS[ist.getDay()]}, ${MONTHS[ist.getMonth()]} ${ist.getDate()}`;

  const curHour = ist.getHours();
  const curMin  = ist.getHours()*60 + ist.getMinutes();

  const TASKS = [
    { icon:'🧘', name:'Morning Meditation', time:'5:00 AM · 20 min',  sh:5,  sm:0,  dur:20  },
    { icon:'💪', name:'Morning Workout',    time:'5:30 AM · 45 min',  sh:5,  sm:30, dur:45  },
    { icon:'📖', name:'Deep Work Session',  time:'9:00 AM · 2 hrs',   sh:9,  sm:0,  dur:120 },
    { icon:'🚀', name:'Review & Plan',      time:'6:00 PM · 30 min',  sh:18, sm:0,  dur:30  },
  ];

  const QUOTES = [
    "Small daily improvements lead to staggering long-term results.",
    "Push yourself — because no one else is going to do it for you.",
    "What you do today determines who you'll be tomorrow.",
    "Dream it. Believe it. Build it. The time is NOW.",
    "Every morning you have two choices: sleep with your dreams or wake and chase them.",
    "The secret of getting ahead is getting started.",
  ];
  const quote = QUOTES[doy % QUOTES.length];
  const streak = 12; // can be made dynamic

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BACKGROUND
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ctx.fillStyle = '#07070F';
  ctx.fillRect(0, 0, W, H);

  // Glow blobs
  [[W*0.15,H*0.06,'rgba(90,70,255,0.35)',W*0.6],
   [W*0.88,H*0.12,'rgba(150,110,255,0.22)',W*0.5],
   [W*0.5, H*0.97,'rgba(30,150,240,0.12)',W*0.65]
  ].forEach(([gx,gy,col,gr])=>{
    const g=ctx.createRadialGradient(gx,gy,0,gx,gy,gr);
    g.addColorStop(0,col); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  });

  // Subtle grid
  ctx.strokeStyle='rgba(255,255,255,0.018)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=96){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=96){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // Stars
  const rng = (seed) => { let s=seed; return ()=>{ s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; }; };
  const rand = rng(doy*1234+42);
  for(let i=0;i<75;i++){
    const sx=rand()*W, sy=rand()*H, sr=rand()*2.2+0.4;
    ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${(rand()*0.28+0.06).toFixed(2)})`; ctx.fill();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DYNAMIC ISLAND
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ctx.fillStyle='#000';
  roundRect(ctx,W/2-168,28,336,94,55); ctx.fill();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATE — subtle top
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ctx.fillStyle='rgba(255,255,255,0.42)';
  ctx.font='400 46px -apple-system';
  ctx.textAlign='left';
  ctx.fillText(dateStr, 62, 196);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CLOCK SPACE (iPhone native clock overlays here)
  // Leave ~370px gap — iphone 13/15 clock sits here perfectly
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // (intentionally empty — iPhone renders its own clock on top)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BADGE ROW  y=580
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const BY = 590;
  const bdata = [
    { t:`${daysLeft} days left`, bg:'rgba(95,75,255,0.2)',  br:'rgba(100,82,255,0.5)',  fc:'#C4B0FF' },
    { t:`2026 · ${pct}% done`,   bg:'rgba(255,255,255,0.07)', br:'rgba(255,255,255,0.12)', fc:'rgba(255,255,255,0.52)' },
    { t:`🔥 ${streak} streak`,   bg:'rgba(255,95,45,0.22)',br:'rgba(255,115,50,0.48)', fc:'#FF9060' },
  ];
  let bx=62;
  ctx.font='600 34px -apple-system';
  bdata.forEach(b=>{
    const tw=ctx.measureText(b.t).width, bw=tw+64, bh=78;
    ctx.fillStyle=b.bg; roundRect(ctx,bx,BY,bw,bh,39); ctx.fill();
    ctx.strokeStyle=b.br; ctx.lineWidth=2.5; roundRect(ctx,bx,BY,bw,bh,39); ctx.stroke();
    ctx.fillStyle=b.fc; ctx.textAlign='left'; ctx.fillText(b.t,bx+32,BY+50);
    bx+=bw+20;
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DOT GRID  y=692
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const PX=60, DY=700, DH=228;
  ctx.fillStyle='rgba(255,255,255,0.04)';
  roundRect(ctx,PX,DY,W-PX*2,DH,40); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=2;
  roundRect(ctx,PX,DY,W-PX*2,DH,40); ctx.stroke();
  // shimmer line
  const shg=ctx.createLinearGradient(PX,DY,W-PX,DY);
  shg.addColorStop(0,'transparent'); shg.addColorStop(0.5,'rgba(255,255,255,0.13)'); shg.addColorStop(1,'transparent');
  ctx.fillStyle=shg; ctx.fillRect(PX,DY,W-PX*2,2.5);

  // dots: 26 cols × 2 rows = 52 weeks
  const COLS=26, ROWS=2;
  const DS=20, DG=9;
  const dotW = COLS*(DS+DG)-DG;
  const dotStartX = PX + (W-PX*2-dotW)/2;
  const dotStartY = DY + (DH - ROWS*(DS+DG+2))/2;

  for(let i=0;i<COLS*ROWS;i++){
    const col=i%COLS, row=Math.floor(i/COLS);
    const wk=Math.round((i/(COLS*ROWS))*53);
    const dx=dotStartX+col*(DS+DG);
    const dy=dotStartY+row*(DS+DG+4);
    if(wk<weeksDone){
      const dg=ctx.createRadialGradient(dx+DS/2,dy+DS/2,0,dx+DS/2,dy+DS/2,DS);
      dg.addColorStop(0,'#9B8AFF'); dg.addColorStop(1,'#5C42EE');
      ctx.fillStyle=dg; ctx.shadowColor='rgba(108,82,255,0.65)'; ctx.shadowBlur=7;
    } else if(wk===weeksDone){
      ctx.fillStyle='#FFFFFF'; ctx.shadowColor='rgba(255,255,255,1)'; ctx.shadowBlur=18;
    } else {
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.shadowBlur=0;
    }
    roundRect(ctx,dx,dy,DS,DS,5); ctx.fill();
    ctx.shadowBlur=0;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GOAL ROW  y=950
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const GY=950, GH=94;
  ctx.fillStyle='rgba(255,255,255,0.04)';
  roundRect(ctx,PX,GY,W-PX*2,GH,30); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=2;
  roundRect(ctx,PX,GY,W-PX*2,GH,30); ctx.stroke();

  ctx.fillStyle='#7C6AFF'; ctx.shadowColor='rgba(124,106,255,0.9)'; ctx.shadowBlur=12;
  ctx.beginPath(); ctx.arc(PX+42,GY+GH/2,11,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;

  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='500 28px -apple-system'; ctx.textAlign='left';
  ctx.fillText('Yearly Goal', PX+66, GY+54);
  ctx.fillStyle='rgba(255,255,255,0.88)'; ctx.font='700 34px -apple-system';
  ctx.fillText('Build your best year yet', PX+240, GY+54);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TASKS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let TY = 1068, nextSet = false;

  TASKS.forEach(t=>{
    const sm=t.sh*60+t.sm, em=sm+t.dur;
    let state, badge;
    if(curMin>=sm&&curMin<em)            { state='now';   badge='NOW';   }
    else if(curMin<sm&&!nextSet)         { state='next';  badge='NEXT';  nextSet=true; }
    else if(curMin<sm)                   { state='later'; badge='LATER'; }
    else                                 { state='done';  badge='✓';     }

    const TH=138;
    // card
    if(state==='now')       ctx.fillStyle='rgba(95,75,255,0.14)';
    else if(state==='done') ctx.fillStyle='rgba(255,255,255,0.025)';
    else                    ctx.fillStyle='rgba(255,255,255,0.048)';
    roundRect(ctx,PX,TY,W-PX*2,TH,36); ctx.fill();

    if(state==='now')       ctx.strokeStyle='rgba(100,82,255,0.42)';
    else if(state==='next') ctx.strokeStyle='rgba(52,211,153,0.25)';
    else                    ctx.strokeStyle='rgba(255,255,255,0.08)';
    ctx.lineWidth=2; roundRect(ctx,PX,TY,W-PX*2,TH,36); ctx.stroke();

    // accent bar
    if(state==='now')       { ctx.fillStyle='#7C6AFF'; ctx.shadowColor='rgba(124,106,255,0.85)'; ctx.shadowBlur=12; }
    else if(state==='next') { ctx.fillStyle='#34D399'; ctx.shadowBlur=0; }
    else if(state==='later'){ ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.shadowBlur=0; }
    else                    { ctx.fillStyle='rgba(255,255,255,0.1)';  ctx.shadowBlur=0; }
    roundRect(ctx,PX,TY+22,5,TH-44,3); ctx.fill(); ctx.shadowBlur=0;

    // icon bg
    const IW=90,IX=PX+28,IY=TY+(TH-IW)/2;
    ctx.fillStyle='rgba(255,255,255,0.09)';
    roundRect(ctx,IX,IY,IW,IW,22); ctx.fill();
    ctx.font='50px serif'; ctx.textAlign='center';
    ctx.globalAlpha = state==='done'?0.38:1;
    ctx.fillText(t.icon, IX+IW/2, IY+62);

    // text
    ctx.globalAlpha = state==='done'?0.38:1;
    ctx.fillStyle='#FFFFFF'; ctx.font='600 38px -apple-system'; ctx.textAlign='left';
    ctx.fillText(t.name, PX+136, TY+56);
    ctx.fillStyle='rgba(255,255,255,0.38)'; ctx.font='400 30px -apple-system';
    ctx.fillText(t.time, PX+136, TY+98);
    ctx.globalAlpha=1;

    // progress bar (now only)
    if(state==='now'){
      const p=Math.min(100,Math.round(((curMin-sm)/t.dur)*100));
      const bx=PX+136,by=TY+114,bw=W-PX*2-220,bh=9;
      ctx.fillStyle='rgba(255,255,255,0.08)'; roundRect(ctx,bx,by,bw,bh,5); ctx.fill();
      const pg=ctx.createLinearGradient(bx,0,bx+bw,0);
      pg.addColorStop(0,'#6C52FF'); pg.addColorStop(1,'#A78BFA');
      ctx.fillStyle=pg; ctx.shadowColor='rgba(108,82,255,0.5)'; ctx.shadowBlur=8;
      roundRect(ctx,bx,by,bw*(p/100)||4,bh,5); ctx.fill(); ctx.shadowBlur=0;
    }

    // badge
    ctx.font='700 26px -apple-system'; ctx.textAlign='center';
    const btw=ctx.measureText(badge).width+48, bth=52;
    const bx2=W-PX-btw-14, by2=TY+18;
    if(state==='now')       { ctx.fillStyle='rgba(100,82,255,0.32)'; ctx.strokeStyle='rgba(100,82,255,0.55)'; }
    else if(state==='next') { ctx.fillStyle='rgba(52,211,153,0.16)'; ctx.strokeStyle='rgba(52,211,153,0.32)'; }
    else if(state==='later'){ ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.strokeStyle='rgba(255,255,255,0.08)'; }
    else                    { ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.strokeStyle='rgba(255,255,255,0.05)'; }
    roundRect(ctx,bx2,by2,btw,bth,26); ctx.fill();
    ctx.lineWidth=1.5; roundRect(ctx,bx2,by2,btw,bth,26); ctx.stroke();
    if(state==='now')       ctx.fillStyle='#C4B0FF';
    else if(state==='next') ctx.fillStyle='#34D399';
    else                    ctx.fillStyle='rgba(255,255,255,0.28)';
    ctx.fillText(badge, bx2+btw/2, by2+35);

    TY += TH+14;
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WATER TRACKER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const WY=TY, WH=120;
  ctx.fillStyle='rgba(255,255,255,0.04)';
  roundRect(ctx,PX,WY,W-PX*2,WH,34); ctx.fill();
  ctx.strokeStyle='rgba(56,189,248,0.2)'; ctx.lineWidth=2;
  roundRect(ctx,PX,WY,W-PX*2,WH,34); ctx.stroke();

  ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.font='600 26px -apple-system'; ctx.textAlign='left';
  ctx.fillText('HYDRATION', PX+38, WY+44);

  // glass count based on time
  const glassCount = Math.min(8, Math.max(0, Math.floor((curHour-7)/2)));
  for(let i=0;i<8;i++){
    ctx.globalAlpha = i<glassCount?1:0.14;
    ctx.font='38px serif'; ctx.textAlign='left';
    ctx.fillText('💧', PX+38+i*66, WY+94);
  }
  ctx.globalAlpha=1;
  ctx.fillStyle='rgba(56,189,248,0.85)'; ctx.font='600 30px -apple-system'; ctx.textAlign='right';
  ctx.fillText(`${glassCount} of 8 glasses`, W-PX-38, WY+70);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // QUOTE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const QY=WY+WH+16, QH=154;
  ctx.fillStyle='rgba(255,255,255,0.033)';
  roundRect(ctx,PX,QY,W-PX*2,QH,34); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=2;
  roundRect(ctx,PX,QY,W-PX*2,QH,34); ctx.stroke();

  ctx.fillStyle='rgba(95,75,255,0.1)'; ctx.font='700 200px Georgia'; ctx.textAlign='right';
  ctx.fillText('"', W-PX+24, QY+160);

  ctx.fillStyle='rgba(255,255,255,0.48)'; ctx.font='italic 500 32px -apple-system'; ctx.textAlign='left';
  const qLastY = wrapText(ctx, `"${quote}"`, PX+38, QY+50, W-PX*2-100, 44);
  ctx.fillStyle='#9B8AFF'; ctx.font='600 28px -apple-system';
  ctx.fillText('— Nexus Life OS', PX+38, qLastY+40);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POWERED
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.font='400 22px -apple-system'; ctx.textAlign='center';
  ctx.fillText('POWERED BY NEURAL INTELLIGENCE', W/2, H-60);

  // HOME INDICATOR
  ctx.fillStyle='rgba(255,255,255,0.22)';
  roundRect(ctx,W/2-204,H-36,408,14,7); ctx.fill();

  const buf = canvas.toBuffer('image/png');
  res.setHeader('Content-Type','image/png');
  res.setHeader('Cache-Control','no-cache,no-store,must-revalidate');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.send(buf);
}
