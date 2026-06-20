import React, { useState, useEffect } from "react";
import { 
  db 
} from "../firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { 
  Mail, 
  Send, 
  Inbox, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Loader2, 
  Search, 
  Check, 
  Clock, 
  ArrowRightLeft,
  Share2,
  RefreshCw,
  MailOpen,
  ArrowLeft
} from "lucide-react";
import { MailItem, UserProfile } from "../types";

interface MailAppProps {
  currentUser: UserProfile;
}

export default function MailApp({ currentUser }: MailAppProps) {
  const [activeSubTab, setActiveSubTab] = useState<"inbox" | "sent" | "write">("inbox");
  const [mails, setMails] = useState<MailItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Email Writing form states
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // AI Assistant Draft states
  const [aiDraftPrompt, setAiDraftPrompt] = useState("");
  const [generatingDraft, setGeneratingDraft] = useState(false);

  // Selected Mail inside inbox/sent view
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);

  // Real-time email sync
  useEffect(() => {
    setLoading(true);
    let q;
    if (activeSubTab === "inbox") {
      q = query(
        collection(db, "emails"), 
        where("to", "==", currentUser.email),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(
        collection(db, "emails"), 
        where("from", "==", currentUser.email),
        orderBy("timestamp", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emailList: MailItem[] = [];
      snapshot.forEach((doc) => {
        emailList.push({ id: doc.id, ...doc.data() } as MailItem);
      });
      
      // If inbox and empty, let's check if we should auto-seed standard systemic emails for this brand new user!
      if (emailList.length === 0 && activeSubTab === "inbox") {
        seedDefaultEmails();
      } else {
        setMails(emailList);
        setLoading(false);
      }
    }, (error) => {
      console.error("Firestore Mail listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeSubTab, currentUser.email]);

  const seedDefaultEmails = async () => {
    try {
      const defaultMails = [
        {
          from: "board@nexa-labs.com",
          fromName: "Nexa Labs 이사회 집행 위원회",
          to: currentUser.email,
          subject: "[중요] Nexa Portal 공식 가입 및 시큐어 노드 매치 완수 통보",
          body: `상임 이사회 결의 제24-102호에 근거하여, 귀하에게 Nexa Labs의 차세대 초지능 인공지능 'Astra AI' 포탈의 상급 연동 권한 및 전용 메일 솔루션을 공식 배부합니다.

현재 가동 중인 모델 2.5-Stable은 1.47 Trillion Parameters 밀도를 초고해상도로 학습한 메쉬 노드형 알고리즘입니다. 본 메일 포탈은 사내 전용 보안 회선으로 보호되며, 동료 파트너의 가상 메일주소(@nexa-labs.com)를 지정하여 내부 망을 실시간 연동할 수 있습니다.

환영의 보증으로, 본 포탈 내에서 AI 및 시네마 연동 실무를 완수하여 주십시오. 

- Nexa Labs 이사회 드림`,
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
          isRead: false,
          isSystem: true
        },
        {
          from: "astra.core@nexa-labs.com",
          fromName: "Astra AI 코어 마스터 노드",
          to: currentUser.email,
          subject: "System Health Report: Quantum Throughput Peak & Security Alert",
          body: `[SYSTEM COGNITIVE MONITOR REPORT]

현재 Astra AI의 클러스터 분산 파워 통계는 94.81 PetaFLOPs/s 수준의 초양자 임계값 안정 정렬을 달성하였습니다.

- GPU 임계 온도 제어: 45.2°C (정상)
- 분산 레이어 동기화 정합 지각 수치: 99.9997% (최적)
- 가용 메모리 밀도: 48,102 Gbps
- 현재 로그인 IP 회선보안: 계정 인지 통과 (보안 암호화 레이어 작동 완료)

본 메일 솔루션은 독자적인 클라우드 Firestore 영구 암호화 파이프라인과 완벽히 동기화되어, 사용자의 프롬프트 이미지, 비디오, 코드 생성 연산 이력이 즉각 백업 보존됩니다. Astra의 차고 넘치는 연산 리소스를 부담없이 누려보십시오.`,
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          isRead: false,
          isSystem: true
        },
        {
          from: "assistant@nexa-labs.com",
          fromName: "Astra AI 메일 자동 비서",
          to: currentUser.email,
          subject: "[AI 실무 가이드] 초고속 이메일 작성 비서 기능 도입 안내",
          body: `안녕하십니까, 귀하의 사내 커뮤니케이션 업무 효율을 폭증시키기 위해 상비 가동 중인 'Astra AI 메일 작성 비서'입니다.

메일 쓰기 탭 혹은 메일 수신 시 우상단에 위치한 'Astra AI 초고속 메일 작성 지원' 도구를 활용하여 보십시오. 작성할 간략한 한 줄 요지(예: "연봉 협상 성공에 대한 공손한 감사와 후속 미팅 조율")만 프롬프트 박스에 던지면, 저희 Astra Core가 기품 있는 비즈니스 어휘와 대하소설 같은 풍부한 격식을 결합하여 3초 만에 발송용 메일 전문을 완성합니다.

지금 바로 가치의 흐름을 연결하고 메일을 교환해보세요.`,
          timestamp: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
          isRead: false,
          isSystem: true
        }
      ];

      for (const m of defaultMails) {
        await addDoc(collection(db, "emails"), m);
      }
    } catch (e) {
      console.error("Failed to seed welcome emails:", e);
    }
  };

  // Mark email as read
  const handleSelectMail = async (mail: MailItem) => {
    setSelectedMail(mail);
    if (!mail.isRead && mail.to === currentUser.email) {
      try {
        await updateDoc(doc(db, "emails", mail.id), { isRead: true });
      } catch (e) {
        console.error("Failed to update read state:", e);
      }
    }
  };

  // Compose / Send Mail
  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim() || !body.trim()) return;

    setSending(true);
    setSendSuccess(false);

    try {
      const newEmail = {
        from: currentUser.email,
        fromName: currentUser.displayName,
        to: toEmail.trim().toLowerCase(),
        subject: subject.trim(),
        body: body.trim(),
        timestamp: new Date().toISOString(),
        isRead: false
      };

      await addDoc(collection(db, "emails"), newEmail);
      setSendSuccess(true);
      setSubject("");
      setBody("");
      setToEmail("");

      setTimeout(() => {
        setSendSuccess(false);
        setActiveSubTab("sent"); // Go to Outbox
      }, 1500);

    } catch (e: any) {
      alert("메일 전송에 실패했습니다: " + e.message);
    } finally {
      setSending(false);
    }
  };

  // AI draft assistant
  const handleGenerateAiDraft = async () => {
    if (!aiDraftPrompt.trim()) return;
    setGeneratingDraft(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `주제: "${aiDraftPrompt}". 이 주제를 바탕으로 최고급 비즈니스 품격을 가진 이메일 내용을 작성해주세요. 격식 있는 경어체와 한국어 구성으로 이력서, 제안서, 보고서 스타일로 알맞게 뼈대를 구상하고, '[제목]' 과 '[본문 내용]' 이라는 태그를 넣어 출력해 주세요. 이외의 부연 설명은 하지 마세요.`,
        }),
      });

      if (!res.ok) throw new Error("AI core unavailable.");
      const data = await res.json();
      const text = data.text;

      // Extract subject and body out if possible, else dump to body
      let extractedSubject = "";
      let extractedBody = "";

      if (text.includes("[제목]") || text.includes("제목:")) {
        const matches = text.match(/(?:\[제목\]|제목:)\s*(.*)\n/);
        if (matches && matches[1]) {
          extractedSubject = matches[1].replace(/[\[\]]/g, "").trim();
        }
      }

      const bodyMatch = text.split(/(?:\[본문 내용\]|\[본문\]|본문:)/);
      if (bodyMatch && bodyMatch[1]) {
        extractedBody = bodyMatch[1].trim();
      } else {
        extractedBody = text.replace(/\[제목\].*?\n/, "").replace(/\[본문\s*내용\]/, "").trim();
      }

      if (extractedSubject) setSubject(extractedSubject);
      setBody(extractedBody || text);
      setAiDraftPrompt("");
    } catch (e: any) {
      alert("AI 메일 임시 작성 실패: " + e.message);
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Delete email
  const handleDeleteMail = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("정말로 이 이메일을 영구 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "emails", id));
        if (selectedMail?.id === id) {
          setSelectedMail(null);
        }
      } catch (e: any) {
        alert("삭제에 실패했습니다: " + e.message);
      }
    }
  };

  const filteredMails = mails.filter(m => 
    m.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.fromName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.from.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="mail_app_container" className="flex-1 min-h-[calc(100vh-220px)] grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      {/* Mail Sub Nav Sidebar (3 cols) */}
      <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col gap-6 shadow-sm">
        <div>
          <span className="text-[#1a73e8] text-[10px] font-bold tracking-wider uppercase block mb-1">Nexa Security Matrix</span>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" /> 사내 메일 포탈
          </h3>
          <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-mono">
            {currentUser.email}
          </p>
        </div>

        {/* COMPOSER BANNER */}
        <button
          onClick={() => { setActiveSubTab("write"); setSelectedMail(null); }}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl tracking-wider transition flex items-center justify-center gap-2 hover:shadow-md cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>새 메일 작성 / AI 기획</span>
        </button>

        {/* FOLDER NAVIGATION */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => { setActiveSubTab("inbox"); setSelectedMail(null); }}
            className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
              activeSubTab === "inbox" 
                ? "bg-[#eaf1fb] text-blue-800 border border-blue-200/50" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-500" />
              <span>수신 편지함</span>
            </span>
            {activeSubTab === "inbox" && mails.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                {mails.filter(m => !m.isRead).length} Unread
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveSubTab("sent"); setSelectedMail(null); }}
            className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
              activeSubTab === "sent" 
                ? "bg-[#f8f0fc] text-purple-800 border border-purple-200/50" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-500" />
              <span>보낸 편지함</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {activeSubTab === "sent" ? mails.length : ""}
            </span>
          </button>
        </div>

        {/* INTERNALS */}
        <div className="mt-auto p-3.5 bg-[#f8fafc] border border-slate-100 rounded-2xl">
          <h4 className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-1">인프라 로우 정보</h4>
          <div className="text-[9px] text-slate-500 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Domain Mode:</span>
              <span className={currentUser.isCustomDomain ? "text-indigo-600 font-bold" : "text-emerald-600"}>
                {currentUser.isCustomDomain ? "NEXA_HOST" : "GUEST_GPN"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>DB Transport:</span>
              <span className="text-slate-700">Firestore Secure</span>
            </div>
          </div>
        </div>

      </div>

      {/* Mail list panel & Content pane (9 cols combined dynamically) */}
      <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[480px]">
        
        {/* Email Mailboxes view (5 cols if mail selected, 12 cols if none) */}
        <div className={`bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col shadow-sm transition-all duration-300 ${
          selectedMail || activeSubTab === "write" ? "md:col-span-5" : "md:col-span-12"
        }`}>
          {/* List Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                {activeSubTab === "inbox" ? "수신 메일 더미" : "발송 마스터 피드"}
              </h3>
              <span className="text-[10px] text-slate-400">총 {filteredMails.length}개의 발송본 매치</span>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="제목, 내용 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 w-full sm:w-48 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 transition"
              />
            </div>
          </div>

          {/* Email Item Scroll list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px]">
            {loading ? (
              <div className="text-center py-12 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-400 font-mono">Nexa Secure Gateway 덤프 처리 중...</span>
              </div>
            ) : filteredMails.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <MailOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">비치된 메일 데이터가 없습니다.</p>
                <p className="text-[10px] text-slate-400">동료 파트너에게 메일을 전송해 활성화해보세요.</p>
              </div>
            ) : (
              filteredMails.map((mail) => (
                <div
                  key={mail.id}
                  onClick={() => handleSelectMail(mail)}
                  className={`p-4 rounded-2xl border text-left transition relative cursor-pointer group ${
                    selectedMail?.id === mail.id 
                      ? "bg-slate-50 border-indigo-200/80 shadow-xs" 
                      : !mail.isRead && mail.to === currentUser.email
                      ? "bg-blue-50/40 border-blue-100/50 hover:bg-slate-50/50"
                      : "bg-[#fcfdfe] hover:bg-slate-50/50 border-slate-100"
                  }`}
                >
                  {/* Unread circle badge */}
                  {!mail.isRead && mail.to === currentUser.email && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600"></span>
                  )}

                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-800">
                          {mail.to === currentUser.email ? mail.fromName : `To: ${mail.to.split("@")[0]}`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono truncate">
                          &lt;{mail.to === currentUser.email ? mail.from : mail.to}&gt;
                        </span>
                      </div>
                      <h4 className={`text-xs truncate ${!mail.isRead && mail.to === currentUser.email ? "font-bold text-slate-900" : "text-slate-700"}`}>
                        {mail.subject}
                      </h4>
                    </div>
                    
                    <div className="flex items-center gap-2 self-start shrink-0">
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(mail.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        onClick={(e) => handleDeleteMail(e, mail.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-slate-100 transition shrink-0"
                        title="메일 데이터 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Interactive Workspace side pane (7 cols if open) */}
        <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col shadow-sm relative overflow-hidden transition-all duration-300">
          
          {/* WRITE NEW MAIL INTERFACE */}
          {activeSubTab === "write" ? (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-blue-600" /> 신규 메일 디스패치
                    </h3>
                    <span className="text-[10px] text-slate-400">사내 전용 데이터망 암호화 발송</span>
                  </div>
                  <button 
                    onClick={() => setActiveSubTab("inbox")}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:bg-slate-100 px-2.5 py-1 rounded-full transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> 뒤로가기
                  </button>
                </div>

                {/* AI Draft Assist Panel */}
                <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 border border-blue-100 p-4 rounded-2xl mb-5 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-50/10" />
                    <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Astra AI 초고속 메일 작성 비서</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">작성하려는 메일 핵심 문맥을 기재하십시오. 흠잡을 데 없는 최상급 비즈니스 품격 양식으로 subject와 body를 정렬해 드립니다.</p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="예시: 사내 이메일 감사 요청 안내, 신규 계약 성사에 대한 축하 보고..."
                      value={aiDraftPrompt}
                      onChange={(e) => setAiDraftPrompt(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 text-slate-800"
                    />
                    <button
                      type="button"
                      disabled={generatingDraft || !aiDraftPrompt.trim()}
                      onClick={handleGenerateAiDraft}
                      className="px-3 py-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shrink-0 disabled:opacity-50"
                    >
                      {generatingDraft ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>Draft</span>
                    </button>
                  </div>
                </div>

                {/* Email Inputs */}
                <form onSubmit={handleSendMail} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">수신자 메일 주소</label>
                    <input
                      type="email"
                      required
                      placeholder="예시: colleague@nexa-labs.com 또는 외부 이메일"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">이메일 제목</label>
                    <input
                      type="text"
                      required
                      placeholder="업무 지시서 보고 혹은 협조 요청 등"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">본문 내용</label>
                    <textarea
                      rows={8}
                      required
                      placeholder="내용을 채우시거나 위 Astra AI 자동 제어로 시작하십시오..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-300" /> 발송 데이터 암호화 저장 처리 예정
                    </span>
                    
                    <button
                      type="submit"
                      disabled={sending || !toEmail.trim() || !subject.trim() || !body.trim()}
                      className="px-5 py-3 bg-[#111827] hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>전송 정렬 중...</span>
                        </>
                      ) : sendSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">임계 전송 완수</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>보안 메일 전송</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : selectedMail ? (
            /* VIEW SELECTED EMAIL */
            <div className="h-full flex flex-col justify-between">
              <div className="space-y-6">
                
                {/* Mail header details */}
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h2 className="text-sm font-bold text-slate-900">{selectedMail.subject}</h2>
                    <button
                      onClick={() => setSelectedMail(null)}
                      className="p-1 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-semibold transition shrink-0"
                    >
                      닫기
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="text-slate-700">
                      <span className="text-slate-400 mr-2 font-semibold">보낸사람:</span>
                      <span className="font-bold text-slate-800">{selectedMail.fromName}</span> 
                      <span className="text-slate-400 text-[11px] font-mono ml-1">&lt;{selectedMail.from}&gt;</span>
                    </div>
                    <div className="text-slate-400 font-mono text-[10px]">
                      {new Date(selectedMail.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 mt-1">
                    <span className="text-slate-400 mr-2 font-semibold">받은사람:</span>
                    <span className="font-mono text-slate-700">{selectedMail.to}</span>
                  </div>
                </div>

                {/* Mail Body render */}
                <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100 min-h-[220px] overflow-y-auto">
                  {selectedMail.body}
                </div>

              </div>

              {/* Action bar for active mail */}
              <div className="border-t border-slate-100 pt-4 flex justify-between items-center gap-3">
                <span className="text-[10px] text-slate-400 block font-mono">
                  Origin node: {selectedMail.isSystem ? "SYSTEM_SEEDED" : "USER_DELIVERD"}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setToEmail(selectedMail.from);
                      setSubject(`Re: ${selectedMail.subject}`);
                      setBody(`\n\n----- Original Message -----\nFrom: ${selectedMail.fromName} <${selectedMail.from}>\nReceived: ${new Date(selectedMail.timestamp).toLocaleString()}\n\n${selectedMail.body}`);
                      setActiveSubTab("write");
                      setSelectedMail(null);
                    }}
                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>회신하기 (Reply)</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* PLACEHOLDER WHEN NOTHING SELECTED */
            <div className="h-full flex flex-col justify-center items-center text-center text-slate-400 p-8 min-h-[300px]">
              <div className="inline-flex p-4 rounded-full bg-slate-50 border border-slate-100 mb-3 animate-pulse">
                <Mail className="w-10 h-10 text-slate-300" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 tracking-wide uppercase">편지 읽기 샌드박스</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                왼쪽 편지 리스트에서 메일을 선택하여 내용을 판독하거나, 상단의 "새 메일 작성 / AI 기획"을 통해 암호화 서신 패킷을 전송해 보십시오.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
