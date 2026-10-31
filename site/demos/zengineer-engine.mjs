export const WIDTH=800, HEIGHT=640;
export const overlaps=(a,b)=>a.x-a.w/2<b.x+b.w/2&&a.x+a.w/2>b.x-b.w/2&&a.y-a.h/2<b.y+b.h/2&&a.y+a.h/2>b.y-b.h/2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class ArcadeGame{
 constructor({random=Math.random,highScore=0}={}){this.random=random;this.highScore=Number.isFinite(Number(highScore))?Math.max(0,Math.floor(Number(highScore))):0;this.events=[];this.time=0;this.mode='attract';this.score=0;this.lives=3;this.wave=1;this.player={x:400,y:590,w:30,h:24};this.setupWave();}
 emit(type,data={}){this.events.push({type,...data});}
 points(n){this.score+=n;this.highScore=Math.max(this.highScore,this.score);}
 start(){this.score=0;this.lives=3;this.wave=1;this.time=0;this.events=[];this.player.x=400;this.player.y=590;this.invulnerable=1.6;this.setupWave();this.mode='playing';this.emit('start');}
 setupWave(){this.enemies=[];this.shots=[];this.enemyShots=[];this.direction=1;this.fireCooldown=0;this.enemyClock=1.5;this.diveClock=7;this.boss=null;this.waveBonus=0;this.clearTime=0;
  const bossWave=this.wave%4===0,rows=bossWave?3:Math.min(5,3+Math.floor(this.wave/2)),cols=9;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)this.enemies.push({x:144+col*64,y:(bossWave?182:106)+row*43,w:30,h:25,type:row%3,col,hp:this.wave>=6&&row===0?2:1,phase:this.random()*6.28});
  this.initialCount=this.enemies.length;
  if(bossWave)this.boss={x:400,y:83,w:160,h:56,hp:18+this.wave*2,maxHp:18+this.wave*2,phase:0,fire:2};
 }
 get speed(){return Math.min(175,25+this.wave*9+(1-this.enemies.length/this.initialCount)*57);}
 get attackInterval(){return Math.max(.22,1.3/(1+this.wave*.19));}
 pause(){if(this.mode==='playing'||this.mode==='between'){this.beforePause=this.mode;this.mode='paused';}else if(this.mode==='paused')this.mode=this.beforePause;}
 damage(reason='shot'){if(this.invulnerable>0||this.mode!=='playing')return;this.lives--;this.emit('hurt',{x:this.player.x,y:this.player.y});this.enemyShots=[];this.player.x=400;this.invulnerable=2.3;if(reason==='breach'){const minY=Math.min(...this.enemies.map(e=>e.y));for(const e of this.enemies)e.y-=minY-110;}
  if(this.lives<=0){this.lives=0;this.mode='gameover';this.emit('gameover');}}
 update(dt,input={}){dt=clamp(dt,0,.05);this.events=[];if(this.mode==='paused')return;this.time+=dt;if(this.mode==='attract'||this.mode==='gameover')return;
  this.invulnerable=Math.max(0,(this.invulnerable||0)-dt);this.player.x=clamp(this.player.x+(Number(Boolean(input.right))-Number(Boolean(input.left)))*360*dt,24,WIDTH-24);
  if(this.mode==='between'){this.clearTime-=dt;if(this.clearTime<=0){this.wave++;this.setupWave();this.mode='playing';this.invulnerable=1.5;this.emit('wave',{wave:this.wave});}return;}
  this.fireCooldown-=dt;if(input.fire&&this.fireCooldown<=0){this.shots.push({x:this.player.x,y:this.player.y-20,w:4,h:12,vy:-620});this.fireCooldown=.17;this.emit('laser');}
  if(this.enemies.length){const left=Math.min(...this.enemies.map(e=>e.x-e.w/2)),right=Math.max(...this.enemies.map(e=>e.x+e.w/2));let dx=this.speed*this.direction*dt;
   if(left+dx<24||right+dx>WIDTH-24){this.direction*=-1;dx=this.speed*this.direction*dt;for(const e of this.enemies)e.y+=16+Math.min(12,this.wave*2);this.emit('step');}
   for(const e of this.enemies)e.x+=dx;
  }
  if(this.boss){const b=this.boss;b.phase+=dt;b.x=400+Math.sin(b.phase*.7)*235;b.fire-=dt;if(b.fire<=0){for(const vx of [-110,0,110])this.enemyShots.push({x:b.x,y:b.y+32,w:7,h:12,vx,vy:190+this.wave*8,boss:true});b.fire=Math.max(.8,2.2-this.wave*.08);this.emit('enemyFire');}}
  this.enemyClock-=dt;if(this.enemyClock<=0&&this.enemies.length&&this.enemyShots.length<18){const bottom=new Map();for(const e of this.enemies)if(!bottom.has(e.col)||e.y>bottom.get(e.col).y)bottom.set(e.col,e);const choices=[...bottom.values()],e=choices[Math.floor(this.random()*choices.length)];this.enemyShots.push({x:e.x,y:e.y+16,w:6,h:12,vx:clamp((this.player.x-e.x)*.22,-75,75),vy:180+this.wave*13});this.enemyClock=this.attackInterval*(.7+this.random()*.6);this.emit('enemyFire');}
  for(const s of this.shots){const oldY=s.y;s.y+=s.vy*dt;const sweep={...s,y:(oldY+s.y)/2,h:Math.abs(oldY-s.y)+s.h};let target=this.boss&&overlaps(sweep,this.boss)?this.boss:this.enemies.find(e=>overlaps(sweep,e));if(target){s.dead=true;target.hp--;if(target===this.boss){this.points(25);this.emit('bossHit',{x:s.x,y:s.y});if(target.hp<=0){this.points(1000);this.emit('bossDead',{x:target.x,y:target.y});this.boss=null;}}else if(target.hp<=0){this.points([30,20,10][target.type]);this.emit('explode',{x:target.x,y:target.y,enemyType:target.type});this.enemies=this.enemies.filter(e=>e!==target);}else this.emit('bossHit',{x:s.x,y:s.y});}}
  this.shots=this.shots.filter(s=>!s.dead&&s.y>-20);
  for(const s of this.enemyShots){const oldY=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;if(overlaps({...s,y:(oldY+s.y)/2,h:Math.abs(oldY-s.y)+s.h},this.player)){s.dead=true;this.damage();}}
  this.enemyShots=this.enemyShots.filter(s=>!s.dead&&s.y<HEIGHT+30&&s.x>-30&&s.x<WIDTH+30);
  if(this.enemies.some(e=>overlaps(e,this.player))||this.enemies.some(e=>e.y+e.h/2>this.player.y-20)){if(this.invulnerable>0){for(const e of this.enemies)e.y=Math.min(e.y,this.player.y-62);}else this.damage('breach');}
  if(this.mode==='playing'&&!this.enemies.length&&!this.boss){this.waveBonus=250+this.wave*100;this.points(this.waveBonus);this.mode='between';this.clearTime=2.1;this.enemyShots=[];this.shots=[];this.emit('clear',{bonus:this.waveBonus});}
 }
}
