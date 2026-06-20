import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Sparkles,
  Image as ImageIcon,
  Video,
  Code,
  Activity,
  Send,
  Loader2,
  Compass,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Upload,
  X,
  Film,
  LogOut,
  Mail,
  User,
  Shield,
  Clock,
  Terminal,
  Play,
  Lock,
  Award,
  Zap
} from "lucide-react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AuthScreen from "./components/AuthScreen";
import MailApp from "./components/MailApp";
import PremiumModal from "./components/PremiumModal";
import { Message, ImageResult, VideoResult, CodeResult, TelemetryMetrics, UserProfile } from "./types";

const GuestLockScreen = ({ tabName, onProceedToLogin }: { tabName: string; onProceedToLogin: () => void }) => {
  return (
    <div className="flex-1 max-w-2xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/60 p-8 text-center shadow-md my-12 flex flex-col justify-center items-center py-16 z-10 relative">
      <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-indigo-500" />
      </div>
      <span className="text-[10px] font-bold tracking-[0.2em] text-[#1a73e8] uppercase mb-2">INTEGRATION REQUIRED</span>
      <h2 className="text-lg font-bold tracking-tight text-slate-800 mb-3">
        {tabName} 기능은 넥사 보안 계정 연동이 필요합니다
      </h2>
      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-8">
        현재 대화 전용 게스트 임시 세션으로 접속 중입니다. 동료들과의 {tabName}, 실시간 Firestore 클라우드 백업, AI 시각 그래픽 발전소, 영화적 시네마 영상 연산, 코드 샌드박스 등의 전 기능 배부 상태를 이용하시려면 Nexa Labs 간편 로그인을 완료해 주세요.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs">
        <button
          onClick={onProceedToLogin}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-xs transition shadow-sm cursor-pointer"
        >
          정식 보안 계정으로 연결하기
        </button>
      </div>
    </div>
  );
};

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Premium Subscription & Limit States
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("astra_is_premium") === "true";
  });
  const [genCount, setGenCount] = useState<number>(() => {
    return Number(localStorage.getItem("astra_gen_count") || "0");
  });
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumReason, setPremiumReason] = useState("");

  const checkPremiumLimit = (actionName: string): boolean => {
    if (isPremium) return true;
    if (genCount >= 3) {
      setPremiumReason(`${actionName} 생성 한도(총 3회)에 도달했습니다. 무제한 가동을 위해 프리미엄 등급으로 도약하세요!`);
      setIsPremiumModalOpen(true);
      return false;
    }
    return true;
  };

  const incrementGenCount = () => {
    const nextCount = genCount + 1;
    setGenCount(nextCount);
    localStorage.setItem("astra_gen_count", String(nextCount));
  };

  const handleUpgradeSuccess = async () => {
    setIsPremium(true);
    localStorage.setItem("astra_is_premium", "true");

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const premiumUntil = expiryDate.toISOString();

    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, {
          isPremium: true,
          premiumUntil: premiumUntil
        }, { merge: true });
        
        setCurrentUser(prev => prev ? { ...prev, isPremium: true, premiumUntil } : null);
      } catch (e) {
        console.warn("Could not sync premium flag to firestore profile:", e);
      }
    }
  };

  // Navigation Tabs
  const [activeTab, setActiveTab ] = useState<"chat" | "mail" | "image" | "video" | "code" | "telemetry">("chat");

  // Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요. Nexa Labs의 차세대 초지능 인공지능 플랫폼, **Astra AI**입니다.\n궁금한 사항을 편안하게 질문하시거나 아래 탭을 이용해 창의적인 미디어 생성 작업을 시작해보세요.\n\n* **고성능 대화**: 다양한 전문 지식 상담 및 멀티모달 이미지 분석\n* **시각 스튜디오**: 현실보다 더 선명한 고품질 이미지 생성\n* **시네마 엔진**: 시나리오 콘티와 함께 생성하는 맞춤형 영화급 비디오 루프\n* **라이브 샌드박스**: 원하는 사양의 컴포넌트 실시간 인터랙션 코딩 웹페이지 구현",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatImageBase64, setChatImageBase64] = useState<string | null>(null);
  const [chatImageMimeType, setChatImageMimeType] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Studio States
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageHistory, setImageHistory] = useState<ImageResult[]>([
    {
      imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80",
      originalPrompt: "Abstract soft pastel glassmorphic shape",
      expandedPrompt: "A minimal elegant glassmorphic abstract structure hovering over a calm white linen background, with soft pastel blue and gold gradients, pristine focus, warm volumetric studio light.",
      isRealGen: false,
      timestamp: "14:10"
    }
  ]);
  const [selectedImageResult, setSelectedImageResult] = useState<ImageResult | null>(null);

  // Video States
  const [videoPrompt, setVideoPrompt] = useState("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoResult | null>({
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-rotating-planet-earth-in-space-11116-large.mp4",
    prompt: "An elegant panning shot of a cosmic blue stellar planet",
    storyboard: `### NEXA CINEMA FRAMEWORK REPORT
**시퀀스 연출안:**
우주공간의 성운 무리를 배경으로 하여 한 행성이 신비롭고 영롱한 푸른빛 메쉬를 발산하며 자전하고 있습니다. 미세한 반짝임과 먼지 파티클이 빛과 교차하며 몽환적 구도를 자아냅니다.

**카메라 조작 및 라이팅:**
Anamorphic 렌더링, 심도가 넓고 차분하게 천천히 우측으로 패닝(Panning)하는 와이드 시네마틱 앵글.

**사운드 테마:**
고요하고 정제된 뉴에이지 앰비언트 성향의 잔잔한 신디사이저 패드 사운드.`,
    category: "space",
    timestamp: "14:15"
  });

  // Code Gen States
  const [codePrompt, setCodePrompt] = useState("A beautiful interactive calculator for eco friendly carbon footprint tracking");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<CodeResult | null>({
    request: "Carbon footprint calculator",
    htmlCode: `<!DOCTYPE html>
<html lang="ko">
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet font-sans">
  <style>
    body { font-family: 'Outfit', sans-serif; background: #f8fafc; color: #1e293b; }
  </style>
</head>
<body class="p-8 flex items-center justify-center min-h-screen">
  <div class="max-w-md w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
    <div class="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
    
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-indigo-500 flex items-center justify-center font-bold text-white text-lg">E</div>
      <div>
        <h3 class="text-sm font-bold text-slate-800 tracking-wide text-xs uppercase text-slate-400 leading-none">Nexa Sandbox</h3>
        <p class="text-lg font-bold text-slate-800">친환경 탄소 발자국 계산기</p>
      </div>
    </div>
    
    <div class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">월간 대중교통 이용 비율 (%)</label>
        <input id="transportInput" type="range" min="0" max="100" value="40" class="w-full accent-emerald-500 cursor-pointer">
      </div>
      
      <div class="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
        <div class="flex justify-between text-sm text-slate-600 mb-1">
          <span>예상 탄소 배출 감소량</span>
          <span id="reductionScore" class="text-emerald-600 font-bold">120 kg CO₂</span>
        </div>
        <div class="text-xs text-slate-500 leading-relaxed">이 설정은 소나무 약 <span id="treesSaved" class="text-indigo-600 font-bold">9그루</span>를 심는 긍정적인 자연 환원 효과를 낳습니다.</div>
      </div>

      <button onclick="commitAction()" class="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition">
        지속 가능한 가치 정렬 확인
      </button>
    </div>
  </div>

  <script>
    const slider = document.getElementById('transportInput');
    const reductionScore = document.getElementById('reductionScore');
    const treesSaved = document.getElementById('treesSaved');
    
    function calculate() {
      const val = parseInt(slider.value);
      const score = val * 3;
      reductionScore.innerText = score + " kg CO₂";
      const trees = Math.round(score / 14);
      treesSaved.innerText = trees + "그루";
    }
    
    slider.addEventListener('input', calculate);
    
    function commitAction() {
      alert("지속 가능한 가치 투자가 성공적으로 정렬되었습니다! 지구 살리기에 함께해주셔서 감사합니다.");
    }
  </script>
</body>
</html>`,
    timestamp: "14:18"
  });
  const [codeCopied, setCodeCopied] = useState(false);

  // Telemetry States
  const [metrics, setMetrics] = useState<TelemetryMetrics>({
    quantumThroughput: "94.81",
    averageLatency: "112",
    gpuCoreUtilization: "76.4",
    modelWeightDensity: "1.47 Trillion Parameters",
    nexaMeshSyncRate: "99.9997%",
    clusterRegions: ["Seoul Cloud Alpha", "Silicon Valley Prime", "Frankfurt Sector 4"]
  });
  const [isRefreshingTelemetry, setIsRefreshingTelemetry] = useState(false);

  // Firestore getDoc helper with strict low-latency fallback (fixes long loading times under laggy/offline conditions)
  const getDocWithTimeout = async (docRef: any, timeoutMs = 1000) => {
    return Promise.race([
      getDoc(docRef),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firestore operation timed out")), timeoutMs)
      )
    ]);
  };

  // Handle Firebase Auth changes
  useEffect(() => {
    // Check local simulated user session first
    const savedSimUser = localStorage.getItem("astra_sim_user");
    if (savedSimUser) {
      try {
        const parsed = JSON.parse(savedSimUser);
        if (parsed && parsed.uid) {
          setCurrentUser(parsed);
          setAuthLoading(false);
          return;
        }
      } catch (err) {
        console.error("Failed to restore simulated user:", err);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Avoid overwriting simulated session
      if (localStorage.getItem("astra_sim_user")) {
        setAuthLoading(false);
        return;
      }

      if (user) {
        // Logged in
        try {
          const userDoc = await getDocWithTimeout(doc(db, "users", user.uid), 1200);
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as UserProfile);
          } else {
            const fallbackProfile: UserProfile = {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || (user.email || "").split("@")[0] || "User",
              isCustomDomain: (user.email || "").endsWith("@nexa-labs.com"),
              joinedAt: new Date().toISOString()
            };
            setCurrentUser(fallbackProfile);
          }
        } catch (e) {
          console.warn("Failed to retrieve profile data (using local fallback profile):", e);
          const fallbackProfile: UserProfile = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || (user.email || "").split("@")[0] || "User",
            isCustomDomain: (user.email || "").endsWith("@nexa-labs.com"),
            joinedAt: new Date().toISOString()
          };
          setCurrentUser(fallbackProfile);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Hydrate premium status on user sign in
  useEffect(() => {
    if (currentUser?.isPremium) {
      setIsPremium(true);
      localStorage.setItem("astra_is_premium", "true");
    }
  }, [currentUser]);

  // LOAD USER PERSONAL DATA (Chats, Images, Videos, Codes) FROM CLOUD PERSISTENCE
  useEffect(() => {
    if (!currentUser) return;

    const loadCloudData = async () => {
      try {
        const dataDocRef = doc(db, "userData", currentUser.uid);
        const snap = (await getDocWithTimeout(dataDocRef, 1200)) as any;
        if (snap && snap.exists()) {
          const cloudData = snap.data() as any;
          if (cloudData && cloudData.messages) setMessages(cloudData.messages);
          if (cloudData && cloudData.imageHistory) setImageHistory(cloudData.imageHistory);
          if (cloudData && cloudData.currentVideo) setCurrentVideo(cloudData.currentVideo);
          if (cloudData && cloudData.generatedCode) setGeneratedCode(cloudData.generatedCode);
        }
      } catch (e) {
        console.warn("Failed loading cloud persistence data (using local memory state):", e);
      }
    };

    loadCloudData();
  }, [currentUser]);

  // AUTO-SYNC USER CREATIONS TO CLOUD PERSISTENCE INSTANTLY
  useEffect(() => {
    if (!currentUser) return;

    const syncToCloud = async () => {
      try {
        const dataDocRef = doc(db, "userData", currentUser.uid);
        await setDoc(dataDocRef, {
          messages,
          imageHistory,
          currentVideo,
          generatedCode,
          lastSynced: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn("Cloud data auto-sync failed (network is offline/restricted):", e);
      }
    };

    // Debounce or immediate simple sync
    const timer = setTimeout(syncToCloud, 1000);
    return () => clearTimeout(timer);
  }, [messages, imageHistory, currentVideo, generatedCode, currentUser]);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  // Fetch telemetry occasionally
  const fetchTelemetry = async () => {
    try {
      setIsRefreshingTelemetry(true);
      const res = await fetch("/api/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e) {
      console.error("Telemetry failed to sync:", e);
    } finally {
      setIsRefreshingTelemetry(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 15000);
    return () => clearInterval(interval);
  }, []);

  // Multi-modal Chat function
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() && !chatImageBase64) return;

    const userMsg: Message = {
      role: "user",
      content: inputMessage,
      image: chatImageBase64 || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    const tempInput = inputMessage;
    const tempImageBase64 = chatImageBase64;
    const tempImageMimeType = chatImageMimeType;

    // Reset inputs immediately
    setInputMessage("");
    setChatImageBase64(null);
    setChatImageMimeType(null);

    // Smart keyword routing: Switch to image generator tab if asking to make/draw pictures or images
    const lowerInput = tempInput.toLowerCase();
    const isImageRequest = 
      /(이미지|그림|사진|일러스트|배경화면)\s*(만들어|그려|생성|해줘|제작|디자인|보여)/.test(lowerInput) || 
      lowerInput.includes("이미지 만들어") || 
      lowerInput.includes("그림 그려") || 
      lowerInput.includes("사진 만들어") || 
      lowerInput.includes("이미지 생성") || 
      lowerInput.includes("create image") || 
      lowerInput.includes("generate image") || 
      lowerInput.includes("make an image") ||
      lowerInput.includes("draw ") ||
      lowerInput.includes("paint ");

    if (isImageRequest) {
      // Extract elegant core prompt: e.g. "신비로운 우주 이미지 만들어줘" -> "신비로운 우주"
      let extractedPrompt = tempInput
        .replace(/(이미지|그림|사진|일러스트|배경화면)\s*(만들어|그려|생성|해줘|제작|디자인|보여|줘)/g, "")
        .replace(/(~을|~를|을|를)/g, "")
        .trim();
      
      if (extractedPrompt.length < 2) {
        extractedPrompt = "";
      }

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `🎨 **이미지 엔진 터미널로 즉시 안내합니다!**\n\n요청하신 고품질 이미지 제작을 위해 원터치 통합 전송 및 **'이미지'** 제작 탭으로 자동 이동했습니다.${
              extractedPrompt 
                ? `\n\n입력하신 프롬프트 **"${extractedPrompt}"**가 주입되었습니다. 사이드바의 **[AI 생성하기]** 단추를 눌러 이미지를 즉시 생성해 보세요.` 
                : " 원하시는 이미지 프롬프트를 창에 적어 자유롭게 생성해 보세요!"
            }`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setActiveTab("image");
        if (extractedPrompt) {
          setImagePrompt(extractedPrompt);
        }
        setIsChatLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: tempInput || "Please review this visual element.",
          history: messages.slice(1).map(m => ({ role: m.role, content: m.content })),
          imageBase64: tempImageBase64,
          imageMimeType: tempImageMimeType
        }),
      });

      if (!response.ok) throw new Error("Nova AI Core Link Connection Exception");
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ **세션 응답 지연 경고:** ${error.message || "서버 통신에 임시 지연이 감지되었습니다. 잠시 후 마스터 노드를 재시도합니다."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Image handling for chat
  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setChatImageBase64(reader.result.split(",")[1]);
        setChatImageMimeType(file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger file click
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  // Preset prompts
  const searchPreset = (p: string) => {
    setInputMessage(p);
  };

  // Generate Image
  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim()) return;

    if (!checkPremiumLimit("이미지")) return;

    setIsGeneratingImage(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (!res.ok) throw new Error("Failed to reach Imagen core engine.");
      const data = await res.json();

      if (data && data.success) {
        const newImg: ImageResult = {
          imageUrl: data.imageUrl,
          originalPrompt: imagePrompt,
          expandedPrompt: data.expandedPrompt,
          isRealGen: data.isRealGen,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setImageHistory((prev) => [newImg, ...prev]);
        setSelectedImageResult(newImg);
        setImagePrompt("");
        incrementGenCount();
      }
    } catch (error: any) {
      alert("Error generating image: " + error.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Generate Cinematic Video
  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoPrompt.trim()) return;

    if (!checkPremiumLimit("동영상")) return;

    setIsGeneratingVideo(true);
    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: videoPrompt }),
      });

      if (!res.ok) throw new Error("Failed to boot cinema simulator.");
      const data = await res.json();

      if (data && data.success) {
        setCurrentVideo({
          videoUrl: data.videoUrl,
          prompt: videoPrompt,
          storyboard: data.storyboard,
          category: data.category,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        setVideoPrompt("");
        incrementGenCount();
      }
    } catch (error: any) {
      alert("Error building video storyboard: " + error.message);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Generate Live Sandbox HTML Code
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codePrompt.trim()) return;

    setIsGeneratingCode(true);
    try {
      const res = await fetch("/api/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentRequest: codePrompt }),
      });

      if (!res.ok) throw new Error("Sandbox compilation node rejected request.");
      const data = await res.json();

      if (data && data.success) {
        setGeneratedCode({
          request: codePrompt,
          htmlCode: data.htmlCode,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
    } catch (error: any) {
      alert("Failed code genesis: " + error.message);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode.htmlCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSignOut = async () => {
    if (confirm("보안 파일 연동을 종료하고 로그아웃하시겠습니까?")) {
      try {
        localStorage.removeItem("astra_sim_user");
        await signOut(auth);
        setCurrentUser(null);
      } catch (e) {
        console.error("Sign out failed:", e);
      }
    }
  };

  const triggerLoginRedirect = () => {
    localStorage.removeItem("astra_sim_user");
    setCurrentUser(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f0f4f9] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-500 font-mono">CONNECTING TO SECURE ASTRA GATEWAY...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(profile) => setCurrentUser(profile)} />;
  }

  return (
    <div id="astra_platform_root" className="min-h-screen bg-[#f0f4f9] text-[#1f1f1f] font-sans flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-10 w-[500px] h-[350px] bg-gradient-to-br from-blue-400/10 via-violet-400/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-20 left-10 w-[400px] h-[300px] bg-gradient-to-tr from-pink-400/5 via-indigo-400/5 to-transparent rounded-full blur-[110px] pointer-events-none z-0"></div>

      {/* HEADER TOP BAR WITH CUSTOM LOGO AND AUTH PROFILE CONTROLS */}
      <header id="nexa_header" className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-6 py-4 flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="relative group flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1a73e8] via-[#8b5cf6] to-[#ec4899] p-[2.5px] shadow-sm transform group-hover:rotate-12 transition-transform duration-500">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-50/20" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500 border-2 border-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#1a73e8] uppercase">Nexa Labs Flagship</span>
              <span className="text-[9px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full text-indigo-600 font-mono font-medium">Model 2.5-Stable</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              ASTRA AI <span className="text-xs font-normal text-slate-400 tracking-normal font-mono hidden lg:inline">| 초지능 멀티모달 포탈</span>
            </h1>
          </div>
        </div>

        {/* TABS SELECT */}
        <div className="flex flex-wrap items-center justify-center bg-[#e9eef6]/80 p-1 rounded-2xl border border-slate-200/50">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "chat" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span>대화</span>
          </button>
          
          <button
            onClick={() => setActiveTab("mail")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "mail" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Mail className="w-4 h-4 text-violet-500" />
            <span>사내 메일</span>
          </button>

          <button
            onClick={() => setActiveTab("image")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "image" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-500" />
            <span>이미지 발전소</span>
          </button>
          
          <button
            onClick={() => setActiveTab("video")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "video" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Video className="w-4 h-4 text-pink-500" />
            <span>영화적 시네마</span>
          </button>
          
          <button
            onClick={() => setActiveTab("code")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "code" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code className="w-4 h-4 text-emerald-500" />
            <span>샌드박스</span>
          </button>
          
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "telemetry" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="w-4 h-4 text-amber-500" />
            <span>시스템 리포트</span>
          </button>
        </div>

        {/* PREMIUM STATUS BAR */}
        <div className="flex items-center gap-2">
          {isPremium ? (
            <div 
              onClick={() => {
                const reset = window.confirm(
                  "이미 최고 등급인 Astra 프리미엄(₩20,000 / 1년 무제한이용권) 활성화 상태입니다!\n\n💡 [확인]을 누르면 계정 등급과 AI 사용량을 초기화하여, 새로 변경하신 '토스뱅크 1000-8035-3159' 자동 입금 감지 화면을 처음부터 다시 테스트해보실 수 있습니다."
                );
                if (reset) {
                  setIsPremium(false);
                  setGenCount(0);
                  localStorage.removeItem("astra_is_premium");
                  localStorage.removeItem("astra_gen_count");
                  alert("성공적으로 초기화되었습니다! 이제 AI 생성 도구(이미지, 동영상 등)를 이용하시거나 결제 버튼을 눌러 새 계정과 금액으로 시뮬레이션해 보세요.");
                } else {
                  setPremiumReason("이미 최고 등급인 Astra 프리미엄 활성화 상태입니다!");
                  setIsPremiumModalOpen(true);
                }
              }}
              className="bg-amber-100/90 border border-amber-200 text-amber-800 font-extrabold text-xs px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 cursor-pointer hover:bg-amber-200 transition shadow-xs"
            >
              <Award className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>PREMIUM PRO (클릭해 초기화)</span>
            </div>
          ) : (
            <button
              onClick={() => {
                setPremiumReason("");
                setIsPremiumModalOpen(true);
              }}
              className="bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 border border-indigo-200/60 text-indigo-700 font-bold text-[11px] px-3 py-1.5 rounded-2xl flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/20" />
              <span>AI 생성: {genCount}/3회</span>
              <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-md font-medium">UPGRADE</span>
            </button>
          )}
        </div>

        {/* PROFILE CRADENTIALS BAR */}
        <div id="profile_badge" className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 rounded-2xl p-1.5 pl-3.5 shadow-xs">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 block leading-tight">{currentUser.displayName}</span>
            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[150px] leading-tight mt-0.5">{currentUser.email}</span>
          </div>

          <div className="relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm ${
              currentUser.isCustomDomain 
                ? "bg-gradient-to-tr from-[#1a73e8] to-[#8b5cf6] text-white" 
                : "bg-slate-200 text-slate-700"
            }`}>
              {currentUser.displayName.charAt(0)}
            </div>
            {currentUser.isCustomDomain && (
              <span className="absolute -bottom-1 -right-1 bg-indigo-600 border border-white text-white rounded-full p-0.5" title="Certified Corporate Account">
                <Shield className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          <button
            onClick={handleSignOut}
            title="시큐어 게이트웨이 로그아웃"
            className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 transition shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      {/* "대화 화면은 꽉차게" -> Width classes adjusted dynamically: max-w-none for chat! */}
      <main 
        id="workspace_viewport" 
        className={`flex-1 w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col relative z-10 transition-all ${
          activeTab === "chat" ? "max-w-none px-4 md:px-6" : "max-w-7xl"
        }`}
      >
        
        {/* TAB content 1: CHAT AREA (FULL-BLEED / EDGE-TO-EDGE) */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch w-full min-h-[calc(100vh-200px)]">
            
            {/* Left Sidebar: Quick Actions (3 cols) */}
            <div id="chat_side_panel" className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col gap-6 shadow-sm h-full">
              <div>
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-500" /> 시작하기 빠른 제안
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Astra AI는 정교한 텍스트 답변뿐만 아니라, 업로드한 도포 및 그림 데이터를 인지하여 다차원 피드백을 전달할 수 있습니다.
                </p>
              </div>

              {/* Sample Starters */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => searchPreset("Nexa Labs가 시장에서 차별화된 경쟁력을 선점하기 위한 인공지능 엔터프라이즈 로드맵을 작성해줘.")}
                  className="p-3 text-left bg-[#f8fafc] hover:bg-[#f1f5f9] border border-slate-100 rounded-2xl text-xs transition group"
                >
                  <span className="font-semibold text-slate-700 block group-hover:text-indigo-600 transition">Enterprise Roadmap</span>
                  <span className="text-[11px] text-slate-400 block truncate leading-relaxed">"Nexa Labs의 차별화된 인공지능..."</span>
                </button>
                <button
                  onClick={() => searchPreset("전세계 이상 기후 데이터와 탄소 규제 동향에 맞춘 자사 친환경 시나리오 제언을 영문 및 국문 혼용으로 분석해줘.")}
                  className="p-3 text-left bg-[#f8fafc] hover:bg-[#f1f5f9] border border-slate-100 rounded-2xl text-xs transition group"
                >
                  <span className="font-semibold text-slate-700 block group-hover:text-indigo-600 transition">Climate Change Scenario</span>
                  <span className="text-[11px] text-slate-400 block truncate leading-relaxed">"이상 기후 데이터 탄소 규제..."</span>
                </button>
                <button
                  onClick={() => searchPreset("인공지능 미디어 렌더링 물리 시뮬레이션 코드 예제를 JavaScript 클래스 기반으로 간단히 도출해줄 수 있어?")}
                  className="p-3 text-left bg-[#f8fafc] hover:bg-[#f1f5f9] border border-slate-100 rounded-2xl text-xs transition group"
                >
                  <span className="font-semibold text-slate-700 block group-hover:text-amber-600 transition">Physics Rendering snippet</span>
                  <span className="text-[11px] text-slate-400 block truncate leading-relaxed">"물리 시뮬레이션 코드 예제..."</span>
                </button>
              </div>

              {/* Secure synchronization status indicator */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs space-y-2 mt-auto">
                <span className="text-[10px] text-indigo-700 font-mono font-bold block uppercase tracking-wide">Cloud System Monitor</span>
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-indigo-500" /> Firebase Sync</span>
                  <span className="text-[9px] text-indigo-600 font-bold bg-white border border-indigo-100 px-1.5 py-0.5 rounded-full">CONNECTED</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed font-mono">
                  채팅 세션, 프롬프트, 생성물이 실시간으로 안전하게 자동 보존 중입니다.
                </div>
              </div>
            </div>

            {/* Main Chat Center (9 cols - takes full screen width and height dynamically) */}
            <div id="chat_conversation_area" className="lg:col-span-9 flex flex-col bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm h-[calc(100vh-220px)]">
              
              {/* Chat Header Status */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Astra.Core Active Dialog</h4>
                    <span className="text-[10px] text-slate-400 block">메쉬 네트워크 보안 연동 완료</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setMessages([{
                    role: "assistant",
                    content: "대화 세션이 차분하게 초기화되었습니다. Nexa Labs Astra가 최상의 답변 능력을 대기 중입니다. 무엇이든 질문하세요.",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  }])}
                  className="text-[11px] text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
                >
                  대화 기록 지우기
                </button>
              </div>

              {/* Chat Message Lists (scroller flex-1 fills screen height perfectly) */}
              <div id="message_scroller" className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#fcfdfe]">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    
                    {msg.role !== "user" && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 relative border ${
                      msg.role === "user" 
                        ? "bg-[#eaf1fb] border-blue-200/50 text-[#1f1f1f] shadow-xs" 
                        : "bg-[#f8f9fa] border-slate-100 text-[#1f1f1f] shadow-xs"
                    }`}>
                      
                      {msg.image && (
                        <div className="mb-3 max-w-[280px] rounded-xl overflow-hidden border border-slate-200 bg-white">
                          <img src={`data:image/jpeg;base64,${msg.image}`} alt="Custom visual reference" className="w-full object-cover max-h-[160px]" />
                        </div>
                      )}

                      <div className="text-sm leading-relaxed whitespace-pre-line tracking-wide">
                        {msg.content}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-4 border-t border-slate-200/30 pt-1.5 text-[9px] text-slate-400 font-mono tracking-widest uppercase">
                        <span>
                          {msg.role === "user" ? "USER_NODE" : "ASTRA_COGNITIVE"}
                        </span>
                        <span>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>

                    {msg.role === "user" && (
                      <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 font-mono text-xs font-semibold text-slate-700 shadow-sm">
                        {currentUser?.displayName ? currentUser.displayName.substring(0, 2) : "GE"}
                      </div>
                    )}

                  </div>
                ))}

                {currentUser?.isGuest && messages.length >= 2 && (
                  <div className="bg-gradient-to-r from-violet-50/80 via-indigo-50/50 to-purple-50/60 border border-indigo-100/70 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xs mt-4 animate-fade-in text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                        <Sparkles className="w-4 h-4 text-indigo-100" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          💡 대화 중간 안내: 지금 로그인하고 3초 보안 계정을 활성화하시겠습니까?
                        </p>
                        <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                          현재 게스트 세션이며 다른 탭들(사내 메일 연동, AI 이미지 큐어, 시네마 엔진, 샌드박스 코딩)을 100% 가동해 보시려면 정식 계정을 연결해 보세요!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={triggerLoginRedirect}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-xl transition cursor-pointer shadow-sm shrink-0"
                    >
                      보안 계정 연결
                    </button>
                  </div>
                )}

                {isChatLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-pink-500 flex items-center justify-center shrink-0 animate-spin">
                      <Loader2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-[#f8f9fa] border border-slate-100 rounded-2xl px-5 py-4 max-w-[80%] shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-indigo-600 font-mono font-semibold animate-pulse">Astra AI가 입체적 추론 결과를 정형화 중입니다...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Field Area */}
              <form onSubmit={handleSendMessage} className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3 shrink-0">
                
                {chatImageBase64 && (
                  <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-indigo-700 font-mono text-[11px]">IMAGE_ATTACHED.JPG</span>
                    <button 
                      type="button" 
                      onClick={() => { setChatImageBase64(null); setChatImageMimeType(null); }}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleChatImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={triggerImageUpload}
                    title="멀티모달 이미지 분석 시작"
                    className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 text-slate-500 transition shrink-0 flex items-center justify-center shadow-xs cursor-pointer"
                  >
                    <Upload className="w-5 h-5 text-indigo-500" />
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Astra AI에 질문하거나 지시를 입력하세요... (예: 사내 클라우드 통합 방안 설계 요청)"
                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-100 transition text-slate-800 shadow-xs"
                  />

                  <button
                    type="submit"
                    disabled={isChatLoading || (!inputMessage.trim() && !chatImageBase64)}
                    className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold tracking-wide transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs font-semibold">보내기</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 px-1 gap-1 font-mono">
                  <span>* .PNG, .JPG 규격 연동 완료. 가상 보안 방화벽이 상시 작동 중입니다.</span>
                  <span>Astra Security Node Verified.</span>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* TAB content 2: NEXA SECURE MAIL (NEW APP REDIRECTED) */}
        {activeTab === "mail" && (
          currentUser?.isGuest ? (
            <GuestLockScreen tabName="사내 보안 메일" onProceedToLogin={triggerLoginRedirect} />
          ) : (
            <MailApp currentUser={currentUser} />
          )
        )}

        {/* TAB content 3: GRAPHIC STUDIO (IMAGE GEN) - Elegant minimalist light cards */}
        {activeTab === "image" && (
          currentUser?.isGuest ? (
            <GuestLockScreen tabName="AI 시각 그래픽 발전소" onProceedToLogin={triggerLoginRedirect} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[calc(100vh-210px)] items-stretch">
            <div id="image_builder_bar" className="lg:col-span-1 bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
              <div>
                <span className="text-purple-600 text-xs font-bold tracking-wider uppercase block mb-1">Imagen Suite powered</span>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">시각 그래픽 스튜디오</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  원하는 일러스트, 레이아웃, 풍경 프롬프트를 입력하면, Astra AI의 풍부한 확장 기술이 융합된 고품질 인공지능 이미지를 만들어 드립니다.
                </p>
              </div>

              <form onSubmit={handleGenerateImage} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2 font-mono font-semibold">Creative Visual Prompt</label>
                  <textarea
                    rows={4}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="예: Minimal warm modern furniture studio with natural lights, soft shadow photography..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500/50 focus:bg-white transition resize-none text-slate-700"
                  />
                </div>

                <div className="p-3 bg-purple-50/50 border border-purple-100/50 rounded-2xl space-y-2">
                  <span className="text-[10px] text-purple-700 font-mono font-bold block uppercase tracking-wide">아트 확장 필터 가동</span>
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-500" /> Prompt Optimizer</span>
                    <span className="text-[9px] text-[#1a73e8] font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">ACTIVE</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>입체 그래픽 연산 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>이미지 생성 완료하기</span>
                    </>
                  )}
                </button>
              </form>

              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-bold block">추천 디자인 장소</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Minimal luxurious hotel design with neon accents",
                    "Aesthetic white clay pottery minimal sculpture",
                    "Futuristic electric hovercar warm studio rendering",
                    "Cosmic swirling nebula hyper-realistic photo"
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImagePrompt(p)}
                      className="px-2.5 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-slate-100 rounded-lg text-[10px] text-slate-600 hover:text-slate-900 transition font-mono cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div id="image_gallery_view" className="lg:col-span-2 flex flex-col gap-6">
              <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-center items-center min-h-[360px] relative overflow-hidden shadow-sm">
                {isGeneratingImage ? (
                  <div className="text-center space-y-4">
                    <div className="inline-flex p-4 rounded-full bg-purple-50 border border-purple-100 animate-pulse mb-2">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 tracking-wider font-sans">시각 요소 픽셀 조합 중</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Nexa Labs의 최신 이미지 생성 큐어를 통하여 시네마틱 화상 복원 및 빛 옥테인 처리를 진행 중입니다. 잠시만 대기하십시오.
                    </p>
                  </div>
                ) : (selectedImageResult || imageHistory[0]) ? (
                  (() => {
                    const activeImg = selectedImageResult || imageHistory[0];
                    return (
                      <div className="w-full h-full flex flex-col justify-between space-y-4">
                        <div className="relative rounded-2xl overflow-hidden border border-slate-100 max-h-[460px] flex justify-center bg-slate-50">
                          <img
                            src={activeImg.imageUrl}
                            alt="Generated visual result"
                            className="max-h-[460px] object-contain rounded-2xl"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="bg-slate-900/90 text-white text-[10px] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider">
                              {activeImg.isRealGen ? "● IMAGEN_AUTHENTIC" : "● HIGH_FIDELITY_FALLBACK"}
                            </span>
                            <span className="bg-white/90 border border-slate-200 text-slate-700 text-[10px] px-2.5 py-1 rounded-full font-mono">
                              CFG: 7.5
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono uppercase block font-semibold">User Prompt</span>
                            <p className="text-xs text-slate-700">"{activeImg.originalPrompt}"</p>
                          </div>
                          <div className="border-t border-slate-100 pt-2">
                            <span className="text-[10px] text-purple-600 font-mono uppercase flex items-center gap-1.5 font-bold">
                              <Sparkles className="w-3 h-3 text-purple-500" /> Astra AI Expanded Art Prompt
                            </span>
                            <p className="text-xs text-slate-500 leading-relaxed italic mt-1 bg-white p-2.5 rounded-lg border border-slate-100">
                              "{activeImg.expandedPrompt}"
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">생성 파일 부재</p>
                    <p className="text-xs text-slate-400">프롬프트를 입력하고 새로운 가치 이미지를 창조해보세요.</p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-mono font-bold block mb-3">생성 히스토리 목록 ({imageHistory.length})</span>
                <div className="flex flex-wrap gap-3">
                  {imageHistory.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageResult(item)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border transition group cursor-pointer ${
                        (selectedImageResult?.imageUrl === item.imageUrl) ? "border-purple-500 ring-2 ring-purple-100" : "border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <img src={item.imageUrl} alt="Preset spec" className="w-full h-full object-cover group-hover:scale-105 transition" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          )
        )}

        {/* TAB content 4: CINEMA ENGINE (VIDEO SIMULATOR) */}
        {activeTab === "video" && (
          currentUser?.isGuest ? (
            <GuestLockScreen tabName="영화적 시네마 엔진" onProceedToLogin={triggerLoginRedirect} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[calc(100vh-210px)] items-stretch">
            <div id="video_setup_panel" className="lg:col-span-1 bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
              <div>
                <span className="text-pink-600 text-xs font-bold tracking-wider uppercase block mb-1">CineMax 4K Engine</span>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Video className="w-5 h-5 text-pink-500" /> 영화 비디오 시뮬레이터</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  생성하고자 하는 영화적 무대, 성운 우주, 또는 신비로운 고속도로 등을 기재하세요. 상세한 시퀀스 콘티 시나리오 기획 리포트와 함께 연출 테스트를 시뮬레이션합니다.
                </p>
              </div>

              <form onSubmit={handleGenerateVideo} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2 font-mono font-semibold font-sans">Cinematic Scenario Prompt</label>
                  <textarea
                    rows={4}
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="예: Futuristic cyberpunk city highway with cyan neon lights panning shot..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500/50 focus:bg-white transition resize-none text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 font-mono block mb-1 uppercase font-bold">비디오 비율</span>
                    <span className="text-xs font-semibold text-slate-700">16:9 Cinematic</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 font-mono block mb-1 uppercase font-bold">비디오 화질</span>
                    <span className="text-xs font-semibold text-slate-700">4K Ultra HD</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingVideo || !videoPrompt.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 text-white font-semibold rounded-xl text-xs tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {isGeneratingVideo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>시네마 셰이더 빌드 중...</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-3.5 h-3.5" />
                      <span>동영상 연출안 및 비디오 렌더링</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div id="video_player_view" className="lg:col-span-2 flex flex-col gap-6">
              <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm min-h-[500px]">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                  {isGeneratingVideo ? (
                    <div className="text-center space-y-4 z-10 px-4">
                      <div className="inline-flex p-4 rounded-full bg-pink-50 border border-pink-100 animate-pulse mb-2">
                        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 tracking-wider">영화적 그래픽 무대 합성 중</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        CineMax 4K 렌더러가 프레임 밀도 향상 및 심도 정렬 처리를 시작하고 있습니다. 잠시만 대기해 주십시오.
                      </p>
                    </div>
                  ) : currentVideo ? (
                    <video
                      key={currentVideo.videoUrl}
                      src={currentVideo.videoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                    />
                  ) : null}
                </div>

                {currentVideo && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-4 space-y-2">
                    <span className="text-[10px] text-pink-700 font-mono font-bold block uppercase tracking-wide">
                      시네마틱 스크린플레이 연출안 리포트
                    </span>
                    <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-sans">
                      {currentVideo.storyboard}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        )}

        {/* TAB content 5: LIVE SANDBOX CONTAINER */}
        {activeTab === "code" && (
          currentUser?.isGuest ? (
            <GuestLockScreen tabName="라이브 코드 샌드박스" onProceedToLogin={triggerLoginRedirect} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[calc(100vh-210px)] items-stretch">
            <div id="sandbox_prompt_panel" className="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
              <div>
                <span className="text-emerald-600 text-xs font-bold tracking-wider uppercase block mb-1">Live JSX/HTML Render</span>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Code className="w-5 h-5 text-emerald-500" /> 라이브 샌드박스 코더</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  생성하려는 웹 유틸리티 종류를 입력해 주십시오. Tailwind CSS가 적용된 고성능 인랙티브 데모 페이지를 생성하고 이 곳에 렌더링 해 드립니다.
                </p>
              </div>

              <form onSubmit={handleCreateCode} className="space-y-4">
                <div>
                  <textarea
                    rows={4}
                    value={codePrompt}
                    onChange={(e) => setCodePrompt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition resize-none text-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingCode || !codePrompt.trim()}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isGeneratingCode ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>컴포넌트 소스 전처리 연산 중...</span>
                    </>
                  ) : (
                    <>
                      <Code className="w-3.5 h-3.5" />
                      <span>샌드박스 코드 생성하기</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div id="sandbox_preview_panel" className="bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 shrink-0">
                <span className="text-xs font-bold text-slate-800">HTML IFrame 연동 샌드박스 화면</span>
                {generatedCode && (
                  <button
                    onClick={copyCodeToClipboard}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{codeCopied ? "복사 성공!" : "소스 복사"}</span>
                  </button>
                )}
              </div>

              <div className="flex-1 min-h-[380px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-150 relative">
                {isGeneratingCode ? (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-10 bg-slate-50">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                    <h4 className="text-xs font-bold text-slate-800">가상 컴파일러 마운트 중</h4>
                  </div>
                ) : generatedCode ? (
                  <iframe
                    title="Live Sandbox Rendering Frame"
                    srcDoc={generatedCode.htmlCode}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-popups"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 text-slate-400">
                    <Terminal className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">소스 기재 대기 중</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        )}

        {/* TAB content 6: TELEMETRY SYSTEM REPORTS */}
        {activeTab === "telemetry" && (
          currentUser?.isGuest ? (
            <GuestLockScreen tabName="시스템 리포트 모니터" onProceedToLogin={triggerLoginRedirect} />
          ) : (
            <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-amber-600 text-xs font-bold tracking-wider uppercase block mb-1">Nexa Security Operating Unit</span>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">마스터 메인프레임 통계</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Nexa Labs 엔터프라이즈 서버와 분산 GPU 노드의 수치 데이터를 실시간으로 모니터링합니다.
                </p>
              </div>

              <button
                onClick={fetchTelemetry}
                disabled={isRefreshingTelemetry}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTelemetry ? "animate-spin" : ""}`} />
                <span>데이터 즉각 동기화</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                <span className="text-[10px] uppercase text-slate-400 font-mono font-bold block">Quantum Throughput</span>
                <div className="text-3xl font-extrabold text-blue-600 tracking-tight font-sans">
                  {metrics.quantumThroughput} <span className="text-xs font-medium text-slate-400">PFLOPS/s</span>
                </div>
                <p className="text-[11px] text-slate-500">실시간 연산 정렬 임계 밀도로 최고 수준의 연산 정합성 보장</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                <span className="text-[10px] uppercase text-slate-400 font-mono font-bold block">Response Latency Peak</span>
                <div className="text-3xl font-extrabold text-amber-600 tracking-tight font-sans">
                  {metrics.averageLatency} <span className="text-xs font-medium text-slate-400">ms</span>
                </div>
                <p className="text-[11px] text-slate-500">지브롤터 노드 및 서울 게이트웨이 통합 네트워크 지연 평가치</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                <span className="text-[10px] uppercase text-slate-400 font-mono font-bold block">GPU Core Utilization</span>
                <div className="text-3xl font-extrabold text-purple-600 tracking-tight font-sans">
                  {metrics.gpuCoreUtilization} <span className="text-xs font-medium text-slate-400">%</span>
                </div>
                <p className="text-[11px] text-slate-500">전체 H100 엔터프라이즈 집적 클러스터 실시간 고도 부하 동조 수치</p>
              </div>
            </div>
          </div>
          )
        )}

      </main>

      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
        onSuccess={handleUpgradeSuccess} 
        reason={premiumReason} 
      />

    </div>
  );
}
