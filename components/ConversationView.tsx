"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { censorText } from "@/lib/profanity";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type Conversation = {
  id: string;
  user_a: string;
  user_b: string;
  requested_by: string;
  status: string;
};

export default function ConversationView({
  conversation,
  currentUserId,
  otherPersonName,
}: {
  conversation: Conversation;
  currentUserId: string;
  otherPersonName: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);
  }

  useEffect(() => {
    if (conversation.status === "accepted") {
      loadMessages();
      const interval = setInterval(loadMessages, 4000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, conversation.status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function accept() {
    setBusy(true);
    await supabase.from("conversations").update({ status: "accepted" }).eq("id", conversation.id);
    setBusy(false);
    router.refresh();
  }

  async function decline() {
    setBusy(true);
    await supabase.from("conversations").update({ status: "blocked" }).eq("id", conversation.id);
    setBusy(false);
    router.push("/messages");
    router.refresh();
  }

  async function block() {
    setBusy(true);
    await supabase.from("conversations").update({ status: "blocked" }).eq("id", conversation.id);
    setBusy(false);
    router.push("/messages");
    router.refresh();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length === 0) return;
    setSending(true);
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      body: censorText(body.trim()),
    });
    setBody("");
    setSending(false);
    loadMessages();
  }

  if (conversation.status === "blocked") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="font-body text-grey">This conversation is no longer active.</p>
      </div>
    );
  }

  if (conversation.status === "pending" && conversation.requested_by !== currentUserId) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="font-display text-2xl font-bold text-ink mb-3">
          {otherPersonName} wants to message you
        </h1>
        <p className="font-body text-grey mb-6">
          Accept to start a private conversation, or decline.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={accept}
            disabled={busy}
            className="bg-accent text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
          >
            Accept
          </button>
          <button
            onClick={decline}
            disabled={busy}
            className="border border-border px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-offwhite transition-colors disabled:opacity-60"
          >
            Decline
          </button>
        </div>
      </div>
    );
  }

  if (conversation.status === "pending" && conversation.requested_by === currentUserId) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="font-body text-grey">
          Your message request to {otherPersonName} is waiting for a response.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[70vh]">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <h1 className="font-display text-xl font-bold text-ink">{otherPersonName}</h1>
        <button onClick={block} className="text-xs text-accent hover:underline">
          Block
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <p className="font-body text-sm text-grey text-center pt-10">
            Say hello to start the conversation.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] px-3 py-2 rounded-sm font-body text-sm ${
                m.sender_id === currentUserId
                  ? "bg-ink text-paper ml-auto"
                  : "bg-offwhite text-ink"
              }`}
            >
              {m.body}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="Type a message..."
          className="flex-1 border border-border rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
        />
        <button
          type="submit"
          disabled={sending || body.trim().length === 0}
          className="bg-accent text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
