import { BrowserMultiFormatReader } from "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm";

const $ = id => document.getElementById(id);
const video=$("video"), scan=$("scan"), stop=$("stop"), isbn=$("isbn"), lookup=$("lookup");
const error=$("error"), result=$("result"), title=$("title"), author=$("author"), isbnOut=$("isbnOut"), edition=$("edition");
let controls=null;

function clean(v){return (v||"").replace(/[^0-9Xx]/g,"").toUpperCase();}
function valid(v){
 v=clean(v);
 if(v.length===13){let s=0;for(let i=0;i<13;i++)s+=Number(v[i])*(i%2?3:1);return s%10===0;}
 if(v.length===10){let s=0;for(let i=0;i<10;i++){const n=v[i]==="X"?10:Number(v[i]);if(!Number.isInteger(n))return false;s+=(10-i)*n;}return s%11===0;}
 return false;
}
async function findBook(value){
 error.textContent=""; result.style.display="none";
 const id=clean(value);
 if(!valid(id)){error.textContent="Please scan or enter a valid ISBN-10 or ISBN-13.";return;}
 try{
  const r=await fetch("https://openlibrary.org/api/books?bibkeys=ISBN:"+id+"&jscmd=data&format=json");
  const data=await r.json(), b=data["ISBN:"+id];
  if(!b){error.textContent="I couldn't find that ISBN.";return;}
  title.textContent=[b.title,b.subtitle].filter(Boolean).join(": ");
  author.textContent=(b.authors||[]).map(a=>a.name).join(", ")||"Author not listed";
  isbnOut.textContent=id;
  const d=[(b.publishers||[]).map(p=>p.name).join(", "),b.publish_date,b.number_of_pages?b.number_of_pages+" pages":""].filter(Boolean);
  edition.textContent="Edition details: "+(d.length?d.join(" • "):"Not available");
  result.style.display="block";
 }catch(e){console.error(e);error.textContent="The book lookup could not be completed.";}
}
function stopScan(){
 if(controls){controls.stop();controls=null;}
 try{video.srcObject?.getTracks().forEach(t=>t.stop());}catch{}
 video.srcObject=null;video.style.display="none";scan.hidden=false;stop.hidden=true;
}
scan.addEventListener("click",async()=>{
 error.textContent="";
 try{
  const reader=new BrowserMultiFormatReader();
  video.style.display="block";scan.hidden=true;stop.hidden=false;
  controls=await reader.decodeFromVideoDevice(undefined,video,(r)=>{
   if(r){isbn.value=r.getText();stopScan();findBook(r.getText());}
  });
 }catch(e){console.error(e);error.textContent="Camera access could not start. Allow camera access and try again.";stopScan();}
});
stop.addEventListener("click",stopScan);
lookup.addEventListener("click",()=>findBook(isbn.value));
isbn.addEventListener("keydown",e=>{if(e.key==="Enter")findBook(isbn.value);});
$("again").addEventListener("click",()=>{result.style.display="none";isbn.value="";error.textContent="";window.scrollTo({top:0,behavior:"smooth"});});
