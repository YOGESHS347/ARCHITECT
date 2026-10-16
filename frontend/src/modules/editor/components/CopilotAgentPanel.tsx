import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Send,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Layers,
  Compass,
  Trash2,
  Bot,
  User,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  sendAgentChat,
  getAgentHistory,
  type AgentChatMessage,
  type LayoutData,
  type VastuResult,
  type NbcResult,
  type EnergyResult,
  type SunlightResult,
  type BomResult,
} from '../../../shared/api-client/api';

interface PlotContext {
  plotWidth: number;
  plotHeight: number;
  entryDir: string;
  [key: string]: any;
}

interface CopilotAgentPanelProps {
  projectId?: string;
  currentLayout: LayoutData;
  activeFloorLevel: number;
  activeFloorName?: string;
  selectedRoomName?: string | null;
  plotContext: PlotContext;
  onApplyLayout: (
    updatedLayout: LayoutData,
    imageUrl?: string | null,
    compliance?: {
      vastu?: VastuResult;
      nbc?: NbcResult;
      energy?: EnergyResult;
      sunlight?: SunlightResult;
      bom?: BomResult;
    }
  ) => void;
  disabled?: boolean;
}

const QUICK_SUGGESTIONS = [
  'Expand Master Bedroom by 2 ft',
  'Swap Kitchen and Dining',
  'Place 3-Seater Sofa in Living Room',
  'Add Warm Chandelier in Living Room',
  'Convert Bedroom 2 to Home Office',
  'Check Vastu alignment for entrance',
  'Shift Living Room right by 1.5 ft',
];

export function CopilotAgentPanel({
  projectId,
  currentLayout,
  activeFloorLevel,
  activeFloorName = 'Ground Floor',
  selectedRoomName,
  plotContext,
  onApplyLayout,
  disabled = false,
}: CopilotAgentPanelProps) {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [lastWarning, setLastWarning] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history when projectId or component mounts
  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setHistoryLoading(true);
      try {
        const res = await getAgentHistory(projectId);
        if (isMounted) {
          if (res.conversation_id) {
            setConversationId(res.conversation_id);
          }
          if (res.messages && res.messages.length > 0) {
            setMessages(res.messages);
          } else {
            // Initial welcome message if no history exists
            setMessages([
              {
                sender: 'agent',
                content:
                  '⚡ System Initialized: AI Architectural Copilot ready. State your geometric modifications—such as room resizing, spatial translations, furniture layouts, or Vastu queries. All actions execute through deterministic geometry solvers.',
                created_at: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (err) {
        console.warn('Could not load agent conversation history:', err);
        if (isMounted) {
          setMessages([
            {
              sender: 'agent',
              content:
                '⚡ System Initialized: AI Architectural Copilot online. How would you like to modify the active plate today?',
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        if (isMounted) setHistoryLoading(false);
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText ?? inputValue).trim();
    if (!textToSend || loading || disabled) return;

    setInputValue('');
    setLastWarning(null);

    // Append user message optimistically
    const userMsg: AgentChatMessage = {
      sender: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await sendAgentChat({
        project_id: projectId,
        message: textToSend,
        current_layout: currentLayout,
        active_floor_level: activeFloorLevel,
        plot_width: plotContext.plotWidth,
        plot_height: plotContext.plotHeight,
        entry_dir: plotContext.entryDir,
        conversation_id: conversationId,
      });

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      // Append agent response
      const agentMsg: AgentChatMessage = {
        sender: 'agent',
        content: response.reply,
        operation: response.operation,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, agentMsg]);

      // Check for geometric warnings
      if (response.warnings && response.warnings.length > 0) {
        setLastWarning(response.warnings.join(' • '));
      }

      // If layout was modified successfully, sync to editor
      if (response.updated_layout) {
        onApplyLayout(
          response.updated_layout,
          response.imageUrl,
          response.compliance
        );
        toast.success(
          `⚡ Layout modified: ${response.operation?.action || 'Updated'}`,
          { id: 'copilot-action' }
        );
      } else if (response.operation?.action !== 'general_advice') {
        if (response.warnings && response.warnings.length > 0) {
          toast(response.warnings[0], {
            icon: '⚠️',
            style: { background: '#1E293B', color: '#FCD34D', border: '1px solid #F59E0B' },
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Agent error: ${msg}`, { id: 'copilot-error' });
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          content: `⚠️ An error occurred while executing command: ${msg}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'agent',
        content: 'System telemetry buffer reset. Standing by for spatial commands.',
        created_at: new Date().toISOString(),
      },
    ]);
    setLastWarning(null);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'resize_room':
        return '#00F2FE';
      case 'move_room':
        return '#A855F7';
      case 'swap_rooms':
        return '#38BDF8';
      case 'add_room':
        return '#10B981';
      case 'remove_room':
        return '#EF4444';
      case 'place_furniture':
        return '#F59E0B';
      case 'remove_furniture':
        return '#F97316';
      default:
        return '#00F2FE';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        border: '1px solid #E7E1D5',
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(37, 38, 34, 0.06)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header: Stark-Grade HUD strip ── */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid #E7E1D5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FAF8F2',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              background: '#252622',
              border: '1px solid #252622',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FAF8F2',
              boxShadow: '0 2px 6px rgba(37, 38, 34, 0.12)',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <div
              style={{
                fontWeight: 600,
                color: '#252622',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: "'Newsreader', Georgia, serif",
                letterSpacing: '-0.01em',
                fontSize: '1.15rem',
              }}
            >
              Studio Copilot // Natural CAD
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '3px',
                  background: 'rgba(54, 95, 168, 0.08)',
                  color: '#365FA8',
                  border: '1px solid rgba(54, 95, 168, 0.25)',
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                }}
              >
                GEOMETRY ENGINE
              </span>
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: '#94A3B8',
              }}
            >
              Deterministic spatial solver • Natural-language architectural CAD
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={handleClearChat}
            className="neu-btn-ghost"
            title="Clear Chat History"
            style={{
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── Active Context Bar ── */}
      <div
        style={{
          padding: '0.45rem 1.25rem',
          background: '#F3F0E7',
          borderBottom: '1px solid #E7E1D5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.72rem',
          flexWrap: 'wrap',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: '#94A3B8',
            fontWeight: 600,
          }}
        >
          <Layers size={12} style={{ color: '#365FA8' }} />
          <span>LEVEL:</span>
          <strong style={{ color: '#252622' }}>
            {activeFloorName.toUpperCase()} [L{activeFloorLevel}]
          </strong>
        </span>

        {selectedRoomName && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: '#94A3B8',
              fontWeight: 600,
            }}
          >
            <Sliders size={12} style={{ color: '#A855F7' }} />
            <span>SELECTED:</span>
            <span
              style={{
                background: 'rgba(216, 87, 64, 0.08)',
                color: '#D85740',
                border: '1px solid #D85740',
                padding: '0px 5px',
                borderRadius: '3px',
                fontWeight: 700,
              }}
            >
              {selectedRoomName}
            </span>
          </span>
        )}

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: '#64748B',
            marginLeft: 'auto',
          }}
        >
          <Compass size={12} style={{ color: '#B89A64' }} />
          <span>PLOT:</span>
          <strong style={{ color: '#252622' }}>
            {plotContext.plotWidth}×{plotContext.plotHeight} ft ({plotContext.entryDir.toUpperCase()})
          </strong>
        </span>
      </div>

      {/* ── Warning Alert (if any) ── */}
      {lastWarning && (
        <div
          style={{
            margin: '0.65rem 1.25rem 0 1.25rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#FCD34D',
            fontSize: '0.74rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.45rem',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px', color: '#F59E0B' }} />
          <div>
            <strong>GEOMETRIC CONSTRAINT:</strong> {lastWarning}
          </div>
        </div>
      )}

      {/* ── Message Thread ── */}
      <div
        style={{
          padding: '1rem 1.25rem',
          height: '320px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          background: '#FAF8F2',
        }}
      >
        {historyLoading && messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#64748B',
              fontSize: '0.8rem',
              gap: '0.5rem',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <RefreshCw size={15} className="spin" style={{ color: '#00F2FE' }} />
            <span>ESTABLISHING TELEMETRY STREAM...</span>
          </div>
        ) : null}

        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                gap: '0.25rem',
              }}
            >
              {/* Sender label */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.68rem',
                  color: isUser ? '#252622' : '#365FA8',
                  fontWeight: 700,
                  padding: '0 0.25rem',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {isUser ? (
                  <>
                    <span>OPERATOR</span>
                    <User size={10} />
                  </>
                ) : (
                  <>
                    <Bot size={11} style={{ color: '#365FA8' }} />
                    <span>ARCHITECTURAL AGENT // SOLVER</span>
                  </>
                )}
              </div>

              {/* Message bubble */}
              <div
                style={{
                  maxWidth: '85%',
                  padding: '0.75rem 0.95rem',
                  borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: isUser ? '#252622' : '#FFFFFF',
                  color: isUser ? '#FAF8F2' : '#252622',
                  border: isUser ? '1px solid #252622' : '1px solid #E7E1D5',
                  boxShadow: isUser ? '0 2px 8px rgba(37, 38, 34, 0.12)' : '0 2px 8px rgba(37, 38, 34, 0.04)',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}

                {/* Operation Pill Badge */}
                {msg.operation && msg.operation.action !== 'general_advice' && (
                  <div
                    style={{
                      marginTop: '0.6rem',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      background: '#FAF8F2',
                      border: `1px solid ${getActionBadgeColor(msg.operation.action)}40`,
                      fontSize: '0.72rem',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 700,
                        color: getActionBadgeColor(msg.operation.action),
                        marginBottom: '0.2rem',
                      }}
                    >
                      <Zap size={12} />
                      <span>[ACTION: {msg.operation.action.toUpperCase()}]</span>
                      {msg.operation.target_room_name && (
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            color: '#FFFFFF',
                          }}
                        >
                          Target: {msg.operation.target_room_name}
                        </span>
                      )}
                    </div>

                    {msg.operation.parameters &&
                      Object.keys(msg.operation.parameters).length > 0 && (
                        <div
                          style={{
                            fontSize: '0.68rem',
                            opacity: 0.8,
                            color: '#94A3B8',
                            marginTop: '2px',
                          }}
                        >
                          {Object.entries(msg.operation.parameters)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ')}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading indicator with typing cursor */}
        {loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.65rem 0.95rem',
              borderRadius: '12px 12px 12px 2px',
              background: 'rgba(14, 18, 27, 0.85)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              width: 'fit-content',
              fontSize: '0.78rem',
              color: '#00F2FE',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                border: '2px solid rgba(0, 242, 254, 0.2)',
                borderTopColor: '#00F2FE',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span>SOLVING SPATIAL MATRIX...</span>
            <span style={{ animation: 'pulse 1s infinite', fontWeight: 800 }}>▌</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Suggestions Bar ── */}
      <div
        style={{
          padding: '0.45rem 1.25rem',
          background: '#FAF8F2',
          borderTop: '1px solid #E7E1D5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
        }}
      >
        <span
          style={{
            fontSize: '0.65rem',
            color: '#64748B',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          SUGGESTIONS:
        </span>
        {QUICK_SUGGESTIONS.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(sug)}
            disabled={loading || disabled}
            style={{
              fontSize: '0.7rem',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #E7E1D5',
              background: '#FFFFFF',
              color: '#474943',
              cursor: loading || disabled ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              fontFamily: "'JetBrains Mono', monospace",
            }}
            onMouseEnter={e => {
              if (!loading && !disabled) {
                e.currentTarget.style.borderColor = '#365FA8';
                e.currentTarget.style.color = '#365FA8';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(54, 95, 168, 0.12)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E7E1D5';
              e.currentTarget.style.color = '#474943';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {sug}
          </button>
        ))}
      </div>

      {/* ── Chat Input ── */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid #E7E1D5',
          background: '#FAF8F2',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={inputRef}
          rows={2}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? 'Generate or load a layout first...'
              : 'e.g., Expand Master Bedroom by 2 ft, swap kitchen & dining, add sofa...'
          }
          disabled={loading || disabled}
          style={{
            flex: 1,
            resize: 'none',
            fontSize: '0.82rem',
            padding: '0.55rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #E7E1D5',
            background: '#FFFFFF',
            color: '#252622',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            outline: 'none',
            lineHeight: 1.4,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#365FA8')}
          onBlur={e => (e.currentTarget.style.borderColor = '#E7E1D5')}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputValue.trim() || disabled}
          style={{
            height: '40px',
            padding: '0 1.1rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            fontWeight: 800,
            background: loading || !inputValue.trim() || disabled ? '#E7E1D5' : '#252622',
            color: loading || !inputValue.trim() || disabled ? '#777970' : '#FAF8F2',
            cursor:
              loading || !inputValue.trim() || disabled
                ? 'not-allowed'
                : 'pointer',
            border: 'none',
            boxShadow:
              loading || !inputValue.trim() || disabled
                ? 'none'
                : '0 2px 8px rgba(37, 38, 34, 0.15)',
            transition: 'all 0.15s ease',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.04em',
          }}
        >
          {loading ? (
            <div
              style={{
                width: '14px',
                height: '14px',
                border: '2px solid rgba(0,0,0,0.2)',
                borderTopColor: '#090A0F',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          ) : (
            <>
              <span>SEND</span>
              <Send size={13} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default CopilotAgentPanel;
