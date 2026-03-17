import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { conversationId, splitMessageId, title } = await req.json();
    if (!conversationId) throw new Error("Missing conversationId");

    // Fetch messages from split point onward (or all if no splitMessageId)
    let messagesQuery = supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    const { data: allMessages, error: msgError } = await messagesQuery;
    if (msgError) throw msgError;
    if (!allMessages || allMessages.length === 0) throw new Error("No messages found");

    // Find split point
    let splitIdx = 0;
    if (splitMessageId) {
      const idx = allMessages.findIndex(m => m.id === splitMessageId);
      if (idx >= 0) splitIdx = idx;
    }

    const messagesToCopy = allMessages.slice(splitIdx);

    // Create new conversation
    const newTitle = title || `Split: ${messagesToCopy[0]?.content?.slice(0, 40)}...`;
    const { data: newConv, error: convError } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: newTitle })
      .select("id")
      .single();

    if (convError) throw convError;

    // Copy messages to new conversation
    const newMessages = messagesToCopy.map(m => ({
      conversation_id: newConv.id,
      role: m.role,
      content: m.content,
      parent_message_id: m.id,
    }));

    const { error: insertError } = await supabase.from("messages").insert(newMessages);
    if (insertError) throw insertError;

    // Record the split
    await supabase.from("chat_splits").insert({
      parent_conversation_id: conversationId,
      child_conversation_id: newConv.id,
      split_message_id: splitMessageId || allMessages[splitIdx]?.id,
    });

    return new Response(JSON.stringify({
      newConversationId: newConv.id,
      title: newTitle,
      messageCount: messagesToCopy.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("split-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
