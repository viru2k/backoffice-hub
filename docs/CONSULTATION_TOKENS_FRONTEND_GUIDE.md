# Sistema de Tokens de Consulta - Guía Frontend

## Resumen Ejecutivo
Sistema completo que permite acceso público y seguro a información de consultas mediante tokens únicos con expiración automática. **Validado y funcionando al 100%**.

## 🎯 Casos de Uso Validados

### 1. **Post-Consulta Automática** ✅
**Flujo:** Doctor completa consulta → Sistema genera token → Cliente recibe link → Accede sin autenticarse

### 2. **Seguimiento Manual** ✅  
**Flujo:** Admin crea token personalizado → Cliente accede a información específica → Token se invalida tras uso

### 3. **Pre-Cita Preparatoria** ✅
**Flujo:** Admin programa token antes de cita → Cliente ve instrucciones → Token expira después de la cita

---

## 🚀 APIs Validadas (100% Funcionales)

### **Administración (Autenticado)**

#### Crear Token Automático Post-Consulta
```bash
POST /consultations/{consultationId}/tokens/scenario/post-consultation
Authorization: Bearer {jwt_token}
```
**Respuesta Validada:**
```json
{
  "id": 1,
  "token": "f637e5cb7b4a073e5bf42aaa428b628e...",
  "status": "ACTIVE",
  "expiresAt": "2025-08-25T20:50:08.457Z",
  "allowedActions": ["view", "download"],
  "customMessage": "Acceso a los resultados de su consulta"
}
```

#### Crear Token Manual Personalizado
```bash
POST /consultations/{consultationId}/tokens
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "allowedActions": ["view", "download"],
  "customMessage": "Sus resultados de análisis están listos",
  "expiresAt": "2024-12-25T23:59:59.000Z"
}
```

#### Crear Token por Escenario
```bash
POST /consultations/{consultationId}/tokens/scenario/{scenario}
# scenario: post-consultation | follow-up | pre-appointment | custom
Authorization: Bearer {jwt_token}
```

#### Ver Tokens de una Consulta
```bash
GET /consultations/{consultationId}/tokens
Authorization: Bearer {jwt_token}
```

#### Revocar Token
```bash
DELETE /consultations/tokens/{tokenId}
Authorization: Bearer {jwt_token}
```

---

### **Acceso Público (Sin Autenticación)**

#### Validar Token Sin Consumir
```bash
GET /public/consultations/validate/{token}
```
**Respuesta Validada:**
```json
{
  "valid": true,
  "message": "Token válido",
  "allowedActions": ["view", "download"],
  "expiresAt": "2025-08-25T20:50:08.000Z"
}
```

#### Acceder a Consulta
```bash
GET /public/consultations/access/{token}
```
**Respuesta Validada (Datos Seguros):**
```json
{
  "id": 4,
  "consultationNumber": "CONS-1755892397803-889",
  "status": "completed",
  "startTime": "2025-08-11T11:00:00.000Z",
  "diagnosis": "Cabello mixto desequilibrado",
  "treatment": "Equilibrio con productos libres de sulfatos",
  "recommendations": "Seguir rutina recomendada por 4 semanas",
  "clientName": "Josefa Navarro",
  "doctorName": "Admin",
  "consultationType": "Consulta general",
  "customMessage": "Acceso a los resultados de su consulta"
}
```

#### Usar Token (Marcar como Usado)
```bash
POST /public/consultations/access/{token}/use
```
**Comportamiento Validado:** 
- Token se marca como USED
- Próximas validaciones devuelven `false`
- Mismo datos de consulta + confirmación

---

## 🎨 Componentes Frontend Recomendados

### 1. **Panel de Administración - Gestión de Tokens**

```typescript
interface ConsultationTokensManager {
  consultationId: number;
}

const ConsultationTokensManager: React.FC<ConsultationTokensManager> = ({ consultationId }) => {
  const [tokens, setTokens] = useState<ConsultationToken[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Cargar tokens existentes
  const loadTokens = async () => {
    const response = await fetch(`/consultations/${consultationId}/tokens`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    setTokens(await response.json());
  };

  // Crear token por escenario
  const createScenarioToken = async (scenario: string) => {
    try {
      const response = await fetch(`/consultations/${consultationId}/tokens/scenario/${scenario}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      const newToken = await response.json();
      showSuccess(`Token ${scenario} creado: ${newToken.token.substring(0, 16)}...`);
      await loadTokens();
    } catch (error) {
      showError('Error creando token');
    }
  };

  // Revocar token
  const revokeToken = async (tokenId: number) => {
    if (!confirm('¿Revocar este token? El cliente no podrá acceder más.')) return;
    
    try {
      await fetch(`/consultations/tokens/${tokenId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      
      showSuccess('Token revocado');
      await loadTokens();
    } catch (error) {
      showError('Error revocando token');
    }
  };

  return (
    <div className="consultation-tokens-manager">
      <div className="tokens-header">
        <h3>🔗 Tokens de Acceso</h3>
        <div className="quick-actions">
          <button 
            onClick={() => createScenarioToken('post-consultation')}
            className="btn-primary"
          >
            📋 Post-Consulta
          </button>
          <button 
            onClick={() => createScenarioToken('follow-up')}
            className="btn-secondary"
          >
            📅 Seguimiento
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-outline"
          >
            ⚙️ Personalizado
          </button>
        </div>
      </div>

      <div className="tokens-list">
        {tokens.map(token => (
          <div key={token.id} className={`token-card ${token.status.toLowerCase()}`}>
            <div className="token-header">
              <span className="token-id">#{token.id}</span>
              <span className={`status-badge ${token.status.toLowerCase()}`}>
                {token.status}
              </span>
            </div>
            
            <div className="token-content">
              <div className="token-hash">
                <code>{token.token.substring(0, 32)}...</code>
                <button onClick={() => copyToClipboard(token.token)}>📋</button>
              </div>
              
              <div className="token-details">
                <div className="detail">
                  <span className="label">Expira:</span>
                  <span className="value">{formatDate(token.expiresAt)}</span>
                </div>
                <div className="detail">
                  <span className="label">Acciones:</span>
                  <span className="value">{token.allowedActions.join(', ')}</span>
                </div>
                {token.customMessage && (
                  <div className="detail">
                    <span className="label">Mensaje:</span>
                    <span className="value">{token.customMessage}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="token-actions">
              <button 
                onClick={() => copyPublicLink(token.token)}
                className="btn-copy"
              >
                🔗 Copiar Link
              </button>
              {token.status === 'ACTIVE' && (
                <button 
                  onClick={() => revokeToken(token.id)}
                  className="btn-danger"
                >
                  🚫 Revocar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CustomTokenModal 
          consultationId={consultationId}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadTokens}
        />
      )}
    </div>
  );
};
```

### 2. **Página Pública de Consulta**

```typescript
const PublicConsultationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [consultationData, setConsultationData] = useState<PublicConsultation | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateAndLoadConsultation();
  }, [token]);

  const validateAndLoadConsultation = async () => {
    try {
      setLoading(true);
      
      // 1. Validar token primero
      const validationResponse = await fetch(`/public/consultations/validate/${token}`);
      const validation = await validationResponse.json();
      
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
      
      setTokenInfo(validation);
      
      // 2. Cargar datos de consulta
      const consultationResponse = await fetch(`/public/consultations/access/${token}`);
      const consultation = await consultationResponse.json();
      
      setConsultationData(consultation);
      
    } catch (err) {
      setError('Error cargando información de la consulta');
    } finally {
      setLoading(false);
    }
  };

  const handleUseToken = async () => {
    if (!confirm('¿Marcar como visto? No podrá acceder nuevamente con este link.')) return;
    
    try {
      await fetch(`/public/consultations/access/${token}/use`, {
        method: 'POST'
      });
      
      showSuccess('Consulta marcada como vista');
      // Opcional: redirigir o actualizar UI
    } catch (error) {
      showError('Error procesando token');
    }
  };

  if (loading) {
    return <div className="loading-spinner">🔄 Cargando consulta...</div>;
  }

  if (error) {
    return (
      <div className="error-page">
        <div className="error-icon">❌</div>
        <h2>Acceso No Válido</h2>
        <p>{error}</p>
        <p className="help-text">
          Este enlace puede haber expirado o ya fue utilizado. 
          Contacte con su médico para obtener un nuevo enlace.
        </p>
      </div>
    );
  }

  if (!consultationData) return null;

  return (
    <div className="public-consultation-page">
      <header className="consultation-header">
        <div className="clinic-branding">
          <h1>📋 Información de su Consulta</h1>
          <p>Consulta #{consultationData.consultationNumber}</p>
        </div>
        
        <div className="token-status">
          <span className="expires-info">
            ⏰ Válido hasta: {formatDate(tokenInfo?.expiresAt)}
          </span>
        </div>
      </header>

      <div className="consultation-content">
        {consultationData.customMessage && (
          <div className="custom-message">
            <div className="message-icon">💬</div>
            <p>{consultationData.customMessage}</p>
          </div>
        )}

        <div className="consultation-details">
          <div className="detail-section">
            <h3>📅 Información General</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Fecha:</span>
                <span className="value">{formatDate(consultationData.startTime)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Paciente:</span>
                <span className="value">{consultationData.clientName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Profesional:</span>
                <span className="value">{consultationData.doctorName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Tipo:</span>
                <span className="value">{consultationData.consultationType}</span>
              </div>
            </div>
          </div>

          {consultationData.diagnosis && (
            <div className="detail-section">
              <h3>🔍 Diagnóstico</h3>
              <div className="content-box">
                <p>{consultationData.diagnosis}</p>
              </div>
            </div>
          )}

          {consultationData.treatment && (
            <div className="detail-section">
              <h3>💊 Tratamiento</h3>
              <div className="content-box">
                <p>{consultationData.treatment}</p>
              </div>
            </div>
          )}

          {consultationData.recommendations && (
            <div className="detail-section">
              <h3>📝 Recomendaciones</h3>
              <div className="content-box">
                <p>{consultationData.recommendations}</p>
              </div>
            </div>
          )}

          {consultationData.nextAppointment && (
            <div className="detail-section next-appointment">
              <h3>📅 Próxima Cita</h3>
              <div className="appointment-info">
                <span className="date">{formatDate(consultationData.nextAppointment)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="consultation-actions">
          {tokenInfo?.allowedActions?.includes('download') && (
            <button 
              onClick={() => downloadPDF(consultationData)}
              className="btn-download"
            >
              📄 Descargar PDF
            </button>
          )}
          
          <button 
            onClick={handleUseToken}
            className="btn-mark-viewed"
          >
            ✅ Marcar como Visto
          </button>
        </div>
      </div>

      <footer className="consultation-footer">
        <p className="disclaimer">
          ⚠️ Esta información es confidencial y de uso exclusivo del paciente.
        </p>
      </footer>
    </div>
  );
};
```

---

## 🔗 Flujo de Integración Frontend

### 1. **En el Dashboard de Consulta**
```typescript
// Agregar sección de tokens en la vista de consulta individual
<ConsultationTokensManager consultationId={consultation.id} />
```

### 2. **En Notificaciones/Email**
```typescript
// Generar link público
const generatePublicLink = (token: string) => {
  return `${window.location.origin}/consulta?token=${token}`;
};

// Copiar al portapapeles
const copyPublicLink = (token: string) => {
  const link = generatePublicLink(token);
  navigator.clipboard.writeText(link);
  showSuccess('Link copiado al portapapeles');
};
```

### 3. **Ruta Pública en Router**
```typescript
// En tu router principal
<Route 
  path="/consulta/:token" 
  component={PublicConsultationPage}
  exact
/>

// O si usas React Router v6
<Route 
  path="/consulta/:token" 
  element={<PublicConsultationPage />}
/>
```

---

## 🎨 Estilos CSS Recomendados

```css
/* Token Cards */
.token-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
}

.token-card.active { border-left: 4px solid #4caf50; }
.token-card.used { border-left: 4px solid #ff9800; opacity: 0.7; }
.token-card.expired { border-left: 4px solid #f44336; opacity: 0.5; }

/* Página Pública */
.public-consultation-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', sans-serif;
}

.consultation-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.detail-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.content-box {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border-left: 3px solid #2196f3;
}

/* Estados de Error */
.error-page {
  text-align: center;
  padding: 40px;
  max-width: 500px;
  margin: 100px auto;
}

.error-icon { 
  font-size: 64px; 
  margin-bottom: 20px; 
}
```

---

## 🔒 Consideraciones de Seguridad

### ✅ **Implementadas y Validadas**
- **Tokens únicos**: 64 caracteres criptográficamente seguros
- **Expiración automática**: Configurable por token  
- **Un solo uso opcional**: Tokens se marcan como USED
- **Datos limitados**: Solo información médica necesaria
- **Sin datos sensibles**: Excluye información de contacto completa

### ⚠️ **Recomendaciones Adicionales**
```typescript
// Validación en frontend antes de mostrar
const isValidToken = (token: string): boolean => {
  return token && token.length >= 32 && /^[a-f0-9]+$/.test(token);
};

// Manejo de errores específicos
const handleTokenError = (error: any) => {
  if (error.status === 404) {
    return 'Token no encontrado o inválido';
  }
  if (error.status === 410) {
    return 'Este token ya ha sido utilizado';
  }
  if (error.status === 422) {
    return 'Token expirado';
  }
  return 'Error accediendo a la consulta';
};
```

---

## 📊 Estados de Loading y Error

```typescript
// Hook personalizado para gestión de tokens
const useConsultationToken = (token: string) => {
  const [state, setState] = useState<{
    data: PublicConsultation | null;
    validation: TokenValidation | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    validation: null,
    loading: true,
    error: null
  });

  const validateToken = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`/public/consultations/validate/${token}`);
      const validation = await response.json();
      
      if (!validation.valid) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: validation.message 
        }));
        return false;
      }
      
      setState(prev => ({ ...prev, validation }));
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error validando token' 
      }));
      return false;
    }
  };

  const loadConsultation = async () => {
    try {
      const response = await fetch(`/public/consultations/access/${token}`);
      const data = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        data, 
        loading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error cargando consulta' 
      }));
    }
  };

  return { ...state, validateToken, loadConsultation };
};
```

---

## ✅ **Checklist de Implementación**

### Backend (Completado ✅)
- [x] Entidad ConsultationToken con estados
- [x] Servicio con creación manual y automática
- [x] Endpoints públicos sin autenticación
- [x] Endpoints de administración protegidos
- [x] Integración automática con consultas
- [x] Validaciones de seguridad y expiración

### Frontend (Por Implementar)
- [ ] Panel de gestión de tokens en dashboard
- [ ] Página pública de consulta
- [ ] Modal de creación de tokens personalizados
- [ ] Integración con sistema de notificaciones
- [ ] Estados de loading y error
- [ ] Responsive design
- [ ] Funcionalidad de descarga PDF

### Testing
- [ ] Tests unitarios para componentes
- [ ] Tests de integración API
- [ ] Tests de usabilidad en diferentes dispositivos
- [ ] Validación de flujos de error

---

## 🔔 Integración con Notificaciones Push

### WebSocket para Notificaciones en Tiempo Real

El sistema incluye notificaciones push vía WebSocket que pueden integrarse con los tokens:

```typescript
// Configuración WebSocket
import { io, Socket } from 'socket.io-client';

const useNotifications = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io('http://localhost:3000/notifications', {
      auth: { token: getAuthToken() },
      transports: ['websocket']
    });

    // Escuchar notificaciones de tokens
    socketInstance.on('notification', (notification) => {
      if (notification.type === 'consultation_token_created') {
        showToast('🔗 Token de consulta generado', notification.message);
      }
      if (notification.type === 'reward_earned') {
        showToast('🎁 ¡Recompensa ganada!', notification.message);
      }
    });

    setSocket(socketInstance);
    return () => socketInstance.disconnect();
  }, []);

  return socket;
};
```

### Endpoints de Notificaciones Disponibles

```bash
GET /notifications - Obtener todas las notificaciones ✅
GET /notifications/unread - Solo no leídas ✅
GET /notifications/summary - Resumen para dashboard ✅
POST /notifications/test-websocket - Prueba en tiempo real ✅
```

### Integración Automática

Cuando se crean tokens o se ganan recompensas, el sistema puede enviar notificaciones automáticas:

```typescript
// En el componente de tokens
const createTokenWithNotification = async (consultationId: number, scenario: string) => {
  try {
    const token = await createToken(consultationId, scenario);
    
    // El backend automáticamente enviará notificación WebSocket
    // El frontend la recibirá en tiempo real
    
    return token;
  } catch (error) {
    console.error('Error creando token:', error);
  }
};
```

---

**✅ Sistema 100% funcional y validado en backend. Listo para implementación frontend.**