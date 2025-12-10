import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Base64URL 解码
function base64UrlDecode(str) {
  // 将 Base64URL 转换为标准 Base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // 补齐 padding
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    return null;
  }
}

// 解析 JWT
function parseJWT(token) {
  if (!token || typeof token !== 'string') {
    return { isValid: false, error: 'Token 为空' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { isValid: false, error: 'JWT 格式错误：应该包含3个部分（用.分隔）' };
  }

  const [headerPart, payloadPart, signaturePart] = parts;

  // 解析 Header
  const headerJson = base64UrlDecode(headerPart);
  if (!headerJson) {
    return { isValid: false, error: 'Header 解码失败' };
  }

  let header;
  try {
    header = JSON.parse(headerJson);
  } catch (e) {
    return { isValid: false, error: 'Header 不是有效的 JSON' };
  }

  // 解析 Payload
  const payloadJson = base64UrlDecode(payloadPart);
  if (!payloadJson) {
    return { isValid: false, error: 'Payload 解码失败' };
  }

  let payload;
  try {
    payload = JSON.parse(payloadJson);
  } catch (e) {
    return { isValid: false, error: 'Payload 不是有效的 JSON' };
  }

  return {
    isValid: true,
    header,
    payload,
    signature: signaturePart,
    parts: { header: headerPart, payload: payloadPart, signature: signaturePart }
  };
}

// 格式化 JSON
function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

// 格式化时间戳
function formatTimestamp(timestamp) {
  if (typeof timestamp !== 'number') return null;
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// 检查是否过期
function isExpired(exp) {
  if (typeof exp !== 'number') return null;
  return Date.now() > exp * 1000;
}

// 示例 JWT
const EXAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNzM1Njg5NjAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

function App() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('json'); // json | table
  const [copySuccess, setCopySuccess] = useState('');

  const handleParse = useCallback(() => {
    if (!token.trim()) {
      setResult(null);
      return;
    }
    const parsed = parseJWT(token);
    setResult(parsed);
  }, [token]);

  useEffect(() => {
    handleParse();
  }, [handleParse]);

  const handleClear = () => {
    setToken('');
    setResult(null);
  };

  const handleExample = () => {
    setToken(EXAMPLE_JWT);
  };

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 高亮显示 JWT 各部分
  const renderHighlightedToken = () => {
    if (!result || !result.isValid || !result.parts) {
      return <span className="token-text">{token}</span>;
    }

    return (
      <span className="token-text">
        <span className="token-header">{result.parts.header}</span>
        <span className="token-dot">.</span>
        <span className="token-payload">{result.parts.payload}</span>
        <span className="token-dot">.</span>
        <span className="token-signature">{result.parts.signature}</span>
      </span>
    );
  };

  // 渲染 Claims 表格
  const renderClaimsTable = (data, title) => {
    const knownClaims = {
      alg: '算法',
      typ: '类型',
      sub: '主题',
      iss: '签发者',
      aud: '受众',
      exp: '过期时间',
      nbf: '生效时间',
      iat: '签发时间',
      jti: 'JWT ID',
      name: '名称',
      admin: '管理员',
      optr: '操作者'
    };

    return (
      <div className="claims-table">
        <table>
          <thead>
            <tr>
              <th>字段</th>
              <th>说明</th>
              <th>值</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([key, value]) => {
              let displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
              let extraInfo = null;

              // 时间戳字段特殊处理
              if (['exp', 'nbf', 'iat'].includes(key) && typeof value === 'number') {
                const formatted = formatTimestamp(value);
                if (key === 'exp') {
                  const expired = isExpired(value);
                  extraInfo = (
                    <span className={expired ? 'expired' : 'valid'}>
                      {formatted} ({expired ? '已过期' : '未过期'})
                    </span>
                  );
                } else {
                  extraInfo = <span className="time-info">{formatted}</span>;
                }
              }

              return (
                <tr key={key}>
                  <td className="claim-key">{key}</td>
                  <td className="claim-desc">{knownClaims[key] || '-'}</td>
                  <td className="claim-value">
                    {extraInfo || displayValue}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🔐</span>
          <span className="logo-text">JWT Debugger</span>
        </div>
        <p className="subtitle">本地 JSON Web Token 解析工具</p>
      </header>

      <main className="main">
        <div className="container">
          {/* 左侧 - 编码区 */}
          <div className="panel encoded-panel">
            <div className="panel-header">
              <h2>ENCODED VALUE</h2>
              <div className="panel-actions">
                <button onClick={handleExample} className="btn btn-secondary">
                  示例
                </button>
                <button onClick={() => handleCopy(token, 'token')} className="btn btn-secondary">
                  {copySuccess === 'token' ? '已复制!' : '复制'}
                </button>
                <button onClick={handleClear} className="btn btn-danger">
                  清除
                </button>
              </div>
            </div>

            <div className="input-wrapper">
              <div className="status-bar">
                {result && (
                  <span className={`status ${result.isValid ? 'valid' : 'invalid'}`}>
                    {result.isValid ? '✓ Valid JWT' : '✗ Invalid JWT'}
                  </span>
                )}
              </div>
              <textarea
                className="token-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="粘贴你的 JWT 到这里..."
                spellCheck="false"
              />
              {token && result?.isValid && (
                <div className="highlighted-token">
                  {renderHighlightedToken()}
                </div>
              )}
            </div>

            {result && !result.isValid && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {result.error}
              </div>
            )}
          </div>

          {/* 右侧 - 解码区 */}
          <div className="panel decoded-panel">
            {/* Header */}
            <div className="decoded-section">
              <div className="section-header">
                <h3>DECODED HEADER</h3>
                <div className="tab-buttons">
                  <button
                    className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
                    onClick={() => setActiveTab('json')}
                  >
                    JSON
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                    onClick={() => setActiveTab('table')}
                  >
                    表格
                  </button>
                  {result?.isValid && (
                    <button
                      className="btn btn-small"
                      onClick={() => handleCopy(formatJSON(result.header), 'header')}
                    >
                      {copySuccess === 'header' ? '已复制!' : '复制'}
                    </button>
                  )}
                </div>
              </div>
              <div className="code-block header-block">
                {result?.isValid ? (
                  activeTab === 'json' ? (
                    <pre>{formatJSON(result.header)}</pre>
                  ) : (
                    renderClaimsTable(result.header, 'Header')
                  )
                ) : (
                  <pre className="placeholder">// Header 将在这里显示</pre>
                )}
              </div>
            </div>

            {/* Payload */}
            <div className="decoded-section">
              <div className="section-header">
                <h3>DECODED PAYLOAD</h3>
                {result?.isValid && (
                  <button
                    className="btn btn-small"
                    onClick={() => handleCopy(formatJSON(result.payload), 'payload')}
                  >
                    {copySuccess === 'payload' ? '已复制!' : '复制'}
                  </button>
                )}
              </div>
              <div className="code-block payload-block">
                {result?.isValid ? (
                  activeTab === 'json' ? (
                    <pre>{formatJSON(result.payload)}</pre>
                  ) : (
                    renderClaimsTable(result.payload, 'Payload')
                  )
                ) : (
                  <pre className="placeholder">// Payload 将在这里显示</pre>
                )}
              </div>
            </div>

            {/* Signature */}
            <div className="decoded-section">
              <div className="section-header">
                <h3>SIGNATURE</h3>
              </div>
              <div className="code-block signature-block">
                {result?.isValid ? (
                  <div className="signature-info">
                    <p className="signature-algo">
                      算法: <span className="algo-value">{result.header.alg || 'Unknown'}</span>
                    </p>
                    <p className="signature-note">
                      ⚠️ 签名验证需要密钥，此工具仅做解码展示
                    </p>
                  </div>
                ) : (
                  <pre className="placeholder">// Signature 信息将在这里显示</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>
          所有 JWT 解析均在浏览器本地完成，不会发送到任何服务器。
          <br />
          <span className="footer-link">参考: <a href="https://jwt.io" target="_blank" rel="noopener noreferrer">jwt.io</a></span>
        </p>
      </footer>
    </div>
  );
}

export default App;
