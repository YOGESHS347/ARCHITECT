path = r'c:\Users\yoges\OneDrive\Desktop\architect\AI-Architect\frontend\src\modules\editor\components\CopilotAgentPanel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Normalize \r\n
text = text.replace('\r\n', '\n')

# 1. Main container style
text = text.replace(
    "borderRadius: '12px',\n        border: '1px solid rgba(0, 242, 254, 0.2)',\n        background: '#0E121B',\n        boxShadow: '0 8px 32px -4px rgba(0, 242, 254, 0.08), 0 0 1px 1px rgba(0, 242, 254, 0.15)',",
    "borderRadius: '8px',\n        border: '1px solid #E7E1D5',\n        background: '#FFFFFF',\n        boxShadow: '0 4px 20px rgba(37, 38, 34, 0.06)',"
)

# 2. Header strip
text = text.replace(
    "padding: '0.85rem 1.25rem',\n          borderBottom: '1px solid rgba(0, 242, 254, 0.15)',\n          display: 'flex',\n          justifyContent: 'space-between',\n          alignItems: 'center',\n          background: 'linear-gradient(90deg, #090A0F 0%, #0E121B 100%)',",
    "padding: '0.85rem 1.25rem',\n          borderBottom: '1px solid #E7E1D5',\n          display: 'flex',\n          justifyContent: 'space-between',\n          alignItems: 'center',\n          background: '#FAF8F2',"
)

# Header icon box
text = text.replace(
    "background: 'rgba(0, 242, 254, 0.15)',\n              border: '1px solid #00F2FE',\n              display: 'flex',\n              alignItems: 'center',\n              justifyContent: 'center',\n              color: '#00F2FE',\n              boxShadow: '0 0 10px rgba(0, 242, 254, 0.25)',",
    "background: '#252622',\n              border: '1px solid #252622',\n              display: 'flex',\n              alignItems: 'center',\n              justifyContent: 'center',\n              color: '#FAF8F2',\n              boxShadow: '0 2px 6px rgba(37, 38, 34, 0.12)',"
)

# Header title
text = text.replace(
    "color: '#FFFFFF',\n                display: 'flex',\n                alignItems: 'center',\n                gap: '0.5rem',\n                fontFamily: \"'JetBrains Mono', monospace\",\n                letterSpacing: '0.04em',",
    "color: '#252622',\n                display: 'flex',\n                alignItems: 'center',\n                gap: '0.5rem',\n                fontFamily: \"'Newsreader', Georgia, serif\",\n                letterSpacing: '-0.01em',\n                fontSize: '1.05rem',"
)

# Header badge
text = text.replace("AI COPILOT // HUD", "Studio Copilot // Natural CAD")
text = text.replace(
    "background: 'rgba(0, 242, 254, 0.12)',\n                  color: '#00F2FE',\n                  border: '1px solid rgba(0, 242, 254, 0.3)',",
    "background: 'rgba(54, 95, 168, 0.08)',\n                  color: '#365FA8',\n                  border: '1px solid rgba(54, 95, 168, 0.25)',\n                  fontFamily: \"'JetBrains Mono', monospace\","
)

# 3. Active Context Bar
text = text.replace(
    "padding: '0.45rem 1.25rem',\n          background: '#090A0F',\n          borderBottom: '1px solid rgba(0, 242, 254, 0.1)',",
    "padding: '0.45rem 1.25rem',\n          background: '#F3F0E7',\n          borderBottom: '1px solid #E7E1D5',"
)
text = text.replace("<Layers size={12} style={{ color: '#00F2FE' }} />", "<Layers size={12} style={{ color: '#365FA8' }} />")
text = text.replace("<strong style={{ color: '#00F2FE' }}>", "<strong style={{ color: '#252622' }}>")
text = text.replace(
    "background: 'rgba(168, 85, 247, 0.15)',\n                color: '#C084FC',\n                border: '1px solid rgba(168, 85, 247, 0.3)',",
    "background: 'rgba(216, 87, 64, 0.08)',\n                color: '#D85740',\n                border: '1px solid #D85740',"
)
text = text.replace("<Compass size={12} style={{ color: '#10B981' }} />", "<Compass size={12} style={{ color: '#B89A64' }} />")
text = text.replace("<strong style={{ color: '#E2E8F0' }}>", "<strong style={{ color: '#252622' }}>")

# 4. Message Thread Area
text = text.replace(
    "padding: '1rem 1.25rem',\n          height: '320px',\n          overflowY: 'auto',\n          display: 'flex',\n          flexDirection: 'column',\n          gap: '0.85rem',\n          background: '#090A0F',",
    "padding: '1rem 1.25rem',\n          height: '320px',\n          overflowY: 'auto',\n          display: 'flex',\n          flexDirection: 'column',\n          gap: '0.85rem',\n          background: '#FAF8F2',"
)
text = text.replace("color: isUser ? '#38BDF8' : '#00F2FE',", "color: isUser ? '#252622' : '#365FA8',")
text = text.replace("<Bot size={11} style={{ color: '#00F2FE' }} />", "<Bot size={11} style={{ color: '#365FA8' }} />")

# User & Assistant Bubbles
text = text.replace(
    "background: isUser\n                    ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)'\n                    : 'rgba(14, 18, 27, 0.85)',\n                  color: isUser ? '#FFFFFF' : '#E2E8F0',\n                  border: isUser\n                    ? '1px solid rgba(0, 242, 254, 0.4)'\n                    : '1px solid rgba(0, 242, 254, 0.18)',\n                  boxShadow: isUser\n                    ? '0 0 15px rgba(0, 242, 254, 0.12)'\n                    : '0 4px 12px rgba(0, 0, 0, 0.3)',",
    "background: isUser ? '#252622' : '#FFFFFF',\n                  color: isUser ? '#FAF8F2' : '#252622',\n                  border: isUser ? '1px solid #252622' : '1px solid #E7E1D5',\n                  boxShadow: isUser ? '0 2px 8px rgba(37, 38, 34, 0.12)' : '0 2px 8px rgba(37, 38, 34, 0.04)',"
)

# Operation badge inside assistant message
text = text.replace("background: 'rgba(9, 10, 15, 0.7)',", "background: '#FAF8F2',")

# 5. Quick Suggestions Bar
text = text.replace(
    "padding: '0.45rem 1.25rem',\n          background: '#090A0F',\n          borderTop: '1px solid rgba(0, 242, 254, 0.1)',",
    "padding: '0.45rem 1.25rem',\n          background: '#FAF8F2',\n          borderTop: '1px solid #E7E1D5',"
)
text = text.replace(
    "border: '1px solid rgba(0, 242, 254, 0.2)',\n              background: 'rgba(14, 18, 27, 0.8)',\n              color: '#94A3B8',",
    "border: '1px solid #E7E1D5',\n              background: '#FFFFFF',\n              color: '#474943',"
)
text = text.replace(
    "e.currentTarget.style.borderColor = '#00F2FE';\n                e.currentTarget.style.color = '#00F2FE';\n                e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 242, 254, 0.25)';",
    "e.currentTarget.style.borderColor = '#365FA8';\n                e.currentTarget.style.color = '#365FA8';\n                e.currentTarget.style.boxShadow = '0 2px 6px rgba(54, 95, 168, 0.12)';"
)
text = text.replace("e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.2)';", "e.currentTarget.style.borderColor = '#E7E1D5';")
text = text.replace("e.currentTarget.style.color = '#94A3B8';", "e.currentTarget.style.color = '#474943';")

# 6. Chat Input Area
text = text.replace(
    "padding: '0.75rem 1.25rem',\n          borderTop: '1px solid rgba(0, 242, 254, 0.15)',\n          background: '#0E121B',",
    "padding: '0.75rem 1.25rem',\n          borderTop: '1px solid #E7E1D5',\n          background: '#FAF8F2',"
)
text = text.replace(
    "border: '1px solid rgba(0, 242, 254, 0.25)',\n            background: disabled ? '#090A0F' : '#090A0F',\n            color: '#FFFFFF',",
    "border: '1px solid #E7E1D5',\n            background: '#FFFFFF',\n            color: '#252622',\n            fontFamily: \"'Plus Jakarta Sans', sans-serif\","
)
text = text.replace("e.currentTarget.style.borderColor = '#00F2FE'", "e.currentTarget.style.borderColor = '#365FA8'")
text = text.replace("e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.25)'", "e.currentTarget.style.borderColor = '#E7E1D5'")

# Send Button
text = text.replace(
    "background:\n              loading || !inputValue.trim() || disabled\n                ? 'rgba(255,255,255,0.08)'\n                : 'linear-gradient(135deg, #00F2FE, #0284C7)',\n            color: loading || !inputValue.trim() || disabled ? '#64748B' : '#090A0F',",
    "background: loading || !inputValue.trim() || disabled ? '#E7E1D5' : '#252622',\n            color: loading || !inputValue.trim() || disabled ? '#777970' : '#FAF8F2',"
)
text = text.replace("0 0 15px rgba(0, 242, 254, 0.35)", "0 2px 8px rgba(37, 38, 34, 0.15)")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated CopilotAgentPanel.tsx to Atelier aesthetic!")
