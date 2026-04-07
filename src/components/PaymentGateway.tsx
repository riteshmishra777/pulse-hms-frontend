import { useState } from 'react';
import api from "../api/axiosConfig";

interface PaymentGatewayProps {
  bill: {
    id: number;
    totalAmount: number;
    paidAmount: number;
    patient?: { firstName: string; lastName: string };
  };
  onSuccess: () => void;
  onClose: () => void;
}

type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';
type Screen = 'method' | 'details' | 'processing' | 'success' | 'failed';

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank'];
const WALLETS = ['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik'];

export default function PaymentGateway({ bill, onSuccess, onClose }: PaymentGatewayProps) {
  const amount = bill.totalAmount - bill.paidAmount;
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [screen, setScreen] = useState<Screen>('method');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upi, setUpi] = useState('');
  const [bank, setBank] = useState(BANKS[0]);
  const [wallet, setWallet] = useState(WALLETS[0]);
  const [error, setError] = useState('');
  const [paymentId] = useState(`PAY${Date.now()}`);

  const formatCard = (val: string) => val.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const formatExpiry = (val: string) => {
    const d = val.replace(/\D/g,'').slice(0,4);
    return d.length >= 2 ? d.slice(0,2) + '/' + d.slice(2) : d;
  };

  const validate = () => {
    if (method === 'card') {
      if (card.number.replace(/\s/g,'').length < 16) return 'Enter valid 16-digit card number';
      if (card.expiry.length < 5) return 'Enter valid expiry date';
      if (card.cvv.length < 3) return 'Enter valid CVV';
      if (!card.name.trim()) return 'Enter cardholder name';
    }
    if (method === 'upi') {
      if (!upi.includes('@')) return 'Enter valid UPI ID (e.g. name@upi)';
    }
    return '';
  };

  const handlePay = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setScreen('processing');

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 2500));

    try {
      // Record payment in backend
      await api.put(`/billing/pay/${bill.id}`, { amount });
      setScreen('success');
      setTimeout(() => { onSuccess(); }, 3000);
    } catch {
      setScreen('failed');
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: '#f8fafc',
    border: '1.5px solid #e2e8f0', borderRadius: '8px',
    color: '#1e293b', fontSize: '14px', boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit',
  };

  // Processing screen
  if (screen === 'processing') return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }}>
      <div style={{ background:'white', borderRadius:'20px', padding:'48px 40px', textAlign:'center', width:'340px' }}>
        <div style={{ width:'64px', height:'64px', margin:'0 auto 20px', borderRadius:'50%', border:'4px solid #e2e8f0', borderTop:'4px solid #2563eb', animation:'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <h2 style={{ color:'#1e293b', margin:'0 0 8px', fontSize:'18px' }}>Processing Payment</h2>
        <p style={{ color:'#64748b', margin:0, fontSize:'14px' }}>Please wait, do not close this window...</p>
        <div style={{ marginTop:'20px', padding:'12px', background:'#f8fafc', borderRadius:'10px', fontSize:'13px', color:'#64748b' }}>
          Amount: <strong style={{ color:'#1e293b' }}>₹{amount}</strong>
        </div>
      </div>
    </div>
  );

  // Success screen
  if (screen === 'success') return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }}>
      <div style={{ background:'white', borderRadius:'20px', padding:'48px 40px', textAlign:'center', width:'360px' }}>
        <div style={{ width:'70px', height:'70px', margin:'0 auto 20px', borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px' }}>✅</div>
        <h2 style={{ color:'#16a34a', margin:'0 0 8px', fontSize:'22px' }}>Payment Successful!</h2>
        <p style={{ color:'#64748b', margin:'0 0 20px', fontSize:'14px' }}>Your payment has been processed successfully.</p>
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'12px', padding:'16px', textAlign:'left' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
            <span style={{ fontSize:'13px', color:'#64748b' }}>Amount Paid</span>
            <span style={{ fontSize:'13px', fontWeight:'700', color:'#16a34a' }}>₹{amount}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
            <span style={{ fontSize:'13px', color:'#64748b' }}>Payment ID</span>
            <span style={{ fontSize:'12px', color:'#1e293b', fontFamily:'monospace' }}>{paymentId}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:'13px', color:'#64748b' }}>Method</span>
            <span style={{ fontSize:'13px', color:'#1e293b', textTransform:'capitalize' }}>{method === 'card' ? 'Credit/Debit Card' : method.toUpperCase()}</span>
          </div>
        </div>
        <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:'16px' }}>Redirecting to dashboard...</p>
      </div>
    </div>
  );

  // Failed screen
  if (screen === 'failed') return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }}>
      <div style={{ background:'white', borderRadius:'20px', padding:'48px 40px', textAlign:'center', width:'340px' }}>
        <div style={{ width:'70px', height:'70px', margin:'0 auto 20px', borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px' }}>❌</div>
        <h2 style={{ color:'#dc2626', margin:'0 0 8px', fontSize:'22px' }}>Payment Failed</h2>
        <p style={{ color:'#64748b', margin:'0 0 24px', fontSize:'14px' }}>Something went wrong. Please try again.</p>
        <button onClick={() => setScreen('method')}
          style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'none', background:'#2563eb', color:'white', fontSize:'15px', fontWeight:'600', cursor:'pointer' }}>
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'16px' }}>
      <div style={{ background:'white', borderRadius:'20px', width:'100%', maxWidth:'480px', maxHeight:'90vh', overflowY:'auto', fontFamily:"'Segoe UI', sans-serif" }}>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🏥</div>
            <div>
              <div style={{ fontSize:'14px', fontWeight:'700', color:'#1e293b' }}>Pulse HMS</div>
              <div style={{ fontSize:'11px', color:'#94a3b8' }}>Secure Payment</div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'11px', color:'#64748b' }}>Amount to Pay</div>
            <div style={{ fontSize:'22px', fontWeight:'800', color:'#1e293b' }}>₹{amount}</div>
          </div>
        </div>

        {/* Security badge */}
        <div style={{ padding:'8px 24px', background:'#f0fdf4', display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontSize:'12px' }}>🔒</span>
          <span style={{ fontSize:'11px', color:'#16a34a' }}>256-bit SSL encrypted • 100% Secure</span>
        </div>

        <div style={{ padding:'20px 24px' }}>
          {/* Payment method tabs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'20px' }}>
            {([
              { id:'card',       icon:'💳', label:'Card' },
              { id:'upi',        icon:'📱', label:'UPI' },
              { id:'netbanking', icon:'🏦', label:'Netbanking' },
              { id:'wallet',     icon:'👛', label:'Wallet' },
            ] as {id: PaymentMethod; icon: string; label: string}[]).map(m => (
              <button key={m.id} onClick={() => { setMethod(m.id); setError(''); }}
                style={{ padding:'10px 4px', borderRadius:'10px', border: method===m.id ? '2px solid #2563eb' : '1.5px solid #e2e8f0', background: method===m.id ? '#eff6ff' : 'white', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                <span style={{ fontSize:'18px' }}>{m.icon}</span>
                <span style={{ fontSize:'11px', fontWeight:'600', color: method===m.id ? '#2563eb' : '#64748b' }}>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Card form */}
          {method === 'card' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div>
                <label style={{ display:'block', fontSize:'12px', color:'#64748b', marginBottom:'5px', fontWeight:'600' }}>CARD NUMBER</label>
                <input style={inp} placeholder="1234 5678 9012 3456" value={card.number}
                  onChange={e => setCard({...card, number: formatCard(e.target.value)})} maxLength={19} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'12px', color:'#64748b', marginBottom:'5px', fontWeight:'600' }}>CARDHOLDER NAME</label>
                <input style={inp} placeholder="Name on card" value={card.name}
                  onChange={e => setCard({...card, name: e.target.value})} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'12px', color:'#64748b', marginBottom:'5px', fontWeight:'600' }}>EXPIRY DATE</label>
                  <input style={inp} placeholder="MM/YY" value={card.expiry}
                    onChange={e => setCard({...card, expiry: formatExpiry(e.target.value)})} maxLength={5} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', color:'#64748b', marginBottom:'5px', fontWeight:'600' }}>CVV</label>
                  <input style={inp} placeholder="•••" type="password" value={card.cvv}
                    onChange={e => setCard({...card, cvv: e.target.value.replace(/\D/g,'').slice(0,4)})} maxLength={4} />
                </div>
              </div>
              <div style={{ padding:'10px 12px', background:'#eff6ff', borderRadius:'8px', fontSize:'12px', color:'#2563eb' }}>
                🧪 Test: Use any 16-digit number, future date, any CVV
              </div>
            </div>
          )}

          {/* UPI form */}
          {method === 'upi' && (
            <div>
              <label style={{ display:'block', fontSize:'12px', color:'#64748b', marginBottom:'5px', fontWeight:'600' }}>UPI ID</label>
              <input style={inp} placeholder="yourname@upi" value={upi} onChange={e => setUpi(e.target.value)} />
              <div style={{ marginTop:'16px' }}>
                <div style={{ fontSize:'12px', color:'#64748b', marginBottom:'10px', fontWeight:'600' }}>OR PAY VIA</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {['PhonePe','Google Pay','Paytm'].map(app => (
                    <button key={app} onClick={() => setUpi(`test@${app.toLowerCase().replace(' ','')}`)}
                      style={{ padding:'12px 6px', borderRadius:'10px', border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:'12px', fontWeight:'600', color:'#1e293b' }}>
                      {app === 'PhonePe' ? '💜' : app === 'Google Pay' ? '🔵' : '🔵'} {app}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginTop:'12px', padding:'10px 12px', background:'#eff6ff', borderRadius:'8px', fontSize:'12px', color:'#2563eb' }}>
                🧪 Test: Use any text with @ (e.g. test@upi)
              </div>
            </div>
          )}

          {/* Netbanking */}
          {method === 'netbanking' && (
            <div>
              <label style={{ display:'block', fontSize:'12px', color:'#64748b', marginBottom:'5px', fontWeight:'600' }}>SELECT BANK</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                {BANKS.map(b => (
                  <button key={b} onClick={() => setBank(b)}
                    style={{ padding:'12px', borderRadius:'10px', border: bank===b ? '2px solid #2563eb' : '1.5px solid #e2e8f0', background: bank===b ? '#eff6ff' : 'white', cursor:'pointer', fontSize:'12px', fontWeight: bank===b ? '600' : '400', color: bank===b ? '#2563eb' : '#1e293b', textAlign:'left' }}>
                    🏦 {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wallet */}
          {method === 'wallet' && (
            <div>
              <label style={{ display:'block', fontSize:'12px', color:'#64748b', marginBottom:'8px', fontWeight:'600' }}>SELECT WALLET</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px' }}>
                {WALLETS.map(w => (
                  <button key={w} onClick={() => setWallet(w)}
                    style={{ padding:'16px', borderRadius:'10px', border: wallet===w ? '2px solid #2563eb' : '1.5px solid #e2e8f0', background: wallet===w ? '#eff6ff' : 'white', cursor:'pointer', fontSize:'13px', fontWeight: wallet===w ? '700' : '400', color: wallet===w ? '#2563eb' : '#1e293b' }}>
                    👛 {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ color:'#dc2626', fontSize:'13px', marginTop:'12px', marginBottom:0 }}>⚠️ {error}</p>}

          {/* Pay button */}
          <button onClick={handlePay}
            style={{ width:'100%', padding:'14px', marginTop:'20px', borderRadius:'12px', border:'none', background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'white', fontSize:'16px', fontWeight:'700', cursor:'pointer', letterSpacing:'0.3px' }}>
            Pay ₹{amount} Securely →
          </button>

          <button onClick={onClose}
            style={{ width:'100%', padding:'10px', marginTop:'8px', borderRadius:'12px', border:'none', background:'transparent', color:'#94a3b8', fontSize:'13px', cursor:'pointer' }}>
            Cancel Payment
          </button>

          {/* Footer */}
          <div style={{ marginTop:'16px', display:'flex', justifyContent:'center', alignItems:'center', gap:'12px' }}>
            {['Visa', 'Mastercard', 'RuPay', 'UPI'].map(b => (
              <span key={b} style={{ fontSize:'10px', padding:'3px 8px', border:'1px solid #e2e8f0', borderRadius:'4px', color:'#94a3b8', fontWeight:'600' }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
