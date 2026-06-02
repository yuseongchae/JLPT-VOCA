export function speakJa(text: string) {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  if (!text.trim()) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
