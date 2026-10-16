path = r'c:\Users\yoges\OneDrive\Desktop\architect\AI-Architect\frontend\src\modules\editor\components\MultiFloorWizardModal.tsx'

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace any dark container cards
text = text.replace(
    "background: '#0E121B',\n                    padding: '1.25rem',\n                    borderRadius: '12px',\n                    border: '1px solid rgba(0, 242, 254, 0.15)',",
    "background: '#FFFFFF',\n                    padding: '1.25rem',\n                    borderRadius: '8px',\n                    border: '1px solid #E7E1D5',\n                    boxShadow: '0 2px 8px rgba(37, 38, 34, 0.04)',"
)

# Also single line instances if any
text = text.replace("background: '#0E121B'", "background: '#FFFFFF'")
text = text.replace("border: '1px solid rgba(0, 242, 254, 0.15)'", "border: '1px solid #E7E1D5'")
text = text.replace("border: '1px solid rgba(0, 242, 254, 0.25)'", "border: '1px solid #E7E1D5'")
text = text.replace("border: '1px solid rgba(0, 242, 254, 0.3)'", "border: '1px solid #E7E1D5'")
text = text.replace("color: '#00F2FE'", "color: '#252622'")

# Labels and descriptions
text = text.replace("color: '#94A3B8'", "color: '#777970'")
text = text.replace("color: '#64748B'", "color: '#777970'")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Cleaned up remaining tokens in MultiFloorWizardModal.tsx!")
