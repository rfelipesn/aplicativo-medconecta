import React from 'react';

/**
 * MEDconecta - Visual Canvas/Mockup
 * Mostra as principais telas do app mobile e dashboard do médico
 */

export default function AppMockup() {
  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '40px', fontFamily: 'Ubuntu, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      
      <h1 style={{ textAlign: 'center', color: '#1B5FA8', marginBottom: '60px', fontSize: '28px', fontWeight: 'bold' }}>
        📱 MEDconecta - Wireframes das Telas
      </h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '60px', marginBottom: '100px' }}>

        {/* ====== TELA 1: HOME PACIENTE ====== */}
        <PhoneFrame title="Home - Paciente">
          <div style={{ backgroundColor: '#1B5FA8', color: 'white', padding: '16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ margin: '0', fontSize: '14px' }}>Olá, João!</p>
            <h2 style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>Dr. Helton Bruno</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.95 }}>Neurologista</p>
          </div>

          {/* Botão Principal */}
          <button style={{ width: '100%', padding: '20px', backgroundColor: '#FF69B4', color: 'white', border: 'none', borderRadius: '12px', marginBottom: '16px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>🗣️</span>
            FALAR COM MEU MÉDICO
          </button>

          {/* Grid 2x2 - Botões Secundários */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <ButtonSecondary>📋<br/>Solicitar<br/>Receita</ButtonSecondary>
            <ButtonSecondary>💊<br/>Anotar<br/>Sintoma</ButtonSecondary>
            <ButtonSecondary>📸<br/>Enviar<br/>Exame</ButtonSecondary>
            <ButtonSecondary>📅<br/>Marcar<br/>Consulta</ButtonSecondary>
          </div>

          {/* Diários */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <ButtonSecondary>📊<br/>Diário de<br/>Cefaleia</ButtonSecondary>
            <ButtonSecondary>🧠<br/>Diário de<br/>Epilepsia</ButtonSecondary>
          </div>
        </PhoneFrame>

        {/* ====== TELA 2: CHAT COM MÉDICO ====== */}
        <PhoneFrame title="Chat - Falar com Médico">
          <div style={{ backgroundColor: '#1B5FA8', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0', fontSize: '15px', fontWeight: 'bold' }}>Dr. Helton Bruno</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', opacity: 0.85 }}>🟢 Online</p>
            </div>
            <span>⚙️</span>
          </div>

          {/* Mensagem Automática */}
          <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: '#333', lineHeight: '1.5' }}>
            <strong>Olá, João!</strong> Tudo bem? Aqui quem fala é o Dr. Helton.
            <br/><br/>
            Posso demorar um pouquinho para responder. Mas fique tranquilo, jajá te respondo pessoalmente.
            <br/><br/>
            Tudo o que você escrever fica salvo para eu ver com calma.
          </div>

          {/* Mensagem do Paciente */}
          <div style={{ textAlign: 'right', marginBottom: '12px' }}>
            <div style={{ backgroundColor: '#1B5FA8', color: 'white', padding: '10px 12px', borderRadius: '12px', display: 'inline-block', maxWidth: '85%', fontSize: '12px' }}>
              Oi doutor, tive uma crise ontem à noite
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#999' }}>14:23</p>
          </div>

          {/* Indicador de Digitação */}
          <div style={{ fontSize: '11px', color: '#999' }}>
            Dr. Helton está digitando... ✍️
          </div>

          {/* Input */}
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', gap: '8px' }}>
            <input type="text" placeholder="Escreva aqui..." style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '20px', fontSize: '12px' }} />
            <button style={{ backgroundColor: '#FF69B4', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>🎤</button>
            <button style={{ backgroundColor: '#FF69B4', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px' }}>→</button>
          </div>
        </PhoneFrame>

        {/* ====== TELA 3: DIÁRIO CEFALEIA - Tela 1 ====== */}
        <PhoneFrame title="Diário Cefaleia - Início">
          <h3 style={{ color: '#FF69B4', marginBottom: '16px', fontSize: '15px', fontWeight: 'bold' }}>Quando a crise começou?</h3>

          <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#999' }}>Início</p>
            <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#1B5FA8' }}>17 jun. 2026</p>
          </div>

          {/* Horários */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {['Madrugada', 'Manhã', 'Tarde', 'Noite', 'Agora', 'Exato'].map((t, i) => (
              <button key={i} style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: i === 4 ? 'none' : '1px solid #ddd',
                backgroundColor: i === 4 ? '#FF69B4' : 'white',
                color: i === 4 ? 'white' : '#333',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: i === 4 ? 'bold' : 'normal'
              }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '40px' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#999' }}>Fim</p>
            <p style={{ margin: '0', fontSize: '14px' }}>Não especificado</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ flex: 1, padding: '10px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Salvar</button>
            <button style={{ flex: 1, padding: '10px', backgroundColor: '#FF69B4', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Próximo →</button>
          </div>

          {/* Navigation Icons */}
          <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', backgroundColor: 'white', borderTop: '1px solid #eee', padding: '8px 0', display: 'flex', justifyContent: 'space-around', fontSize: '9px', color: '#FF69B4', textAlign: 'center', fontWeight: 'bold' }}>
            <div>📅<br/>Data</div>
            <div>⏱️<br/>Duração</div>
            <div>⚡<br/>Intensidade</div>
            <div>🔥<br/>Tipo</div>
            <div>📍<br/>Local</div>
          </div>
        </PhoneFrame>

        {/* ====== TELA 4: DIÁRIO CEFALEIA - Tela 5 "Onde dói?" ====== */}
        <PhoneFrame title="Diário Cefaleia - Onde dói?">
          <h3 style={{ color: '#FF69B4', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold' }}>Onde dói?</h3>

          {/* Toggle Frente/Verso */}
          <div style={{ display: 'flex', backgroundColor: '#f5f5f5', padding: '4px', borderRadius: '20px', marginBottom: '16px', gap: '4px' }}>
            <button style={{ flex: 1, padding: '6px', backgroundColor: '#FF69B4', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Frente</button>
            <button style={{ flex: 1, padding: '6px', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Verso</button>
          </div>

          {/* Cabeça com zonas */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '140px', lineHeight: '1', margin: '0 0 -20px 0' }}>🧠</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#999', fontWeight: 'bold', marginTop: '20px' }}>
              <span>À ESQUERDA</span>
              <span>À DIREITA</span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '16px', fontSize: '11px' }}>
            <button style={{ padding: '4px 12px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>Frente</button>
            <button style={{ padding: '4px 12px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>Verso</button>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
            <button style={{ flex: 1, padding: '10px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Salvar</button>
            <button style={{ flex: 1, padding: '10px', backgroundColor: '#FF69B4', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Próximo →</button>
          </div>
        </PhoneFrame>

        {/* ====== TELA 5: DIÁRIO EPILEPSIA ====== */}
        <PhoneFrame title="Diário Epilepsia - Formulário">
          <h3 style={{ color: '#FF69B4', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>Quando teve o episódio?</h3>

          {/* Mini Calendário */}
          <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '10px' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Junho 2026</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} style={{ fontWeight: 'bold', color: '#999', fontSize: '9px' }}>{d}</span>)}
              {Array.from({ length: 30 }).map((_, i) => (
                <button key={i} style={{ padding: '4px', border: i === 16 ? '2px solid #FF69B4' : '1px solid #ddd', backgroundColor: i === 16 ? '#FFE0F0' : 'white', borderRadius: '3px', cursor: 'pointer', fontSize: '9px', fontWeight: i === 16 ? 'bold' : 'normal' }}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Perguntas Sim/Não */}
          <h4 style={{ margin: '16px 0 12px 0', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Perguntas</h4>

          {[
            'Teve perda de consciência?',
            'Precisou ir ao hospital?',
            'Usou medicação corretamente?'
          ].map((q, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '500' }}>{q}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ flex: 1, padding: '6px', backgroundColor: i % 2 === 0 ? '#f5f5f5' : '#FF69B4', color: i % 2 === 0 ? '#333' : 'white', border: i % 2 === 0 ? '1px solid #ddd' : 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>☐ Não</button>
                <button style={{ flex: 1, padding: '6px', backgroundColor: i % 2 === 0 ? '#FF69B4' : '#f5f5f5', color: i % 2 === 0 ? 'white' : '#333', border: i % 2 === 0 ? 'none' : '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>☑ Sim</button>
              </div>
            </div>
          ))}

          {/* Pergunta Numérica */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '500' }}>Quanto tempo demorou?</p>
            <input type="number" placeholder="Minutos" style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button style={{ flex: 1, padding: '10px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Salvar</button>
            <button style={{ flex: 1, padding: '10px', backgroundColor: '#FF69B4', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Próximo →</button>
          </div>
        </PhoneFrame>

      </div>

      {/* ====== DASHBOARD MÉDICO (Web) ====== */}
      <div style={{ maxWidth: '1200px', margin: '80px auto 0' }}>
        <h2 style={{ color: '#1B5FA8', marginBottom: '24px', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>🖥️ Dashboard Médico (Web)</h2>
        
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          
          {/* Header */}
          <div style={{ backgroundColor: '#1B5FA8', color: 'white', padding: '20px', marginBottom: '28px', borderRadius: '8px' }}>
            <h1 style={{ margin: '0', fontSize: '22px', fontWeight: 'bold' }}>Dashboard Dr. Helton Bruno</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.95 }}>Neurologista • Bem-vindo de volta</p>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <KpiCard title="Pacientes Ativos" value="12" icon="👥" color="#1B5FA8" />
            <KpiCard title="Demandas Pendentes" value="5" icon="📋" color="#FF69B4" />
            <KpiCard title="Receitas Solicitadas" value="3" icon="💊" color="#FFA500" />
            <KpiCard title="Taxa de Resposta" value="95%" icon="✅" color="#4CAF50" />
          </div>

          {/* Demandas Recentes */}
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>Demandas Recentes</h3>

          <div style={{ display: 'grid', gap: '12px' }}>
            <DemandCard 
              priority="URGENTE" 
              icon="🚨"
              title="Crise epiléptica registrada" 
              patient="João Silva" 
              time="23 minutos atrás" 
              color="#FF9800" 
            />
            <DemandCard 
              priority="ELETIVA" 
              icon="⏱️"
              title="Solicitar renovação de receita" 
              patient="Maria Santos" 
              time="2 horas atrás" 
              color="#FFD700" 
            />
            <DemandCard 
              priority="INFORMACIONAL" 
              icon="ℹ️"
              title="Envio de resultado de exame" 
              patient="Carlos Junior" 
              time="5 horas atrás" 
              color="#2196F3" 
            />
          </div>
        </div>
      </div>

    </div>
  );
}

// ========== COMPONENTES AUXILIARES ==========

function PhoneFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      width: '375px',
      height: '812px',
      backgroundColor: 'white',
      borderRadius: '50px',
      border: '14px solid #1a1a1a',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.2)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      fontFamily: 'inherit'
    }}>
      {/* Notch */}
      <div style={{ backgroundColor: '#000', height: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '20px', paddingRight: '20px', fontSize: '11px', color: '#888', fontWeight: 'bold', letterSpacing: '0.5px' }}>
        <span>12:59</span>
        <span>●●● ◉ 14</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '60px', position: 'relative' }}>
        {children}
      </div>

      {/* Label */}
      <div style={{ position: 'absolute', bottom: '-45px', left: '0', right: '0', textAlign: 'center', fontSize: '12px', color: '#666', fontWeight: 'bold', marginTop: '12px' }}>
        {title}
      </div>
    </div>
  );
}

function ButtonSecondary({ children }: { children: React.ReactNode }) {
  return (
    <button style={{
      padding: '16px 12px',
      backgroundColor: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '11px',
      fontWeight: '500',
      cursor: 'pointer',
      minHeight: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: '#333'
    }}>
      {children}
    </button>
  );
}

function KpiCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  return (
    <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center', borderTop: `4px solid ${color}` }}>
      <p style={{ margin: '0 0 8px 0', fontSize: '28px' }}>{icon}</p>
      <p style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold', color }}>{value}</p>
      <p style={{ margin: '0', fontSize: '12px', color: '#666', fontWeight: '500' }}>{title}</p>
    </div>
  );
}

function DemandCard({ priority, icon, title, patient, time, color }: any) {
  return (
    <div style={{ backgroundColor: '#f5f5f5', borderLeft: `5px solid ${color}`, padding: '16px', borderRadius: '6px', cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold', color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>● {priority}</p>
      </div>
      <p style={{ margin: '6px 0 4px 0', fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{title}</p>
      <p style={{ margin: '2px 0 2px 0', fontSize: '12px', color: '#666' }}>👤 {patient}</p>
      <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#999' }}>⏰ {time}</p>
    </div>
  );
}
