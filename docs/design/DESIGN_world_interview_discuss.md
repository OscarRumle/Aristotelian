# Feature Spec: World Interview — Submit vs Discuss

**Status:** Draft  
**Date:** 2026-05-08  
**Scope:** Adding a Discuss mode to each interview question — an inline chat that lets users jam on a topic with the LLM before committing an answer. Replaces the single "Your answer" input with a two-mode system.

---

## Overview

The World Interview is a series of questions about the world being built. Currently each question has a free-text answer field and three pre-written A/B/C options. The problem: users sometimes don't know what they think yet. They need to *talk through* the question before they can answer it.

Discuss mode gives them that. It replaces the answer field with an inline chat. The user explores the topic with the LLM, and when they're ready, the LLM synthesises a clean answer from the conversation. That answer can be edited and then submitted — just like a regular answer.

The A/B/C options remain available throughout, as anchors the user can invoke at any point in the discussion.

---

## Entry State: Two Buttons

Where there is currently a single text input ("Your answer"), the user now sees two action options below the question:

**Submit** — keeps the current experience. The text input appears and the user types their answer directly. The A/B/C options are shown below it. Submitting sends the answer immediately.

**Discuss** — opens Discuss mode inline within the same question card. The text input is replaced by a chat panel.

The two buttons sit side by side, visually equal weight. Neither is a primary CTA — the user actively chooses a mode. Labels are short and clear: **Submit** and **Discuss**.

---

## Discuss Mode — Visual Layout

Discuss mode expands the question card vertically. The question text stays at the top, unchanged. Below it, the answer field is replaced by:

1. **Chat panel** — a scrollable message thread. LLM messages on the left, user messages on the right. Visually similar to the existing Dialogue feature in the app.
2. **Message input** — a text field at the bottom of the chat, with a Send button (or Enter to send).
3. **A/B/C options** — always visible below the chat panel, collapsed slightly (e.g. smaller cards or a more compact layout) but fully readable and tappable. See section below.
4. **"Synthesise answer" button** — appears once at least one exchange has happened. Prominent but not aggressive — it signals that the user can wrap up when they're ready.

The card does not become a modal or overlay. It expands in place. This keeps the user anchored in the interview flow and makes it feel like a natural extension of the existing input, not a separate mode switch.

---

## The Opening Message

When the user clicks Discuss, the LLM sends an opening message immediately — it does not wait for the user to type first. This message:

- Rephrases the question in a more conversational, accessible tone (not the full academic framing — see the companion doc on question simplification)
- Optionally surface the core tension or stakes in plain language
- Invites the user to share what they're thinking, even if it's just a gut feeling or an image

The opening message is short — two to three sentences at most. It sets a collaborative tone, not an interrogation tone.

---

## Chatting

The user and LLM exchange messages freely. The LLM's role here is to:

- Ask follow-up questions that help the user go deeper
- Notice interesting or specific things the user says and reflect them back
- Offer angles or framings the user hasn't considered, without pushing toward any particular answer
- Not summarise prematurely — the goal is to keep the user talking and discovering, not to close things off

The LLM has the full world context available: the world's name, genre, tone, and all interview answers submitted so far. It can and should reference these to make the discussion feel grounded and specific to *this* world, not generic worldbuilding advice.

If the user picks an A/B/C option during the chat (see below), the LLM acknowledges it and can use it as a starting point for deeper discussion: "So you're drawn to the Protection vs Legibility angle — what specifically about that resonates?"

---

## A/B/C Options in Discuss Mode

The three pre-written options are always visible during Discuss mode, shown below the chat panel in a compact form. They function as **anchors**, not as final answers.

Clicking an option in Discuss mode does two things:
1. Posts a message in the chat from the user: something like *"I'm drawn to option B — [option title]"* — short, not the full option text.
2. The LLM responds to that choice as a conversation starter.

The option is *not* immediately submitted as the final answer. It enters the conversation. The user can then discuss it, modify it, push back on it, or ultimately use it as the basis for their synthesised answer.

This distinguishes the Discuss flow from the Submit flow, where clicking A/B/C submits immediately.

---

## Synthesising the Answer

Once at least one exchange has occurred, a **"Synthesise answer"** button appears at the bottom of the chat panel (above the message input, or below the A/B/C options — whichever feels less intrusive).

When the user clicks it:

1. The chat panel slides up or compresses slightly
2. A new section appears below the chat: **"Your answer"** — a text field, pre-populated with an LLM-drafted answer synthesised from the conversation
3. The LLM has drafted this as a clean, first-person, declarative world answer — not a summary of the conversation, but the *answer itself*, in the same voice and format as a manually written answer or an A/B/C pick
4. The user can edit the field freely
5. A **Submit** button appears below the field

The synthesised answer reflects the substance of what the user arrived at in the chat. If they picked option B as a starting point and then refined it, the synthesis incorporates those refinements. It is not a verbatim transcript — it is a clean, usable answer.

---

## LLM Confirmation Step

After the user hits Submit (from the synthesised answer field), the LLM gives a brief confirmation — echoing back what was just locked in. This mirrors the existing behaviour when a user picks an A/B/C option directly.

The confirmation is short: one or two sentences restating the answer in a slightly different form. Its purpose is to give the user a moment to confirm they said what they meant, before the interview advances to the next question.

If the user wants to change their answer at this point, there is a small **"Change answer"** link or button that returns them to the active card — either back into the text field or back into Discuss mode.

---

## Exiting Discuss Mode

If the user clicks **Submit** (the original mode button) at any point before the discussion starts, nothing is lost — they simply see the text input and can answer normally.

If the user has started a Discuss chat and wants to abandon it without submitting, there is a small **"Cancel discussion"** control (link-weight, not a button) at the top of the chat panel. This collapses the chat and returns to the two-button state (Submit / Discuss). The chat history is discarded.

There is no auto-save of in-progress discussions. Discuss mode is ephemeral until Submit is clicked.

---

## Relationship to the Existing Flow

This feature does not change any submitted answers or the downstream interview logic. Once an answer is submitted — whether via Submit mode, via A/B/C in Submit mode, or via Discuss + Synthesise — it enters the interview state exactly as it does today.

The only change is *how* the user arrives at their answer for any given question. The output is identical.

---

## States Summary

| State | What the user sees |
|---|---|
| Default | Question text + Submit / Discuss buttons + A/B/C options |
| Submit mode | Question text + text input + A/B/C options (submit on pick) + Submit button |
| Discuss mode — no messages yet | Question text + empty chat panel + message input + A/B/C options (compact) |
| Discuss mode — in conversation | Question text + chat thread + message input + A/B/C options + Synthesise answer button |
| Discuss mode — synthesised | Question text + chat (compressed) + editable answer field (pre-filled) + Submit button |
| Submitted | Question collapses to answered state (existing behaviour) |

---

## Edge Cases

**User opens Discuss, sends nothing, clicks Synthesise** — shouldn't be possible; the Synthesise button only appears after at least one exchange. If somehow triggered with no content, the LLM returns an empty draft and the user must fill it manually.

**Very long discussions** — the chat panel has a max height with internal scroll. The card does not grow indefinitely.

**User submits a blank answer** — same validation as current: Submit is disabled if the answer field is empty.

**Multiple questions open** — only one question card can be in Discuss mode at a time. If the user navigates away from a question mid-discussion, the discussion is abandoned (same as Cancel).
