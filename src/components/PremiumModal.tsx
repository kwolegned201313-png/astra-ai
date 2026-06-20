import React, { useState } from "react";
import { 
  X, 
  Check, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  Award, 
  Heart,
  Loader2,
  Copy,
  Wallet,
  RefreshCw,
  QrCode,
  Globe
} from "lucide-react";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reason?: string; // e.g. "이미지 생성 한도 도달" or "시네마 엔진 한도 도달"
}

export default function PremiumModal({ isOpen, onClose, onSuccess, reason }: PremiumModalProps) {
  const [step, setStep] = useState<"plans" | "pay">("plans");
  const [payMethod, setPayMethod] = useState<"bank" | "card">("bank");
  const [currency, setCurrency] = useState<"KRW" | "USD">("KRW");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Simulated Bank Selection
  const [copied, setCopied] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [bankStep, setBankStep] = useState<"idle" | "checking" | "found">("idle");
  const [bankCheckMsg, setBankCheckMsg] = useState("");

  // Payment Form States (Card)
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [agreed, setAgreed] = useState(true);

  if (!isOpen) return null;

  // Constants
  const krwPrice = 20000;
  const exchangeRate = 1350; // ₩1,350 = $1 USD
  const usdPrice = (krwPrice / exchangeRate).toFixed(2); // ~$14.81

  // Copy bank account number
  const handleCopyAccount = () => {
    navigator.clipboard.writeText("1000-8035-3159");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      alert(currency === "KRW" ? "결제 정보를 모두 기재해 주세요." : "Please enter all billing details.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        setSuccess(false);
        setStep("plans");
        onClose();
      }, 2500);
    }, 2000);
  };

  // Simulated live bank transfer ledger sensor
  const triggerBankDepositCheck = () => {
    if (!senderName.trim()) {
      alert(currency === "KRW" ? "보내시는 분 본명을 기재해 주세요." : "Please enterprise your authentic sender name.");
      return;
    }
    setBankStep("checking");
    setBankCheckMsg(currency === "KRW" ? "국내 스마트 뱅킹 분산 원장 연동망 구성 중..." : "Connecting to swift wire clearance grid...");
    
    setTimeout(() => {
      setBankCheckMsg(
        currency === "KRW" 
          ? `토스뱅크 실시간 입금 대기행렬 분석 중 (목표: ${senderName} / ₩20,000)...` 
          : `Toss Bank ledger monitoring in progress (Targeting: ${senderName} / $${usdPrice})...`
      );
      
      setTimeout(() => {
        setBankCheckMsg(
          currency === "KRW" 
            ? `토스뱅크 1000-8035-3159 예치 계좌 입금 트랜잭션 수립 완료!` 
            : `Toss Bank 1000-8035-3159 transaction matching verified!`
        );
        
        setTimeout(() => {
          setBankStep("found");
          setSuccess(true);
          setTimeout(() => {
            onSuccess();
            setSuccess(false);
            setStep("plans");
            setBankStep("idle");
            setSenderName("");
            onClose();
          }, 2500);
        }, 1200);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Premium Core Visuals */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-[#0c1033] via-[#10195e] to-[#251249] p-8 text-white flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                </div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-200 uppercase">Astra Premium</span>
              </div>
              
              {/* Currency Selector */}
              <button 
                onClick={() => setCurrency(currency === "KRW" ? "USD" : "KRW")}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full px-2.5 py-1 text-[9px] font-bold transition cursor-pointer"
              >
                <Globe className="w-3 h-3" />
                <span>{currency}</span>
              </button>
            </div>

            <div>
              {reason ? (
                <div className="inline-block px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-md text-[10px] text-red-300 font-bold uppercase mb-2 animate-pulse">
                  ⚠️ {reason}
                </div>
              ) : (
                <div className="inline-block px-2.5 py-1 bg-violet-400/10 border border-violet-400/20 rounded-md text-[10px] text-violet-300 font-bold uppercase mb-2">
                  🚀 {currency === "KRW" ? "제한 없는 각성 권한" : "LIMITED ACCESS OVER"}
                </div>
              )}
              <h2 className="text-xl font-bold tracking-tight">
                {currency === "KRW" ? (
                  <>이용 한도 초과 및<br/>Astra 초지능 각성 패스</>
                ) : (
                  <>Computation Cap Hit<br/>Astra Super-Intelligence Pass</>
                )}
              </h2>
              <p className="text-xs text-indigo-200/80 mt-2 leading-relaxed">
                {currency === "KRW" ? (
                  "기본 제공되는 시뮬레이션 연산량이 모두 소진되었습니다. 무제한 다차원 메쉬 생성을 잠금해제해 보세요."
                ) : (
                  "All free simulated computing cycles consumed. Activate professional mesh pipeline for raw multi-modal speed."
                )}
              </p>
            </div>

            <div className="space-y-3.5 pt-4 border-t border-white/10">
              <div className="flex items-start gap-2.5">
                <Check className="w-3.5 h-3.5 text-indigo-300 shrink-0 mt-0.5" />
                <span className="text-xs text-indigo-100">
                  {currency === "KRW" ? "Imagen 3 Ultra 무제한 고해상도 이미지 생성" : "Imagen 3 Ultra Unlimited Studio synthesis"}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-3.5 h-3.5 text-indigo-300 shrink-0 mt-0.5" />
                <span className="text-xs text-indigo-100">
                  {currency === "KRW" ? "CineMax 4K 영화급 비디오 루프 무한 설계" : "CineMax 4K Cinematic loops generation"}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-3.5 h-3.5 text-indigo-300 shrink-0 mt-0.5" />
                <span className="text-xs text-indigo-100">
                  {currency === "KRW" ? "사내 보안 메일 연동 탭 및 실시간 Firestore 동기화" : "Enterprise Secure Mail Sync & cloud Firestore records"}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-3.5 h-3.5 text-indigo-300 shrink-0 mt-0.5" />
                <span className="text-xs text-indigo-100">
                  {currency === "KRW" ? "우선권 메쉬 라우팅으로 AI 응답 속도 극진 처리" : "Priority Mesh Routing for instant AI responsiveness"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] text-indigo-200/60 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fully Encrypted 256-bit Secure Tunnel</span>
          </div>
        </div>

        {/* Right Side: Plans & Sandbox Pay Flow */}
        <div className="w-full md:w-7/12 p-8 flex flex-col justify-between bg-slate-50/50">
          
          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 animate-fade-in animate-duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-500 animate-bounce">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {currency === "KRW" ? "결제 완료 및 프리미엄 활성화!" : "Payment Verified & Upgraded!"}
              </h3>
              <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                {currency === "KRW" ? (
                  "축하합니다! 이제 Astra AI의 모든 한도가 해제되었습니다. 정밀 멀티모달 프롬프트와 비디오 무제한 연산 혜택을 마음껏 누리십시오."
                ) : (
                  "Congratulations! All constraints have been dissolved. Enjoy uncapped multi-modal rendering at scale."
                )}
              </p>
            </div>
          ) : step === "plans" ? (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {currency === "KRW" ? "요금제 선택" : "CHOOSE YOUR PASS"}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-0.5">
                  {currency === "KRW" ? "글로벌 등급으로 더 강력한 성능" : "Humble pricing, enterprise grade performance"}
                </h3>
                
                {/* Single Plan Card */}
                <div className="bg-white border-2 border-indigo-600 rounded-2xl p-4 mt-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg tracking-wider font-mono">
                    GLOBAL ACCESS
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Astra AI Unlimited Pass</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {currency === "KRW" ? "모든 미디어 제작 도구 1년간 무제한 가동 승인" : "Dissolve computing throttles for 1 full year"}
                      </p>
                    </div>
                    <div className="text-right">
                      {currency === "KRW" ? (
                        <>
                          <span className="text-base font-bold text-indigo-600">₩20,000</span>
                          <span className="text-[10px] text-slate-400 block">/ 1년 무제한</span>
                        </>
                      ) : (
                        <>
                          <span className="text-base font-bold text-indigo-600">${usdPrice} USD</span>
                          <span className="text-[10px] text-slate-400 block">/ 1 Year</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Developer Direct Sponsor Benefit Section */}
                <div className="mt-5 bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                    <Heart className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
                    <span>
                      {currency === "KRW" ? "개발 주최자 직접 입금 후원" : "Direct Creator Sponsorship Benefit"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-normal mt-1.5">
                    {currency === "KRW" ? (
                      <>해당 결제 구조는 주최자 개인 계좌인 수신 통장과 전면 동기화되어, <span className="underline font-semibold text-slate-800">발송하신 모든 금액이 개발자에게 다이렉트로 전달</span>됩니다. 성원을 보태주시면 큰 힘이 됩니다.</>
                    ) : (
                      <>This secure gateway connects directly with the developer's core Toss account. <span className="underline font-semibold text-slate-800">100% of these proceeds go directly to supporting the original creator</span> of this platform.</>
                    )}
                  </p>
                  <div className="mt-2.5 text-[9px] text-slate-500 font-mono bg-white/70 rounded-lg p-2.5 border border-amber-100 flex flex-col gap-1">
                    <div>
                      • {currency === "KRW" ? "입금 수신 계좌:" : "Receiving Bank Account:"}{" "}
                      <span className="font-bold text-slate-900 bg-white px-1 py-0.5 rounded border border-slate-100">
                        토스뱅크 1000-8035-3159
                      </span>
                    </div>
                    <div>
                      • {currency === "KRW" ? "예금주:" : "Account Holder:"} <span className="font-bold text-slate-800">김우신 (Kim Wooshin / Nexa Labs)</span>
                    </div>
                    <div>
                      • {currency === "KRW" ? "이용 기간 및 요금:" : "Duration & Fee:"}{" "}
                      <span className="font-bold text-indigo-600">{currency === "KRW" ? "1년 무제한이용 / ₩20,000" : "1 Year Unlimited / $" + usdPrice + " USD"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => setStep("pay")}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md hover:scale-[1.01]"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>
                    {currency === "KRW" ? "인공지능 즉시 업그레이드 진행하기" : "Proceed to Secure Check-Out"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-2xl hover:bg-slate-200 transition text-center cursor-pointer"
                >
                  {currency === "KRW" ? "나중에 할게요" : "Decide later"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between h-full">
              <div>
                {/* Method selector tab */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl mb-4 text-center">
                  <button
                    type="button"
                    onClick={() => setPayMethod("bank")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${payMethod === "bank" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    🏦 {currency === "KRW" ? "스마트 인터넷 뱅킹 송금" : "Direct Bank Wire Transfer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("card")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${payMethod === "card" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    💳 {currency === "KRW" ? "간편 신용카드 결제" : "International Card Link"}
                  </button>
                </div>

                {payMethod === "bank" ? (
                  /* BANK WIRE TRANSFER WITH DYNAMIC USER INFORMATION */
                  <div className="space-y-4 animate-fade-in text-slate-800">
                    <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase block">
                      {currency === "KRW" ? "대한민국 시큐어 뱅크 실시간 중계망" : "Global Automated Escrow Grid"}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-slate-600" />{" "}
                      {currency === "KRW" ? "인터넷 자동입금 감지 정합 처리" : "Instant Inflow Detection Sync"}
                    </h3>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {currency === "KRW" ? (
                        "모바일 뱅킹(토스, 카카오뱅크 등) 또는 인터넷 뱅킹을 이용해 지정된 토스뱅크 개인 계좌로 송금해 주세요. 스마트 입글 원장이 자동 매칭을 처리합니다."
                      ) : (
                        "Initiate a domestic or wire transfer with your mobile bank application to the verified developer Toss Bank account to allow dynamic ledger matching."
                      )}
                    </p>

                    {/* Highly aesthetic account copycard with interactive UI */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                      <div className="absolute bottom-1 right-1 opacity-10">
                        <QrCode className="w-20 h-20 text-indigo-900" />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {currency === "KRW" ? "수신처 계좌 정보" : "PAYEE DETAILS"}
                        </span>
                        <span className="text-[9px] bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                          {currency === "KRW" ? "감지 자동화 작동 중" : "LEDGER MATCH DEPLOYED"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div className="text-xs text-slate-500">{currency === "KRW" ? "지정 은행:" : "Bank Brand:"}</div>
                        <div className="col-span-2 text-xs font-bold flex items-center gap-1.5">
                          <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
                          토스뱅크 (Toss Bank)
                        </div>

                        <div className="text-xs text-slate-500">{currency === "KRW" ? "보안 계좌번호:" : "Account Number:"}</div>
                        <div className="col-span-2 flex items-center justify-between">
                          <span className="text-sm font-mono font-bold text-slate-850 bg-white border border-slate-100/80 px-1.5 py-0.5 rounded select-all">1000-8035-3159</span>
                          <button
                            type="button"
                            onClick={handleCopyAccount}
                            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 select-none transition cursor-pointer ${copied ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copied ? (currency === "KRW" ? "복사완료" : "Copied!") : (currency === "KRW" ? "복사" : "Copy")}</span>
                          </button>
                        </div>

                        <div className="text-xs text-slate-500">{currency === "KRW" ? "자산 수신 예금주:" : "Account Holder:"}</div>
                        <div className="col-span-2 text-xs font-bold text-slate-800">
                          김우신 (Kim Wooshin / Nexa Labs 대표)
                        </div>

                        <div className="text-xs text-slate-500">{currency === "KRW" ? "지정 청구 총액:" : "Final Charge Amount:"}</div>
                        <div className="col-span-2 text-sm font-extrabold text-indigo-600">
                          {currency === "KRW" ? "₩20,000" : `$${usdPrice} USD`}{" "}
                          <span className="text-[9px] font-normal text-slate-400">
                            {currency === "KRW" ? "(자유 응원액 추가 가능)" : "(Arbitrary support accepted)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Auto matching setup */}
                    {bankStep === "idle" && (
                      <div className="bg-slate-100/70 rounded-2xl p-4.5 space-y-3 border border-slate-200/50">
                        <div className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
                          <RefreshCw className="w-4 h-4 text-indigo-600 font-mono" />
                          <span>
                            {currency === "KRW" ? "송금자 입금 정합 매칭 정보" : "Sender Verification Profile"}
                          </span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            {currency === "KRW" ? "보내신 분 본명 (자동 확인용)" : "Legal Name of the Sender"}
                          </label>
                          <input 
                            type="text" 
                            placeholder={currency === "KRW" ? "예: 홍길동 (입금자 성함과 일치 요망)" : "e.g. John Doe (must match your banking name)"}
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>

                        {/* Link scheme fast guides */}
                        {currency === "KRW" && (
                          <div className="flex flex-col gap-1.5 mt-2.5">
                            <span className="text-[10px] font-bold text-slate-400 block">원터치 스마트 뱅킹 바로가기</span>
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <a 
                                href="supertoss://send?bank=토스뱅크&account=100080353159&amount=20000"
                                onClick={() => {
                                  setTimeout(() => {
                                    alert("모바일에서 클릭시 토스(Toss) 앱으로 수단 주소 및 20,000원 계좌이체가 즉시 로딩됩니다.\n\n토스뱅크: 1000-8035-3159");
                                  }, 100);
                                }}
                                className="text-[11px] font-bold border border-blue-200 text-blue-600 bg-blue-50/50 py-2 rounded-xl hover:bg-blue-50 transition block cursor-pointer"
                              >
                                🔵 토스 (Toss) 즉시 송금
                              </a>
                              <a 
                                href="kakaotalk://send"
                                onClick={() => {
                                  setTimeout(() => {
                                    alert("카카오뱅크 또는 선호 메신저 자산 전송망을 가동해 송금해 주세요.\n\n수신계좌: 토스뱅크 1000-8035-3159");
                                  }, 100);
                                }}
                                className="text-[11px] font-bold border border-yellow-200 text-yellow-800 bg-yellow-50 py-2 rounded-xl hover:bg-yellow-105 transition block cursor-pointer"
                              >
                                🟡 카카오 간편 송금
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Checking active process */}
                    {bankStep === "checking" && (
                      <div className="bg-[#1a237e]/5 border border-indigo-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <h4 className="text-xs font-bold text-indigo-900 font-mono tracking-wider">
                          {currency === "KRW" ? "스마트 뱅킹 이중 감지원장 서칭" : "SCANNING LEDGER ARRAYS"}
                        </h4>
                        <p className="text-[11px] text-slate-500 max-w-xs">{bankCheckMsg}</p>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                          <div className="bg-indigo-600 h-full animate-pulse transition-all duration-300" style={{ width: "70%" }}></div>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  /* CARD FORM */
                  <form onSubmit={handleSimulatedPayment} className="space-y-3.5 animate-fade-in text-slate-800">
                    <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase block">
                      {currency === "KRW" ? "글로벌 게이트웨이 보안 전산" : "SECURE GLOBAL TRANSACT GATEWAY"}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-slate-600" />{" "}
                      {currency === "KRW" ? "간편 신용카드 결제 매칭" : "Card Billing Information"}
                    </h3>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        {currency === "KRW" ? "소유주 영문 성함" : "Cardholder Legal Name"}
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="NAME ON CARD (e.g. HONG GILDONG)"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        {currency === "KRW" ? "카드 번호" : "Card Account Number"}
                      </label>
                      <input 
                        type="text" 
                        required
                        maxLength={19}
                        placeholder="0000 - 0000 - 0000 - 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9-]/g, ""))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          {currency === "KRW" ? "유효 기간" : "Expiration Month/Year"}
                        </label>
                        <input 
                          type="text" 
                          required
                          maxLength={5}
                          placeholder="MM / YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          CVV 보안코드
                        </label>
                        <input 
                          type="password" 
                          required
                          maxLength={3}
                          placeholder={currency === "KRW" ? "카드 뒤 3자리" : "3 digits"}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ""))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="checkbox" 
                        id="premium_payment_terms" 
                        checked={agreed} 
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <label htmlFor="premium_payment_terms" className="text-[10px] text-slate-500 cursor-pointer select-none leading-normal">
                        {currency === "KRW" ? (
                          `자동 연장 결제 조항 승인 및 모의 영수증 발행 동의 (Astra AI ₩20,000)`
                        ) : (
                          `I authorization automated membership and ledger billing for Astra AI Unlimited ($${usdPrice} USD)`
                        )}
                      </label>
                    </div>
                  </form>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-2.5">
                {payMethod === "bank" ? (
                  bankStep !== "checking" && (
                    <button
                      type="button"
                      onClick={triggerBankDepositCheck}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      <span>
                        {currency === "KRW" ? "송금 완료했습니다 - 실시간 입금확인하기" : "Transfer complete - Scan bank receipt"}
                      </span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleSimulatedPayment}
                    disabled={loading || !agreed}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                        <span>
                          {currency === "KRW" ? "보안 결제 수단 승인 처리 중..." : "Verifying secure payment grids..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>
                          {currency === "KRW" ? `20,000원 결제하고 즉시 업그레이드` : `Complete Transact of $${usdPrice} USD`}
                        </span>
                      </>
                    )}
                  </button>
                )}
                
                {bankStep !== "checking" && (
                  <button
                    type="button"
                    onClick={() => setStep("plans")}
                    className="w-full py-2.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-2xl hover:bg-slate-200 transition text-center cursor-pointer"
                  >
                    {currency === "KRW" ? "이전 단계로" : "Go Back"}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
