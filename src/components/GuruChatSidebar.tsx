import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Compass,
  ExternalLink,
  KeyRound,
  SendHorizontal,
  Sparkles,
  Swords,
  Trash2,
  X,
} from 'lucide-react';
import {
  GENSHIN_GURU_SKILL_NAME,
  GENSHIN_GURU_SKILL_URL,
  GENSHIN_GURU_STARTER_PROMPTS,
} from '../data/genshinGuruSkill';
import { BATTLE_READY_LEVEL } from '../engine/teamAnalyzer';
import type { GuruChatMessage } from '../services/guruChatEngine';
import type { Character, TeamRecommendation } from '../types/genshin';
import { CharacterPortrait } from './CharacterPortrait';
import { PrimogemStar } from './NationEmblem';

interface GuruChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: GuruChatMessage[];
  isThinking: boolean;
  hasGeminiKey: boolean;
  roster: Character[];
  activeTeam: TeamRecommendation | null;
  includeUnbuilt: boolean;
  onSendMessage: (question: string) => void;
  onClearChat: () => void;
  onLoadTeamInCircle: (team: TeamRecommendation) => void;
  onSendToAbyss: (members: Character[], label: string, half: 1 | 2) => void;
  onLoadAbyssPair: (
    half1: TeamRecommendation,
    half2: TeamRecommendation
  ) => void;
  onInspectCharacter: (char: Character) => void;
  onOpenSettings: () => void;
  onCopyAndOpenSkill: (promptText: string) => void;
}

/**
 * Lightweight, XSS-safe inline formatter for **bold** and *italic* segments.
 */
function renderInlineText(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return <strong key={idx}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return <em key={idx}>{token.slice(1, -1)}</em>;
    }
    return <span key={idx}>{token}</span>;
  });
}

function FormattedReply({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="guru-reply-text">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={i} className="guru-reply-spacer" />;
        }
        const headingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
        if (headingMatch) {
          return (
            <div key={i} className="guru-reply-heading">
              {renderInlineText(headingMatch[1])}
            </div>
          );
        }

        const isBullet =
          trimmed.startsWith('• ') ||
          trimmed.startsWith('- ') ||
          /^\d+\.\s/.test(trimmed);

        if (isBullet) {
          return (
            <div key={i} className="guru-reply-bullet">
              {renderInlineText(trimmed)}
            </div>
          );
        }

        return (
          <p key={i} className="guru-reply-para">
            {renderInlineText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export function GuruChatSidebar({
  isOpen,
  onClose,
  messages,
  isThinking,
  hasGeminiKey,
  roster,
  activeTeam,
  includeUnbuilt,
  onSendMessage,
  onClearChat,
  onLoadTeamInCircle,
  onSendToAbyss,
  onLoadAbyssPair,
  onInspectCharacter,
  onOpenSettings,
  onCopyAndOpenSkill,
}: GuruChatSidebarProps) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const readyCount = useMemo(
    () => roster.filter((c) => c.level >= BATTLE_READY_LEVEL).length,
    [roster]
  );

  const starterPrompts = useMemo(() => {
    const list = [...GENSHIN_GURU_STARTER_PROMPTS];
    if (activeTeam) {
      return ['Review my current Team Circle', ...list.slice(0, 4)];
    }
    return list;
  }, [activeTeam]);

  // Auto-scroll to newest message
  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isThinking, isOpen]);

  // Focus composer when sidebar opens
  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned || isThinking) return;
    setDraft('');
    onSendMessage(cleaned);
  };

  const lastUserQuestion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return '';
  }, [messages]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile / medium-viewport backdrop */}
      <div
        className="guru-sidebar-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="guru-chat-sidebar"
        className="guru-sidebar"
        aria-label="Genshin Guru Skill Chat"
      >
        {/* Header */}
        <div className="guru-sidebar-header">
          <div className="guru-sidebar-brand">
            <span className="guru-sidebar-crest" aria-hidden="true">
              <PrimogemStar size={14} color="var(--gold-bright)" />
            </span>
            <div className="guru-sidebar-title-wrap">
              <div className="guru-sidebar-title-row">
                <h2 className="guru-sidebar-title">
                  {GENSHIN_GURU_SKILL_NAME}
                </h2>
                <span
                  className={`guru-mode-pill ${hasGeminiKey ? 'live' : ''}`}
                  title={
                    hasGeminiKey
                      ? 'Connected to Gemini API with your Genshin Guru skill instructions and live roster'
                      : 'Running built-in Genshin Guru Skill Engine grounded in your live roster. Add a Gemini API key in Settings for open-ended AI chat.'
                  }
                >
                  <span className="guru-mode-dot" aria-hidden="true" />
                  {hasGeminiKey ? 'Gemini Skill' : 'Skill Engine'}
                </span>
              </div>
              <div className="guru-sidebar-sub">
                Grounded in your live Genshin Roster ({roster.length})
              </div>
            </div>
          </div>

          <div className="guru-sidebar-actions">
            <a
              href={GENSHIN_GURU_SKILL_URL}
              target="_blank"
              rel="noreferrer"
              className="ghost-action guru-icon-btn"
              title="Open Genshin Guru Skill in Gemini"
              aria-label="Open Genshin Guru Skill in Gemini"
            >
              <ExternalLink size={14} />
            </a>
            {messages.length > 0 && (
              <button
                type="button"
                className="ghost-action guru-icon-btn"
                onClick={onClearChat}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              type="button"
              className="ghost-action guru-icon-btn"
              onClick={onClose}
              title="Close Genshin Guru sidebar (⌘/)"
              aria-label="Close Genshin Guru sidebar"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="guru-messages" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="guru-empty-state">
              <div className="guru-empty-orb" aria-hidden="true">
                <PrimogemStar size={22} color="var(--gold-bright)" />
              </div>
              <h3 className="guru-empty-heading">Ask your Genshin Guru</h3>
              <p className="guru-empty-copy">
                Ask about team comps, boss counters, character builds,
                constellations, Spiral Abyss, or who to level next — grounded
                directly in your <strong>Genshin Roster</strong> ({readyCount}{' '}
                of {roster.length} battle-ready).
              </p>

              <div className="guru-starter-list">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="guru-starter-chip"
                    onClick={() => onSendMessage(prompt)}
                  >
                    <Sparkles size={12} className="guru-chip-icon" />
                    <span>{prompt}</span>
                    <ArrowUpRight size={12} className="guru-chip-arrow" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isLatest = idx === messages.length - 1;
              return (
                <div
                  key={msg.id}
                  className={`guru-msg guru-msg-${msg.role}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="guru-msg-meta">
                      <PrimogemStar size={10} color="var(--gold)" />
                      <span>Genshin Guru</span>
                      {msg.engine === 'gemini-skill' && (
                        <span className="guru-meta-tag">Gemini AI</span>
                      )}
                    </div>
                  )}

                  <div className="guru-bubble">
                    {msg.role === 'user' ? (
                      <div className="guru-user-text">{msg.content}</div>
                    ) : (
                      <FormattedReply content={msg.content} />
                    )}

                    {msg.fallbackNote && (
                      <div className="guru-fallback-note">
                        {msg.fallbackNote}
                      </div>
                    )}

                    {/* Interactive Single Team Recommendation Card */}
                    {msg.suggestedTeam && (
                      <div className="guru-team-card">
                        <div className="guru-team-card-head">
                          <div>
                            <div className="guru-team-card-title">
                              {msg.suggestedTeam.title}
                            </div>
                            <div className="guru-team-card-sub">
                              {msg.suggestedTeam.subtitle} · Score{' '}
                              <strong>
                                {msg.suggestedTeam.analysis.score}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="guru-team-portraits">
                          {msg.suggestedTeam.members.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              className="guru-team-member-btn"
                              onClick={() => onInspectCharacter(member)}
                              title={`Inspect ${member.name} build guide`}
                            >
                              <CharacterPortrait character={member} size={38} />
                              <span className="guru-member-name">
                                {member.name}
                              </span>
                              <span
                                className={`guru-member-lv ${
                                  member.level < BATTLE_READY_LEVEL
                                    ? 'unbuilt'
                                    : ''
                                }`}
                              >
                                Lv {member.level}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="guru-team-card-actions">
                          <button
                            type="button"
                            className="btn-wish guru-card-primary"
                            onClick={() =>
                              onLoadTeamInCircle(msg.suggestedTeam!)
                            }
                          >
                            <Compass size={12} />
                            Load in Circle
                          </button>
                          <button
                            type="button"
                            className="ghost-action guru-card-mini"
                            onClick={() =>
                              onSendToAbyss(
                                msg.suggestedTeam!.members,
                                msg.suggestedTeam!.title,
                                1
                              )
                            }
                          >
                            Abyss H1
                          </button>
                          <button
                            type="button"
                            className="ghost-action guru-card-mini"
                            onClick={() =>
                              onSendToAbyss(
                                msg.suggestedTeam!.members,
                                msg.suggestedTeam!.title,
                                2
                              )
                            }
                          >
                            Abyss H2
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Interactive Dual Spiral Abyss Card */}
                    {msg.suggestedAbyss && (
                      <div className="guru-team-card">
                        <div className="guru-abyss-row">
                          <span className="guru-abyss-label">Half 1</span>
                          <div className="avatar-stack">
                            {msg.suggestedAbyss.half1.members.map((m) => (
                              <CharacterPortrait
                                key={m.id}
                                character={m}
                                size={30}
                              />
                            ))}
                          </div>
                          <span className="guru-abyss-score">
                            {msg.suggestedAbyss.half1.analysis.score}
                          </span>
                        </div>

                        <div className="guru-abyss-row">
                          <span className="guru-abyss-label">Half 2</span>
                          <div className="avatar-stack">
                            {msg.suggestedAbyss.half2.members.map((m) => (
                              <CharacterPortrait
                                key={m.id}
                                character={m}
                                size={30}
                              />
                            ))}
                          </div>
                          <span className="guru-abyss-score">
                            {msg.suggestedAbyss.half2.analysis.score}
                          </span>
                        </div>

                        <div className="guru-team-card-actions">
                          <button
                            type="button"
                            className="btn-wish guru-card-primary"
                            onClick={() =>
                              onLoadAbyssPair(
                                msg.suggestedAbyss!.half1,
                                msg.suggestedAbyss!.half2
                              )
                            }
                          >
                            <Swords size={12} />
                            Load Both into Abyss
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Clickable Mentioned Character Build Chips */}
                    {msg.mentionedCharacters &&
                      msg.mentionedCharacters.length > 0 &&
                      !msg.suggestedTeam && (
                        <div className="guru-char-chips">
                          {msg.mentionedCharacters.map((char) => (
                            <button
                              key={char.id}
                              type="button"
                              className="guru-char-chip"
                              onClick={() => onInspectCharacter(char)}
                              title={`Open ${char.name} build & artifact guide`}
                            >
                              <CharacterPortrait character={char} size={22} />
                              <span>{char.name}</span>
                              <span className="guru-char-chip-lv">
                                Lv {char.level}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Follow-up suggestions on latest Guru response */}
                  {msg.role === 'assistant' && isLatest && !isThinking && (
                    <div className="guru-followups">
                      {msg.followUps?.map((fu) => (
                        <button
                          key={fu}
                          type="button"
                          className="guru-followup-chip"
                          onClick={() => onSendMessage(fu)}
                        >
                          {fu}
                        </button>
                      ))}
                      {lastUserQuestion && (
                        <button
                          type="button"
                          className="guru-followup-chip skill-handoff"
                          onClick={() => onCopyAndOpenSkill(lastUserQuestion)}
                          title="Copy your question and open your Gemini Genshin Guru skill"
                        >
                          <span>Continue in Gemini Skill</span>
                          <ExternalLink size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isThinking && (
            <div className="guru-msg guru-msg-assistant">
              <div className="guru-msg-meta">
                <PrimogemStar size={10} color="var(--gold)" />
                <span>Genshin Guru</span>
              </div>
              <div className="guru-bubble guru-thinking">
                <span className="guru-thinking-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span>Consulting your Genshin Roster…</span>
              </div>
            </div>
          )}
        </div>

        {/* Composer Footer */}
        <form className="guru-composer-wrap" onSubmit={handleSubmit}>
          <div className="guru-context-strip">
            <span>Pool: {includeUnbuilt ? 'Lv 1–90' : 'Lv 70+'}</span>
            {activeTeam && (
              <span className="guru-context-circle">
                Circle: {activeTeam.title}
              </span>
            )}
          </div>

          <div className="guru-composer-box">
            <textarea
              ref={inputRef}
              id="guru-chat-input"
              className="guru-composer-input"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask Genshin Guru about teams, bosses, builds…"
              disabled={isThinking}
            />
            <button
              id="guru-chat-send"
              type="submit"
              className="guru-send-btn"
              disabled={!draft.trim() || isThinking}
              aria-label="Send message to Genshin Guru"
              title="Send (Enter)"
            >
              <SendHorizontal size={15} />
            </button>
          </div>

          {!hasGeminiKey && (
            <div className="guru-key-hint">
              <button
                type="button"
                className="guru-key-hint-btn"
                onClick={onOpenSettings}
              >
                <KeyRound size={11} />
                <span>Add Gemini API key for full AI chat</span>
              </button>
              <span aria-hidden="true">·</span>
              <a
                href={GENSHIN_GURU_SKILL_URL}
                target="_blank"
                rel="noreferrer"
                className="guru-key-hint-link"
              >
                Open Skill <ExternalLink size={10} />
              </a>
            </div>
          )}
        </form>
      </aside>
    </>
  );
}
