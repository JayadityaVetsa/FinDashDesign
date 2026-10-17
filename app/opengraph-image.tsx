import { ImageResponse } from 'next/og';
export const alt = 'FinDash — Your first financial workspace. Try the interactive demo without an account or API key.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',padding:80,background:'#10121b',color:'#f0f0f5',fontFamily:'sans-serif'}}>
    <div style={{display:'flex',alignItems:'center',gap:18,fontSize:32,color:'#72a7ff'}}><div style={{display:'flex',alignItems:'center',justifyContent:'center',width:58,height:58,borderRadius:16,background:'#4f8ef7',color:'white',fontWeight:700}}>F</div>FinDash</div>
    <div style={{display:'flex',fontSize:72,fontWeight:700,lineHeight:1.1,marginTop:40}}>Your first financial workspace.</div>
    <div style={{display:'flex',fontSize:31,color:'#b0b7cf',marginTop:28}}>Watchlists. Portfolio tracking. Room to learn.</div>
    <div style={{display:'flex',fontSize:23,color:'#72a7ff',marginTop:38}}>Try the sample-data demo · No account or API key</div>
  </div>,size);
}
